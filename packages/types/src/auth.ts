import { z } from 'zod'
import type { User } from './user'

export const LoginSchema = z.object({
  email: z.string().email({ message: 'Enter a valid email' }),
  password: z.string().min(1, { message: 'Password is required' }),
})

export type LoginDto = z.infer<typeof LoginSchema>

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
})

export type RegisterDto = z.infer<typeof RegisterSchema>

export const ForgotPasswordSchema = z.object({
  email: z.string().email(),
})

export const ResetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
})

export type AuthSession = {
  user: User
  tenantId: string
  accessToken: string
  expiresAt: Date
}
