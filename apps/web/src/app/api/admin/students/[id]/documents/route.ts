import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadFile } from '@/lib/r2'
import { NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string }> }

// GET /api/admin/students/[id]/documents
export async function GET(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const { id: studentId } = await params

  const db = prisma as any
  const docs = await db.studentDocument.findMany({
    where: { tenantId, studentId },
    orderBy: { createdAt: 'desc' },
  })

  // Enrich with uploader name
  const uploaderIds = [...new Set(docs.map((d: any) => d.uploadedBy))]
  const uploaders = await prisma.user.findMany({
    where: { id: { in: uploaderIds as string[] } },
    select: { id: true, firstName: true, lastName: true },
  })
  const uploaderMap = Object.fromEntries(uploaders.map(u => [u.id, u]))

  return NextResponse.json(docs.map((d: any) => ({ ...d, uploadedByUser: uploaderMap[d.uploadedBy] ?? null })))
}

// POST /api/admin/students/[id]/documents (multipart/form-data)
export async function POST(req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const adminId  = (session.user as any).id
  const { id: studentId } = await params

  // Verify student exists in this tenant
  const student = await prisma.user.findFirst({ where: { id: studentId, tenantId, role: 'STUDENT' } })
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  const formData = await req.formData()
  const file     = formData.get('file') as File | null
  const name     = (formData.get('name') as string)?.trim()
  const category = (formData.get('category') as string) ?? 'other'
  const url      = (formData.get('url') as string)?.trim()

  if (!name) return NextResponse.json({ error: 'Document name is required' }, { status: 400 })

  let fileUrl = url ?? ''
  let fileType = 'other'

  if (file && file.size > 0) {
    const bytes = await file.arrayBuffer()
    const ext   = file.name.split('.').pop()?.toLowerCase() ?? ''
    fileType    = ext === 'pdf' ? 'pdf' : ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? 'image' : ext === 'docx' || ext === 'doc' ? 'docx' : 'other'
    const key   = `documents/${tenantId}/${studentId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const uploaded = await uploadFile({ key, body: Buffer.from(bytes), contentType: file.type })
    fileUrl = uploaded ?? `[file:${file.name}]`
  }

  if (!fileUrl) return NextResponse.json({ error: 'A file or URL is required' }, { status: 400 })

  const db = prisma as any
  const doc = await db.studentDocument.create({
    data: { tenantId, studentId, name, fileUrl, fileType, category, uploadedBy: adminId },
  })

  return NextResponse.json(doc, { status: 201 })
}
