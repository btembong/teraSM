import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { sendAlumniClaimEmail } from '@/lib/email'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

function generateTempPassword(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$'
  let pwd = ''
  for (let i = 0; i < length; i++) pwd += chars[Math.floor(Math.random() * chars.length)]
  return pwd
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim())
  if (lines.length < 2) return []

  // Parse header — support quoted fields
  const parseRow = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
        else inQuotes = !inQuotes
      } else if (ch === ',' && !inQuotes) {
        result.push(current.trim()); current = ''
      } else {
        current += ch
      }
    }
    result.push(current.trim())
    return result
  }

  const headers = parseRow(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, ''))
  const rows: Record<string, string>[] = []
  for (let i = 1; i < lines.length; i++) {
    const vals = parseRow(lines[i])
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => { row[h] = vals[idx] ?? '' })
    rows.push(row)
  }
  return rows
}

// Field aliases — accept various column name formats
function pick(row: Record<string, string>, ...keys: string[]): string {
  for (const k of keys) { if (row[k]) return row[k].trim() }
  return ''
}

// POST /api/admin/alumni/import — CSV bulk import
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const { tenantId, role } = session.user as any
  if (!['TENANT_ADMIN', 'REGISTRAR'].includes(role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
  if (!tenant) return NextResponse.json({ message: 'Tenant not found.' }, { status: 404 })

  const body = await req.json()
  const { csv } = body
  if (!csv?.trim()) return NextResponse.json({ message: 'CSV content is required.' }, { status: 400 })

  const rows = parseCSV(csv)
  if (rows.length === 0) return NextResponse.json({ message: 'No data rows found in CSV.' }, { status: 400 })

  const results: { row: number; email: string; status: 'created' | 'skipped'; reason?: string }[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2 // 1-indexed, header is row 1

    const firstName     = pick(row, 'firstname', 'first_name', 'first')
    const lastName      = pick(row, 'lastname', 'last_name', 'last')
    const email         = pick(row, 'email', 'emailaddress', 'email_address')
    const gradYearStr   = pick(row, 'graduationyear', 'graduation_year', 'gradyear', 'year')
    const degree        = pick(row, 'degree', 'qualification')
    const major         = pick(row, 'major', 'programme', 'program', 'course')
    const employer      = pick(row, 'currentemployer', 'employer', 'company', 'organisation', 'organization')
    const currentRole   = pick(row, 'currentrole', 'role', 'jobtitle', 'job_title', 'position')
    const linkedIn      = pick(row, 'linkedin', 'linkedinurl', 'linkedin_url')
    const bio           = pick(row, 'bio', 'about', 'summary')

    // Validate required
    if (!email) { results.push({ row: rowNum, email: '—', status: 'skipped', reason: 'Missing email' }); continue }
    if (!firstName || !lastName) { results.push({ row: rowNum, email, status: 'skipped', reason: 'Missing name' }); continue }
    const gradYear = Number(gradYearStr)
    if (!gradYear || gradYear < 1900 || gradYear > new Date().getFullYear() + 5) {
      results.push({ row: rowNum, email, status: 'skipped', reason: 'Invalid graduation year' }); continue
    }

    // Check existing
    const existing = await prisma.user.findFirst({ where: { email: email.toLowerCase() } })
    if (existing) { results.push({ row: rowNum, email, status: 'skipped', reason: 'Email already registered' }); continue }

    const tempPassword = generateTempPassword()
    const passwordHash = await bcrypt.hash(tempPassword, 10)

    try {
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            tenantId,
            email:          email.toLowerCase(),
            emailVerified:  null, // must claim to verify
            firstName,
            lastName,
            passwordHash,
            role:           'ALUMNI',
            status:         'ACTIVE',
            onboardingComplete: true,
          },
        })

        await tx.alumniProfile.create({
          data: {
            tenantId,
            userId:          user.id,
            graduationYear:  gradYear,
            degree:          degree   || null,
            major:           major    || null,
            currentEmployer: employer || null,
            currentRole:     currentRole || null,
            linkedIn:        linkedIn || null,
            bio:             bio      || null,
            isPublic:        true,
          },
        })

        // Send claim email (non-blocking, outside tx to avoid tx timeout)
        setImmediate(() => {
          sendAlumniClaimEmail({
            to:           email,
            firstName,
            schoolName:   tenant.name,
            tempPassword,
            loginUrl:     `${APP_URL}/login`,
          }).catch(err => console.error('[alumni-claim-email]', err))
        })
      })

      results.push({ row: rowNum, email, status: 'created' })
    } catch (err) {
      results.push({ row: rowNum, email, status: 'skipped', reason: 'Database error' })
    }
  }

  const created = results.filter(r => r.status === 'created').length
  const skipped = results.filter(r => r.status === 'skipped').length

  return NextResponse.json({ created, skipped, results })
}
