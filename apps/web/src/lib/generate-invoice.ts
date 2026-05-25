import { prisma } from './prisma'

/**
 * Creates (or returns existing) a semester invoice for a student.
 * Called automatically on first enrollment in the active semester.
 * Skips generation if no active fee structures are found.
 */
export async function generateSemesterInvoice(opts: {
  tenantId: string
  studentId: string
  semesterId: string
}): Promise<void> {
  const { tenantId, studentId, semesterId } = opts

  // Already has an invoice for this semester?
  const existing = await prisma.invoice.findFirst({
    where: { tenantId, studentId, semesterId },
  })
  if (existing) return // already issued — don't duplicate

  // Find applicable active fee structures (semester-specific or global)
  const feeStructures = await prisma.feeStructure.findMany({
    where: {
      tenantId,
      isActive: true,
      OR: [{ semesterId }, { semesterId: null }],
    },
  })
  if (feeStructures.length === 0) return // no fee structures configured yet

  const totalAmount = feeStructures.reduce((sum, f) => sum + f.amount, 0)

  // Generate invoice number: INV-YYYYMM-XXXX
  const now = new Date()
  const prefix = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
  const countThisMonth = await prisma.invoice.count({
    where: { tenantId, invoiceNo: { startsWith: prefix } },
  })
  const invoiceNo = `${prefix}-${String(countThisMonth + 1).padStart(4, '0')}`

  // Earliest due date from fee structures (or 30 days from now)
  const dueDates = feeStructures.map((f) => f.dueDate).filter(Boolean) as Date[]
  const dueDate = dueDates.length > 0
    ? new Date(Math.min(...dueDates.map((d) => d.getTime())))
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  await prisma.invoice.create({
    data: {
      tenantId,
      studentId,
      semesterId,
      invoiceNo,
      status: 'SENT',
      totalAmount,
      paidAmount: 0,
      dueDate,
      issuedAt: now,
      items: {
        create: feeStructures.map((f) => ({
          feeStructureId: f.id,
          description: f.name,
          amount: f.amount,
          quantity: 1,
          subtotal: f.amount,
        })),
      },
    },
  })
}
