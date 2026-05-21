'use client'

import { useState } from 'react'
import { Users, ChevronLeft, Plus, Trash2, Send } from 'lucide-react'
import { cn } from '@tera-sm/utils'
import type { InviteTeamDto } from '@tera-sm/types'

interface Invite {
  email: string
  role: string
}

const ROLES = [
  { value: 'TEACHER', label: 'Teacher / Lecturer' },
  { value: 'REGISTRAR', label: 'Registrar' },
  { value: 'FINANCE_ADMIN', label: 'Finance Admin' },
  { value: 'HR_ADMIN', label: 'HR Admin' },
  { value: 'STAFF', label: 'Staff' },
]

interface Props {
  onNext: (data: InviteTeamDto) => void
  onSkip: () => void
  onBack: () => void
  saving: boolean
}

export function StepInviteTeam({ onNext, onSkip, onBack, saving }: Props) {
  const [invites, setInvites] = useState<Invite[]>([{ email: '', role: 'TEACHER' }])
  const [errors, setErrors] = useState<Record<number, string>>({})

  function addRow() {
    if (invites.length >= 10) return
    setInvites((prev) => [...prev, { email: '', role: 'TEACHER' }])
  }

  function removeRow(i: number) {
    setInvites((prev) => prev.filter((_, idx) => idx !== i))
    setErrors((prev) => {
      const next = { ...prev }
      delete next[i]
      return next
    })
  }

  function updateRow(i: number, field: keyof Invite, value: string) {
    setInvites((prev) => prev.map((inv, idx) => (idx === i ? { ...inv, [field]: value } : inv)))
    if (errors[i]) setErrors((prev) => { const n = { ...prev }; delete n[i]; return n })
  }

  function validate(): boolean {
    const newErrors: Record<number, string> = {}
    invites.forEach((inv, i) => {
      if (inv.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inv.email)) {
        newErrors[i] = 'Enter a valid email'
      }
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit() {
    if (!validate()) return
    const validInvites = invites.filter((inv) => inv.email.trim())
    onNext({ invites: validInvites as any })
  }

  return (
    <div className="rounded-2xl border bg-white p-8 shadow-sm space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
          <Users className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Invite Your Team</h2>
          <p className="text-sm text-gray-400">
            Add teachers and staff — or skip and do it later
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {invites.map((invite, i) => (
          <div key={i} className="flex gap-2">
            <div className="flex-1 space-y-1">
              <input
                type="email"
                value={invite.email}
                onChange={(e) => updateRow(i, 'email', e.target.value)}
                placeholder="colleague@school.edu"
                className={cn(
                  'w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none transition',
                  'focus:ring-2 focus:ring-blue-500',
                  errors[i] && 'border-red-400'
                )}
              />
              {errors[i] && <p className="text-xs text-red-500">{errors[i]}</p>}
            </div>
            <select
              value={invite.role}
              onChange={(e) => updateRow(i, 'role', e.target.value)}
              className="rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            {invites.length > 1 && (
              <button
                type="button"
                onClick={() => removeRow(i)}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border text-gray-400 hover:border-red-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}

        {invites.length < 10 && (
          <button
            type="button"
            onClick={addRow}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            <Plus className="h-4 w-4" /> Add another
          </button>
        )}
      </div>

      <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 text-sm text-blue-700">
        Invitations will be sent by email. Team members will be prompted to set up their accounts.
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        <button
          type="button"
          onClick={onSkip}
          disabled={saving}
          className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Skip for now
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Send className="h-4 w-4" />
          {saving ? 'Saving...' : 'Send Invites & Continue'}
        </button>
      </div>
    </div>
  )
}
