import { z } from 'zod'

// ── Step 1: School Info ──────────────────────────
export const SchoolInfoSchema = z.object({
  schoolName: z.string().min(2, 'School name must be at least 2 characters').max(100),
  slug: z
    .string()
    .min(2, 'Subdomain must be at least 2 characters')
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
  country: z.string().min(1, 'Select a country'),
  plan: z.enum(['STARTER', 'PRO', 'ENTERPRISE', 'UNIVERSITY']).default('STARTER'),
})
export type SchoolInfoDto = z.infer<typeof SchoolInfoSchema>

// ── Step 2: Admin Account ────────────────────────
export const AdminAccountSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required').max(50),
    lastName: z.string().min(1, 'Last name is required').max(50),
    email: z.string().email('Enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
export type AdminAccountDto = z.infer<typeof AdminAccountSchema>

// ── Full Registration Payload ────────────────────
export const RegisterTenantSchema = z.object({
  school: SchoolInfoSchema,
  admin: AdminAccountSchema,
})
export type RegisterTenantDto = z.infer<typeof RegisterTenantSchema>

// ── Onboarding: School Profile (Step 1) ─────────
export const SchoolProfileSchema = z.object({
  tagline: z.string().max(150).optional(),
  address: z.string().max(200).optional(),
  phone: z.string().max(20).optional(),
  website: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  institutionType: z.enum([
    'PRIMARY',
    'SECONDARY',
    'COLLEGE',
    'POLYTECHNIC',
    'UNIVERSITY',
    'VOCATIONAL',
  ]),
  timezone: z.string().default('UTC'),
})
export type SchoolProfileDto = z.infer<typeof SchoolProfileSchema>

// ── Onboarding: Academic Setup (Step 2) ─────────
export const AcademicSetupSchema = z.object({
  academicYear: z.string().min(4, 'e.g. 2024/2025'),
  termType: z.enum(['SEMESTER', 'TRIMESTER', 'TERM']),
  currentTerm: z.enum(['FIRST', 'SECOND', 'THIRD']),
  gradingScale: z.enum(['PERCENTAGE', 'GPA_4', 'GPA_5', 'LETTER']),
  passMark: z.number().min(0).max(100).default(50),
})
export type AcademicSetupDto = z.infer<typeof AcademicSetupSchema>

// ── Onboarding: Invite Team (Step 3) ────────────
export const InviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['TEACHER', 'STAFF', 'REGISTRAR', 'FINANCE_ADMIN', 'HR_ADMIN']),
})
export const InviteTeamSchema = z.object({
  invites: z.array(InviteSchema).max(10),
})
export type InviteTeamDto = z.infer<typeof InviteTeamSchema>
