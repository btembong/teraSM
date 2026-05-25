/**
 * RBAC — Role-Based Access Control
 *
 * Architecture:
 *   Layer 1: DEFAULT_PERMISSIONS (TypeScript constant — no DB, always fast)
 *   Layer 2: RolePermission rows (tenant-level overrides for a role)
 *   Layer 3: UserPermissionOverride rows (per-user grants / revokes)
 *
 * Resolution order: Layer 3 → Layer 2 → Layer 1 (first match wins)
 */

import { prisma } from '@/lib/prisma'

// ─── Permission registry ──────────────────────────────────────────────────────

export type PermKey =
  // Students
  | 'students.view' | 'students.create' | 'students.edit' | 'students.delete'
  // Admissions
  | 'admissions.view' | 'admissions.review' | 'admissions.decide' | 'admissions.convert'
  // Academics
  | 'academics.view' | 'academics.manage'
  // Finance
  | 'finance.view' | 'finance.manage' | 'finance.fees' | 'finance.scholarships'
  // LMS
  | 'lms.view' | 'lms.manage'
  // HR
  | 'hr.view' | 'hr.manage' | 'hr.payroll'
  // Live classes
  | 'live_classes.view' | 'live_classes.manage'
  // Announcements
  | 'announcements.view' | 'announcements.create' | 'announcements.broadcast'
  // Reports
  | 'reports.view' | 'reports.export'
  // Settings
  | 'settings.view' | 'settings.manage' | 'settings.api_keys' | 'settings.roles'
  // Users
  | 'users.view' | 'users.invite' | 'users.manage' | 'users.deactivate'

export type AdminRole = 'TENANT_ADMIN' | 'REGISTRAR' | 'FINANCE_ADMIN' | 'HR_ADMIN' | 'TEACHER' | 'STAFF'

// Roles shown in the RBAC management UI (student/parent managed separately)
export const MANAGED_ROLES: AdminRole[] = [
  'TENANT_ADMIN', 'REGISTRAR', 'FINANCE_ADMIN', 'HR_ADMIN', 'TEACHER', 'STAFF',
]

export const ROLE_LABELS: Record<AdminRole, string> = {
  TENANT_ADMIN:  'School Admin',
  REGISTRAR:     'Registrar',
  FINANCE_ADMIN: 'Finance Admin',
  HR_ADMIN:      'HR Admin',
  TEACHER:       'Teacher',
  STAFF:         'Staff',
}

// ─── Permission metadata ──────────────────────────────────────────────────────

export interface PermMeta {
  key: PermKey
  label: string
  description: string
}

export interface PermModule {
  module: string
  label: string
  perms: PermMeta[]
}

export const PERMISSION_MODULES: PermModule[] = [
  {
    module: 'students',
    label: 'Students',
    perms: [
      { key: 'students.view',   label: 'View students',   description: 'See student list, profiles, and records' },
      { key: 'students.create', label: 'Add students',    description: 'Manually add or import student accounts' },
      { key: 'students.edit',   label: 'Edit students',   description: 'Update student profile and academic info' },
      { key: 'students.delete', label: 'Delete students', description: 'Remove student accounts permanently' },
    ],
  },
  {
    module: 'admissions',
    label: 'Admissions',
    perms: [
      { key: 'admissions.view',    label: 'View applications',   description: 'See all admission applications' },
      { key: 'admissions.review',  label: 'Review applications', description: 'Change status, verify documents, add notes' },
      { key: 'admissions.decide',  label: 'Make decisions',      description: 'Accept, reject, or waitlist applicants' },
      { key: 'admissions.convert', label: 'Convert to student',  description: 'Create student account from accepted applicant' },
    ],
  },
  {
    module: 'academics',
    label: 'Academics',
    perms: [
      { key: 'academics.view',   label: 'View academics',   description: 'View courses, offerings, timetables, calendar' },
      { key: 'academics.manage', label: 'Manage academics', description: 'Create/edit departments, courses, programs, rooms, grading' },
    ],
  },
  {
    module: 'finance',
    label: 'Finance',
    perms: [
      { key: 'finance.view',         label: 'View finances',         description: 'See invoices, payments, balances' },
      { key: 'finance.manage',       label: 'Manage finances',       description: 'Create invoices, record payments, generate reports' },
      { key: 'finance.fees',         label: 'Manage fee structures', description: 'Create and edit fee templates and structures' },
      { key: 'finance.scholarships', label: 'Manage scholarships',   description: 'Create, award, and revoke scholarships' },
    ],
  },
  {
    module: 'lms',
    label: 'LMS',
    perms: [
      { key: 'lms.view',   label: 'View LMS',    description: 'Access course content, assignments, discussions' },
      { key: 'lms.manage', label: 'Manage LMS',  description: 'Create content, assignments, quizzes, grade submissions' },
    ],
  },
  {
    module: 'hr',
    label: 'HR',
    perms: [
      { key: 'hr.view',    label: 'View HR',        description: 'See employee records and leave requests' },
      { key: 'hr.manage',  label: 'Manage HR',      description: 'Add/edit employees, approve leave, manage onboarding' },
      { key: 'hr.payroll', label: 'Payroll access', description: 'Run payroll, generate payslips, view salary data' },
    ],
  },
  {
    module: 'live_classes',
    label: 'Live Classes',
    perms: [
      { key: 'live_classes.view',   label: 'View sessions',   description: 'See scheduled live class sessions' },
      { key: 'live_classes.manage', label: 'Manage sessions', description: 'Create, start, end, and cancel live classes' },
    ],
  },
  {
    module: 'announcements',
    label: 'Announcements',
    perms: [
      { key: 'announcements.view',      label: 'View announcements',      description: 'Read all announcements' },
      { key: 'announcements.create',    label: 'Create announcements',    description: 'Post announcements to specific groups' },
      { key: 'announcements.broadcast', label: 'School-wide broadcast',   description: 'Send announcements to the entire school' },
    ],
  },
  {
    module: 'reports',
    label: 'Reports',
    perms: [
      { key: 'reports.view',   label: 'View reports',   description: 'See analytics dashboards and summaries' },
      { key: 'reports.export', label: 'Export reports', description: 'Download reports as PDF, Excel, or CSV' },
    ],
  },
  {
    module: 'settings',
    label: 'Settings',
    perms: [
      { key: 'settings.view',     label: 'View settings',     description: 'Access the school settings area' },
      { key: 'settings.manage',   label: 'Manage settings',   description: 'Edit school profile, billing, notifications' },
      { key: 'settings.api_keys', label: 'API key management', description: 'Create and revoke API keys and webhooks' },
      { key: 'settings.roles',    label: 'Role management',   description: 'Configure RBAC permissions for all roles' },
    ],
  },
  {
    module: 'users',
    label: 'Users',
    perms: [
      { key: 'users.view',       label: 'View users',       description: 'See the full user directory' },
      { key: 'users.invite',     label: 'Invite users',     description: 'Send invitations and create invite links' },
      { key: 'users.manage',     label: 'Manage users',     description: 'Edit roles, reset passwords, change status' },
      { key: 'users.deactivate', label: 'Deactivate users', description: 'Suspend or permanently remove user accounts' },
    ],
  },
]

// Flat list of all perm keys for iteration
export const ALL_PERM_KEYS: PermKey[] = PERMISSION_MODULES.flatMap(m => m.perms.map(p => p.key))

// ─── Default permissions ──────────────────────────────────────────────────────

// true = granted by default for that role
const D = true
const _ = false

// Order matches MANAGED_ROLES: TENANT_ADMIN, REGISTRAR, FINANCE_ADMIN, HR_ADMIN, TEACHER, STAFF
const DEFAULT_MATRIX: Record<PermKey, [boolean, boolean, boolean, boolean, boolean, boolean]> = {
  // Students
  'students.view':           [D, D, D, _, D, _],
  'students.create':         [D, D, _, _, _, _],
  'students.edit':           [D, D, _, _, _, _],
  'students.delete':         [D, _, _, _, _, _],
  // Admissions
  'admissions.view':         [D, D, _, _, _, _],
  'admissions.review':       [D, D, _, _, _, _],
  'admissions.decide':       [D, D, _, _, _, _],
  'admissions.convert':      [D, _, _, _, _, _],
  // Academics
  'academics.view':          [D, D, _, _, D, D],
  'academics.manage':        [D, D, _, _, _, _],
  // Finance
  'finance.view':            [D, D, D, _, _, _],
  'finance.manage':          [D, _, D, _, _, _],
  'finance.fees':            [D, _, D, _, _, _],
  'finance.scholarships':    [D, _, D, _, _, _],
  // LMS
  'lms.view':                [D, _, _, _, D, D],
  'lms.manage':              [D, _, _, _, D, _],
  // HR
  'hr.view':                 [D, _, _, D, _, _],
  'hr.manage':               [D, _, _, D, _, _],
  'hr.payroll':              [D, _, _, D, _, _],
  // Live classes
  'live_classes.view':       [D, _, _, _, D, D],
  'live_classes.manage':     [D, _, _, _, D, _],
  // Announcements
  'announcements.view':      [D, D, D, D, D, D],
  'announcements.create':    [D, D, D, D, _, _],
  'announcements.broadcast': [D, _, _, _, _, _],
  // Reports
  'reports.view':            [D, D, D, D, _, _],
  'reports.export':          [D, D, D, D, _, _],
  // Settings
  'settings.view':           [D, _, _, _, _, _],
  'settings.manage':         [D, _, _, _, _, _],
  'settings.api_keys':       [D, _, _, _, _, _],
  'settings.roles':          [D, _, _, _, _, _],
  // Users
  'users.view':              [D, D, _, D, _, _],
  'users.invite':            [D, D, _, D, _, _],
  'users.manage':            [D, _, _, _, _, _],
  'users.deactivate':        [D, _, _, _, _, _],
}

/** Returns the default granted state for a role + perm key (no DB) */
export function defaultGranted(role: string, permKey: PermKey): boolean {
  const roleIdx = MANAGED_ROLES.indexOf(role as AdminRole)
  if (roleIdx === -1) return false
  return DEFAULT_MATRIX[permKey]?.[roleIdx] ?? false
}

/** Full default permission map for a role (permKey → boolean) */
export function defaultPermissions(role: string): Record<PermKey, boolean> {
  const result = {} as Record<PermKey, boolean>
  for (const key of ALL_PERM_KEYS) {
    result[key] = defaultGranted(role, key)
  }
  return result
}

// ─── Permission resolution ────────────────────────────────────────────────────

/**
 * Check if a specific user has a specific permission.
 * Resolves: user override → role override → default.
 */
export async function hasPermission(
  tenantId: string,
  userId: string,
  role: string,
  permKey: PermKey,
): Promise<boolean> {
  // Layer 3: user-level override
  const userOverride = await (prisma as any).userPermissionOverride.findUnique({
    where: { tenantId_userId_permKey: { tenantId, userId, permKey } },
  }).catch(() => null)
  if (userOverride !== null) return userOverride.granted

  // Layer 2: role-level tenant override
  const roleOverride = await (prisma as any).rolePermission.findUnique({
    where: { tenantId_role_permKey: { tenantId, role, permKey } },
  }).catch(() => null)
  if (roleOverride !== null) return roleOverride.granted

  // Layer 1: default
  return defaultGranted(role, permKey)
}

/**
 * Returns the effective permission map for a role in a tenant.
 * Merges defaults with tenant role overrides.
 */
export async function getRolePermissions(
  tenantId: string,
  role: string,
): Promise<Record<PermKey, boolean>> {
  const defaults = defaultPermissions(role)

  const overrides: { permKey: string; granted: boolean }[] = await (prisma as any).rolePermission
    .findMany({ where: { tenantId, role } })
    .catch(() => [])

  for (const o of overrides) {
    if (o.permKey in defaults) {
      defaults[o.permKey as PermKey] = o.granted
    }
  }
  return defaults
}

/**
 * Returns the effective permission map for a specific user.
 * Merges role-level effective permissions with user-level overrides.
 */
export async function getUserEffectivePermissions(
  tenantId: string,
  userId: string,
  role: string,
): Promise<Record<PermKey, boolean>> {
  const rolePerms = await getRolePermissions(tenantId, role)

  const userOverrides: { permKey: string; granted: boolean }[] = await (prisma as any).userPermissionOverride
    .findMany({ where: { tenantId, userId } })
    .catch(() => [])

  for (const o of userOverrides) {
    if (o.permKey in rolePerms) {
      rolePerms[o.permKey as PermKey] = o.granted
    }
  }
  return rolePerms
}
