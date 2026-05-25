import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ADMIN_ROLES = ['TENANT_ADMIN', 'FINANCE_ADMIN', 'REGISTRAR']

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ADMIN_ROLES.includes(session.user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const tenantId = session.user.tenantId
  const now = new Date()
  const in7Days = new Date(now); in7Days.setDate(now.getDate() + 7)
  const in3Days = new Date(now); in3Days.setDate(now.getDate() + 3)
  const in1Day  = new Date(now); in1Day.setDate(now.getDate() + 1)

  // Find overdue and upcoming invoices
  const invoices = await prisma.invoice.findMany({
    where: {
      tenantId,
      status: { in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] },
      dueDate: { not: null },
    },
    select: { id: true, studentId: true, invoiceNo: true, totalAmount: true, paidAmount: true, dueDate: true },
  })

  let created = 0
  for (const inv of invoices) {
    if (!inv.dueDate) continue
    const balance = inv.totalAmount - inv.paidAmount
    const dueDate = new Date(inv.dueDate)

    let title = '', body = ''
    if (dueDate < now) {
      title = 'Invoice overdue'
      body = `Invoice ${inv.invoiceNo} is overdue. Outstanding: ${balance.toFixed(2)}.`
    } else if (dueDate <= in1Day) {
      title = 'Fee due tomorrow'
      body = `Invoice ${inv.invoiceNo} is due tomorrow. Outstanding: ${balance.toFixed(2)}.`
    } else if (dueDate <= in3Days) {
      title = 'Fee due in 3 days'
      body = `Invoice ${inv.invoiceNo} is due in 3 days. Outstanding: ${balance.toFixed(2)}.`
    } else if (dueDate <= in7Days) {
      title = 'Fee due in 7 days'
      body = `Invoice ${inv.invoiceNo} is due in 7 days. Outstanding: ${balance.toFixed(2)}.`
    } else {
      continue
    }

    // Avoid duplicate notifications (check if one was created in last 24h)
    const recent = await prisma.notification.findFirst({
      where: { tenantId, userId: inv.studentId, title, createdAt: { gte: new Date(now.getTime() - 86400000) } },
    })
    if (recent) continue

    await prisma.notification.create({
      data: {
        tenantId,
        userId: inv.studentId,
        title,
        body,
        link: '/student/fees',
        type: 'GENERAL',
      },
    })
    created++
  }

  return NextResponse.json({ success: true, notificationsSent: created })
}
