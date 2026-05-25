'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Shield, Users, Search, Loader2, RefreshCw, Info,
  ChevronDown, ChevronRight, RotateCcw, CheckCircle2,
} from 'lucide-react'
import {
  PERMISSION_MODULES, MANAGED_ROLES, ROLE_LABELS,
  ALL_PERM_KEYS, type PermKey, type AdminRole,
} from '@/lib/permissions'

// ─── Types ───────────────────────────────────────────────────────────────────

type Matrix = Record<string, Record<PermKey, boolean>>
type Override = { role: string; permKey: string; granted: boolean }
type UserRow = {
  id: string; firstName: string; lastName: string; email: string; role: string
  permissionOverrides: { permKey: string; granted: boolean }[]
}
type UserDetail = {
  user: UserRow
  effectivePerms: Record<PermKey, boolean>
  overrides: { permKey: string; granted: boolean }[]
}

// ─── Toggle switch ────────────────────────────────────────────────────────────

function Toggle({
  checked, onChange, disabled = false, isOverride = false,
}: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; isOverride?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
      } ${
        checked
          ? isOverride ? 'bg-purple-500' : 'bg-blue-500'
          : 'bg-gray-200'
      }`}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
        checked ? 'translate-x-4' : 'translate-x-0.5'
      }`} />
    </button>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function RolesPage() {
  const [tab, setTab] = useState<'roles' | 'users'>('roles')

  // ── Role matrix ──────────────────────────────────────────────────────────
  const [matrix, setMatrix]       = useState<Matrix | null>(null)
  const [defaults, setDefaults]   = useState<Matrix | null>(null)
  const [overrideSet, setOverrideSet] = useState<Set<string>>(new Set()) // "role:permKey"
  const [matrixLoading, setMatrixLoading] = useState(true)
  const [saving, setSaving]       = useState<string | null>(null)  // "role:permKey"
  const [selectedRole, setSelectedRole] = useState<AdminRole>('REGISTRAR')
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(
    PERMISSION_MODULES.map(m => m.module)
  ))
  const [toast, setToast]         = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  const loadMatrix = useCallback(async () => {
    setMatrixLoading(true)
    const data = await fetch('/api/admin/roles').then(r => r.json()).catch(() => null)
    if (data?.matrix) {
      setMatrix(data.matrix)
      // Build defaults from the matrix before overrides are applied
      // (We compute defaults client-side from the library)
      const def: Matrix = {}
      for (const role of MANAGED_ROLES) {
        def[role] = {} as Record<PermKey, boolean>
        for (const key of ALL_PERM_KEYS) {
          // defaults will be provided by the server but we'll derive from overrides
        }
      }
      const overrideKeys = new Set<string>(
        (data.overrides ?? []).map((o: Override) => `${o.role}:${o.permKey}`)
      )
      setOverrideSet(overrideKeys)
    }
    setMatrixLoading(false)
  }, [])

  useEffect(() => { loadMatrix() }, [loadMatrix])

  const togglePerm = async (role: string, permKey: PermKey, newVal: boolean) => {
    const key = `${role}:${permKey}`
    setSaving(key)

    // Optimistic update
    setMatrix(prev => prev ? {
      ...prev,
      [role]: { ...prev[role], [permKey]: newVal }
    } : prev)

    await fetch('/api/admin/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, permKey, granted: newVal }),
    })
    setOverrideSet(prev => new Set([...prev, key]))
    setSaving(null)
    showToast(`${ROLE_LABELS[role as AdminRole]} → ${permKey} set to ${newVal ? 'granted' : 'revoked'}`)
  }

  const resetPerm = async (role: string, permKey: PermKey) => {
    const key = `${role}:${permKey}`
    setSaving(key)
    await fetch('/api/admin/roles', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, permKey }),
    })
    setOverrideSet(prev => { const n = new Set(prev); n.delete(key); return n })
    await loadMatrix()
    setSaving(null)
    showToast(`${permKey} reset to default for ${ROLE_LABELS[role as AdminRole]}`)
  }

  const toggleModule = (mod: string) => {
    setExpandedModules(prev => {
      const n = new Set(prev)
      n.has(mod) ? n.delete(mod) : n.add(mod)
      return n
    })
  }

  // ── User overrides ───────────────────────────────────────────────────────
  const [userSearch, setUserSearch]     = useState('')
  const [users, setUsers]               = useState<UserRow[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null)
  const [userLoading, setUserLoading]   = useState(false)
  const [userSaving, setUserSaving]     = useState<string | null>(null)

  const searchUsers = async () => {
    setUsersLoading(true)
    const data = await fetch(`/api/admin/roles/users?search=${encodeURIComponent(userSearch)}`)
      .then(r => r.json()).catch(() => [])
    setUsers(Array.isArray(data) ? data : [])
    setUsersLoading(false)
  }

  useEffect(() => { if (tab === 'users') searchUsers() }, [tab]) // eslint-disable-line react-hooks/exhaustive-deps

  const openUserDetail = async (u: UserRow) => {
    setUserLoading(true)
    const data = await fetch(`/api/admin/roles/users/${u.id}`).then(r => r.json()).catch(() => null)
    setSelectedUser(data)
    setUserLoading(false)
  }

  const toggleUserPerm = async (userId: string, permKey: PermKey, newVal: boolean) => {
    setUserSaving(permKey)
    await fetch(`/api/admin/roles/users/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permKey, granted: newVal }),
    })
    // Refresh
    const data = await fetch(`/api/admin/roles/users/${userId}`).then(r => r.json()).catch(() => null)
    setSelectedUser(data)
    setUserSaving(null)
    showToast(`User override: ${permKey} → ${newVal ? 'granted' : 'revoked'}`)
  }

  const removeUserOverride = async (userId: string, permKey: PermKey) => {
    setUserSaving(permKey)
    await fetch(`/api/admin/roles/users/${userId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permKey }),
    })
    const data = await fetch(`/api/admin/roles/users/${userId}`).then(r => r.json()).catch(() => null)
    setSelectedUser(data)
    setUserSaving(null)
    showToast(`Override removed — ${permKey} reverts to role default`)
  }

  const overrideCountForUser = (u: UserRow) => u.permissionOverrides.length

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Roles & Permissions</h2>
          <p className="text-sm text-gray-400 mt-0.5">Customize what each role can access in your school portal</p>
        </div>
        <button onClick={loadMatrix} className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50">
          <RefreshCw className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div>
          <strong>How it works:</strong> Toggles shown in <span className="font-semibold text-blue-700">blue</span> are defaults.
          When you change a toggle it turns <span className="font-semibold text-purple-600">purple</span> to indicate a custom override.
          Reset any override to restore the default. <strong>TENANT_ADMIN always has full access</strong> and cannot be restricted.
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center gap-1 bg-blue-100 rounded-2xl p-1 w-fit">
        {([['roles', 'Role Permissions', Shield], ['users', 'User Overrides', Users]] as const).map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key as any)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${
              tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {/* ── ROLE PERMISSIONS TAB ── */}
      {tab === 'roles' && (
        matrixLoading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading permissions...
          </div>
        ) : matrix ? (
          <div className="flex gap-6">
            {/* Left: role selector */}
            <div className="w-44 flex-shrink-0">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Select Role</p>
              <div className="space-y-1">
                {MANAGED_ROLES.map(role => {
                  const overrideCount = ALL_PERM_KEYS.filter(k => overrideSet.has(`${role}:${k}`)).length
                  return (
                    <button key={role} onClick={() => setSelectedRole(role)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        selectedRole === role
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}>
                      <span>{ROLE_LABELS[role]}</span>
                      {overrideCount > 0 && (
                        <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-bold ${
                          selectedRole === role ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-700'
                        }`}>{overrideCount}</span>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Legend */}
              <div className="mt-6 space-y-2 text-xs text-gray-400">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-4 bg-blue-500 rounded-full flex items-center justify-end pr-0.5">
                    <div className="w-3 h-3 bg-white rounded-full" />
                  </div>
                  <span>Default grant</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-4 bg-purple-500 rounded-full flex items-center justify-end pr-0.5">
                    <div className="w-3 h-3 bg-white rounded-full" />
                  </div>
                  <span>Custom override</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-4 bg-gray-200 rounded-full flex items-center justify-start pl-0.5">
                    <div className="w-3 h-3 bg-white rounded-full" />
                  </div>
                  <span>Not granted</span>
                </div>
              </div>
            </div>

            {/* Right: permission modules */}
            <div className="flex-1 space-y-2">
              {PERMISSION_MODULES.map(mod => {
                const expanded = expandedModules.has(mod.module)
                const grantedCount = mod.perms.filter(p => matrix[selectedRole]?.[p.key]).length
                return (
                  <div key={mod.module} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                    {/* Module header */}
                    <button
                      onClick={() => toggleModule(mod.module)}
                      className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {expanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                        <span className="font-semibold text-gray-900 text-sm">{mod.label}</span>
                        <span className="text-xs text-gray-400">{grantedCount}/{mod.perms.length} granted</span>
                      </div>
                      {selectedRole === 'TENANT_ADMIN' && (
                        <span className="text-xs text-gray-300">Always full access</span>
                      )}
                    </button>

                    {/* Permissions */}
                    {expanded && (
                      <div className="divide-y divide-gray-50">
                        {mod.perms.map(perm => {
                          const isLocked   = selectedRole === 'TENANT_ADMIN'
                          const isOverride = overrideSet.has(`${selectedRole}:${perm.key}`)
                          const isSaving   = saving === `${selectedRole}:${perm.key}`
                          const granted    = matrix[selectedRole]?.[perm.key] ?? false

                          return (
                            <div key={perm.key} className={`flex items-center justify-between px-5 py-3 ${isLocked ? 'opacity-60' : ''}`}>
                              <div className="flex-1 min-w-0 pr-4">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium text-gray-900">{perm.label}</p>
                                  {isOverride && (
                                    <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded-full font-semibold">custom</span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-400 mt-0.5">{perm.description}</p>
                                <p className="text-xs text-gray-300 font-mono mt-0.5">{perm.key}</p>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {isSaving && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
                                {isOverride && !isLocked && (
                                  <button
                                    onClick={() => resetPerm(selectedRole, perm.key)}
                                    title="Reset to default"
                                    className="p-1 text-gray-300 hover:text-gray-500 transition-colors"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <Toggle
                                  checked={isLocked ? true : granted}
                                  onChange={v => !isLocked && !isSaving && togglePerm(selectedRole, perm.key, v)}
                                  disabled={isLocked || isSaving}
                                  isOverride={isOverride}
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">Failed to load permissions.</div>
        )
      )}

      {/* ── USER OVERRIDES TAB ── */}
      {tab === 'users' && (
        <div className="flex gap-6">
          {/* Left: user list */}
          <div className="w-72 flex-shrink-0 space-y-3">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Search users..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && searchUsers()}
                />
              </div>
              <button onClick={searchUsers} className="px-3 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
                Go
              </button>
            </div>

            {usersLoading ? (
              <div className="flex items-center justify-center py-8 gap-2 text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading...
              </div>
            ) : (
              <div className="space-y-1">
                {users.map(u => (
                  <button key={u.id} onClick={() => openUserDetail(u)}
                    className={`w-full text-left p-3 rounded-xl transition-colors border ${
                      selectedUser?.user.id === u.id
                        ? 'border-blue-200 bg-blue-50'
                        : 'border-transparent hover:bg-gray-50'
                    }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{u.firstName} {u.lastName}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{ROLE_LABELS[u.role as AdminRole] ?? u.role}</span>
                        {overrideCountForUser(u) > 0 && (
                          <p className="text-xs text-purple-600 font-semibold mt-0.5">{overrideCountForUser(u)} override{overrideCountForUser(u) !== 1 ? 's' : ''}</p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
                {users.length === 0 && !usersLoading && (
                  <p className="text-sm text-gray-400 text-center py-8">No users found.</p>
                )}
              </div>
            )}
          </div>

          {/* Right: user permission detail */}
          <div className="flex-1">
            {userLoading ? (
              <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin" /> Loading permissions...
              </div>
            ) : selectedUser ? (
              <div className="space-y-4">
                {/* User header */}
                <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600 text-sm flex-shrink-0">
                    {selectedUser.user.firstName[0]}{selectedUser.user.lastName[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{selectedUser.user.firstName} {selectedUser.user.lastName}</p>
                    <p className="text-xs text-gray-400">{selectedUser.user.email}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full font-medium">
                      {ROLE_LABELS[selectedUser.user.role as AdminRole] ?? selectedUser.user.role}
                    </span>
                    {selectedUser.overrides.length > 0 && (
                      <p className="text-xs text-purple-600 mt-1 font-semibold">{selectedUser.overrides.length} custom override{selectedUser.overrides.length !== 1 ? 's' : ''}</p>
                    )}
                  </div>
                </div>

                <p className="text-xs text-gray-500 px-1">
                  Toggles show effective permissions. <span className="text-purple-600 font-medium">Purple = user-level override</span> (supersedes role default). Click <RotateCcw className="inline w-3 h-3" /> to remove a user override.
                </p>

                {/* Permission modules */}
                {PERMISSION_MODULES.map(mod => (
                  <div key={mod.module} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-50">
                      <p className="font-semibold text-gray-900 text-sm">{mod.label}</p>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {mod.perms.map(perm => {
                        const hasOverride = selectedUser.overrides.some(o => o.permKey === perm.key)
                        const granted     = selectedUser.effectivePerms[perm.key] ?? false
                        const isSaving    = userSaving === perm.key

                        return (
                          <div key={perm.key} className="flex items-center justify-between px-5 py-3">
                            <div className="flex-1 min-w-0 pr-4">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-gray-900">{perm.label}</p>
                                {hasOverride && (
                                  <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded-full font-semibold">user override</span>
                                )}
                              </div>
                              <p className="text-xs text-gray-400 mt-0.5">{perm.description}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {isSaving && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
                              {hasOverride && (
                                <button
                                  onClick={() => removeUserOverride(selectedUser.user.id, perm.key)}
                                  title="Remove user override"
                                  className="p-1 text-gray-300 hover:text-gray-500 transition-colors"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <Toggle
                                checked={granted}
                                onChange={v => !isSaving && toggleUserPerm(selectedUser.user.id, perm.key, v)}
                                disabled={isSaving}
                                isOverride={hasOverride}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-300">
                <Users className="w-10 h-10 mb-3" />
                <p className="text-sm">Select a user to manage their permissions</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
