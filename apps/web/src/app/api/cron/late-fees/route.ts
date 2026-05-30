import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// GET /api/cron/late-fees
// Runs daily — finds overdue invoices past their grace period and applies late fees.
// Trigger via Vercel Cron or external scheduler with secret header.
export async function GET(req: Request) {
  const secret = req.headers.get('x-cron-secret') ?? new URL(req.url).searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  let processed = 0
  let skipped   = 0

  // Find all payable invoices that are past their due date and not yet marked OVERDUE
  const overdueInvoices = await prisma.invoice.findMany({
    where: {
      status:  { in: ['SENT', 'PARTIALLY_PAID'] },
      dueDate: { lt: now },
    },
    include: {
      items: {
        include: { feeStructure: true },
      },
    },
    take: 500,
  })

  for (const invoice of overdueInvoices) {
    // Mark as OVERDUE regardless of late fee
    const updates: Record<string, unknown> = { status: 'OVERDUE' }

    // Check if any item already is a late fee item (avoid double-charging)
    const alreadyHasLateFee = invoice.items.some(
      (item: any) => item.description?.toLowerCase().includes('late fee')
    )

    if (!alreadyHasLateFee) {
      // Find the highest applicable late fee rule from items' fee structures
      let lateFeeAmount = 0

      for (const item of invoice.items as any[]) {
        const fs = item.feeStructure
        if (!fs) continue

        // Check grace period
        const graceMs   = (fs.lateFeeGraceDays ?? 0) * 24 * 60 * 60 * 1000
        const graceEnd  = new Date((invoice.dueDate as Date).getTime() + graceMs)
        if (now < graceEnd) { skipped++; continue }

        // Calculate late fee for this item
        if (fs.lateFeePercent && fs.lateFeePercent > 0) {
          lateFeeAmount += parseFloat(((fs.lateFeePercent / 100) * item.amount).toFixed(2))
        } else if (fs.lateFee && fs.lateFee > 0) {
          lateFeeAmount += fs.lateFee
        }

        // Surcharge on top of base amount
        if (fs.surchargePercent && fs.surchargePercent > 0) {
          lateFeeAmount += parseFloat(((fs.surchargePercent / 100) * item.amount).toFixed(2))
        }
      }

      if (lateFeeAmount > 0) {
        // Add a late fee InvoiceItem
        await prisma.invoiceItem.create({
          data: {
            tenantId:    invoice.tenantId,
            invoiceId:   invoice.id,
            description: `Late Fee (applied ${now.toLocaleDateString('en-GB')})`,
            amount:      lateFeeAmount,
            quantity:    1,
          },
        })

        // Update invoice totalAmount
        updates.totalAmount = invoice.totalAmount + lateFeeAmount
      }
    }

    await prisma.invoice.update({
      where: { id: invoice.id },
      data:  updates as Parameters<typeof prisma.invoice.update>[0]['data'],
    })

    processed++
  }

  return NextResponse.json({
    ok: true,
    processed,
    skipped,
    checkedAt: now.toISOString(),
  })
}
