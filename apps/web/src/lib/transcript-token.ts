import { createHmac, randomBytes } from 'crypto'

const SECRET = process.env.NEXTAUTH_SECRET ?? 'fallback-secret'

/**
 * Generate a unique, tamper-proof verification code for a transcript.
 * Format: <random-nonce>.<hmac-signature>
 * Both parts are hex-encoded. Total ~96 chars.
 */
export function generateVerificationCode(transcriptId: string, studentId: string): string {
  const nonce = randomBytes(16).toString('hex')
  const payload = `${transcriptId}:${studentId}:${nonce}`
  const sig = createHmac('sha256', SECRET).update(payload).digest('hex')
  return `${nonce}.${sig}`
}

/**
 * Verify that a code was issued by us (not tampered).
 * Returns true if the HMAC matches — does NOT check DB expiry (caller does that).
 */
export function verifyCode(code: string, transcriptId: string, studentId: string): boolean {
  const [nonce, sig] = code.split('.')
  if (!nonce || !sig) return false
  const payload = `${transcriptId}:${studentId}:${nonce}`
  const expected = createHmac('sha256', SECRET).update(payload).digest('hex')
  // Constant-time comparison
  return timingSafeEqual(expected, sig)
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}
