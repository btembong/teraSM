import { prisma } from '@/lib/prisma'
import { uploadFile } from '@/lib/r2'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/apply/[slug]/upload
// Multipart: field "file" + field "docType"
// Public endpoint — no auth required. Rate-limited by school lookup.
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: { id: true, status: true },
  })
  if (!tenant || tenant.status === 'SUSPENDED' || tenant.status === 'CANCELLED') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const formData = await req.formData().catch(() => null)
  if (!formData) return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })

  const file    = formData.get('file') as File | null
  const docType = formData.get('docType') as string | null

  if (!file)    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (!docType) return NextResponse.json({ error: 'docType is required' }, { status: 400 })

  // 10 MB limit
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 10 MB)' }, { status: 413 })
  }

  const allowed = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'File type not allowed' }, { status: 415 })
  }

  const buffer  = Buffer.from(await file.arrayBuffer())
  const ext     = file.name.split('.').pop() ?? 'bin'
  const key     = `admissions/${tenant.id}/${docType}-${Date.now()}.${ext}`

  const fileUrl = await uploadFile({ key, body: buffer, contentType: file.type })

  // Dev fallback — no R2 configured
  const url = fileUrl ?? `data:${file.type};base64,${buffer.toString('base64')}`

  return NextResponse.json({ fileUrl: url, fileName: file.name, fileSize: file.size })
}
