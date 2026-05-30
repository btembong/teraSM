import { prisma } from '@/lib/prisma'
import { notifyUser } from '@/lib/send-notification'
import { NextResponse } from 'next/server'

// Runs daily at 8 AM UTC — checks invoices due in 7, 3, or 1 day
export async function GET(req: Request) {
  const secret = req.headers.get('x-cron-secret') ?? new URL(req.url).searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const targets = [1, 3, 7]
  let sent = 0

  for (const days of targets) {
    const start = new Date(now)
    start.setDate(start.getDate() + days)
    start.setHours(0, 0, 0, 0)

    const end = new Date(start)
    end.setHours(23, 59, 59, 999)

    const invoices = await prisma.invoice.findMany({
      where: {
        status: { in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] },
        dueDate: { gte: start, lte: end },
      },
      select: {
        id: true,
        tenantId: true,
        studentId: true,
        invoiceNo: true,
        totalAmount: true,
        paidAmount: true,
        dueDate: true,
      },
    })

    for (const inv of invoices) {
      const balance = inv.totalAmount - inv.paidAmount
      const label = days === 1 ? 'tomorrow' : `in ${days} days`
      await notifyUser({
        tenantId: inv.tenantId,
        userId: inv.studentId,
        type: 'FEE_DUE',
        title: `Fee Payment Due ${days === 1 ? 'Tomorrow' : `in ${days} Days`}`,
        body: `$${balance.toFixed(2)} is due ${label} (Invoice ${inv.invoiceNo}). Pay now to avoid late fees.`,
        link: '/student/fees',
      })
      sent++
    }
  }

  return NextResponse.json({ ok: true, sent })
}
