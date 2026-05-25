import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const payments = await prisma.manualPayment.findMany({
    where: { tenantId: (session.user as any).tenantId },
    include: {
      invoice: { select: { invoiceNo: true, totalAmount: true, paidAmount: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Enrich with student name
  const studentIds = [...new Set(payments.map(p => p.studentId))]
  const students = await prisma.user.findMany({
    where: { id: { in: studentIds } },
    select: { id: true, firstName: true, lastName: true, email: true },
  })
  const studentMap = Object.fromEntries(students.map(s => [s.id, s]))

  const result = payments.map(p => ({
    ...p,
    student: studentMap[p.studentId] ?? null,
  }))

  return NextResponse.json(result)
}
