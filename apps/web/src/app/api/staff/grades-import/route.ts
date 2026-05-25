import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// POST — parse uploaded CSV and bulk-update submission scores
// CSV format: studentId, assignmentId (or title), score
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId

  const { searchParams } = new URL(req.url)
  const courseOfferingId = searchParams.get('courseOfferingId')
  if (!courseOfferingId) return NextResponse.json({ error: 'Missing courseOfferingId' }, { status: 400 })

  const text = await req.text()
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return NextResponse.json({ error: 'CSV must have header + data rows' }, { status: 400 })

  // Parse header — expect: studentId, <assignment1_id_or_title>, <assignment2>, ...
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
  // headers[0] = studentId / "Student ID", rest = assignment identifiers

  const assignments = await prisma.assignment.findMany({
    where: { tenantId, courseOfferingId },
    select: { id: true, title: true },
  })
  const assignmentByTitle = Object.fromEntries(assignments.map(a => [a.title.toLowerCase(), a.id]))
  const assignmentById    = new Set(assignments.map(a => a.id))

  // Resolve column headers to assignment IDs
  const assignmentCols: Array<string | null> = headers.slice(1).map(h => {
    if (assignmentById.has(h)) return h
    return assignmentByTitle[h.toLowerCase()] ?? null
  })

  let updated = 0
  let skipped = 0

  for (const line of lines.slice(1)) {
    const cells = line.split(',').map(c => c.replace(/"/g, '').trim())
    const studentId = cells[0]
    if (!studentId) continue

    for (let i = 0; i < assignmentCols.length; i++) {
      const assignmentId = assignmentCols[i]
      if (!assignmentId) continue
      const raw = cells[i + 1]
      if (raw === undefined || raw === '') continue
      const score = parseFloat(raw)
      if (isNaN(score)) { skipped++; continue }

      const existing = await prisma.submission.findFirst({
        where: { tenantId, studentId, assignmentId },
      })
      if (existing) {
        await prisma.submission.update({
          where: { id: existing.id },
          data: { score, status: 'GRADED' },
        })
        updated++
      } else {
        skipped++
      }
    }
  }

  return NextResponse.json({ updated, skipped })
}
