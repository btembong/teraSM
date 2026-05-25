import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// DELETE /api/admin/gdpr/erase?studentId=xxx
// Anonymises the student record (GDPR right to erasure) — soft erase
export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId  = (session.user as any).tenantId as string
  const studentId = req.nextUrl.searchParams.get('studentId')

  if (!studentId) return NextResponse.json({ error: 'studentId required' }, { status: 400 })

  const student = await prisma.user.findFirst({ where: { id: studentId, tenantId, role: 'STUDENT' } })
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  const anonymisedEmail = `erased_${studentId}@deleted.local`

  // Anonymise PII — preserve academic records under anonymised ID
  await prisma.user.update({
    where: { id: studentId },
    data: {
      email:     anonymisedEmail,
      firstName: '[Erased]',
      lastName:  '[Erased]',
      passwordHash: '',
      status:    'INACTIVE',
      avatarUrl: null,
    },
  })

  // Log the erasure
  await prisma.auditLog.create({
    data: {
      tenantId,
      userId: (session.user as any).id,
      action: 'GDPR_ERASE',
      entity: 'User',
      entityId: studentId,
      details: { originalEmail: student.email },
    } as any,
  })

  return NextResponse.json({ ok: true, message: 'Student data has been anonymised.' })
}
