import { z } from 'zod'

export const UserRole = z.enum([
  'SUPER_ADMIN',    // Tera SM platform operator
  'TENANT_ADMIN',   // School administrator
  'REGISTRAR',      // Admissions and registration
  'FINANCE_ADMIN',  // Finance office
  'HR_ADMIN',       // HR department
  'TEACHER',        // Lecturer / tutor
  'STUDENT',        // Enrolled student
  'PARENT',         // Parent / guardian
  'STAFF',          // General staff
])
export type UserRole = z.infer<typeof UserRole>

export const UserStatus = z.enum(['ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED'])
export type UserStatus = z.infer<typeof UserStatus>

export const CreateUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  role: UserRole,
  tenantId: z.string().cuid(),
  phone: z.string().optional(),
  password: z.string().min(8).optional(), // optional if using OAuth
})

export type CreateUserDto = z.infer<typeof CreateUserSchema>

export type User = {
  id: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  role: UserRole
  status: UserStatus
  tenantId: string
  avatarUrl?: string
  phone?: string
  emailVerified: boolean
  twoFactorEnabled: boolean
  createdAt: Date
  updatedAt: Date
}

export type SafeUser = Omit<User, never> // all fields safe to send to client (no password hash)
