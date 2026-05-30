import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/student/thesis/[id]/versions — upload a new version
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const { id: studentId, tenantId } = session.user as any
  const { id: thesisId } = await params

  const thesis = await prisma.thesis.findFirst({ where: { id: thesisId, tenantId, studentId } })
  if (!thesis) return NextResponse.json({ message: 'Not found.' }, { status: 404 })
  if (thesis.status === 'APPROVED' || thesis.status === 'PUBLISHED') {
    return NextResponse.json({ message: 'Cannot upload to an approved thesis.' }, { status: 400 })
  }

  const body = await req.json()
  const { fileUrl, fileName, fileSize, note } = body
  if (!fileUrl || !fileName) {
    return NextResponse.json({ message: 'fileUrl and fileName are required.' }, { status: 400 })
  }

  // Determine next version number
  const latest = await prisma.thesisVersion.findFirst({
    where: { thesisId },
    orderBy: { version: 'desc' },
  })
  const nextVersion = (latest?.version ?? 0) + 1

  const version = await prisma.thesisVersion.create({
    data: {
      thesisId,
      version: nextVersion,
      fileUrl,
      fileName,
      fileSize: fileSize ?? null,
      note: note?.trim() || null,
    },
  })

  // Move thesis back to DRAFT if it was under review (re-upload after revision request)
  if (thesis.status === 'REVISION_REQUESTED') {
    await prisma.thesis.update({ where: { id: thesisId }, data: { status: 'DRAFT' } })
  }

  return NextResponse.json(version, { status: 201 })
}
