/**
 * In-memory OTP store.
 * Pinned to the Node.js global so it is shared across all API route
 * modules in the same process (Next.js compiles each route separately,
 * so a plain module-level Map would be a different instance per route).
 *
 * Swap for Upstash Redis when you need multi-instance / serverless support.
 */

export interface OtpEntry {
  code:      string
  expiresAt: number   // Unix ms
  attempts:  number
}

declare global {
  // eslint-disable-next-line no-var
  var __otpStore: Map<string, OtpEntry> | undefined
}

export const otpStore: Map<string, OtpEntry> =
  global.__otpStore ?? (global.__otpStore = new Map<string, OtpEntry>())

export const OTP_TTL_MS      = 10 * 60 * 1000  // 10 min
export const OTP_MAX_RESENDS = 5

export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export function isExpired(entry: OtpEntry): boolean {
  return Date.now() > entry.expiresAt
}
