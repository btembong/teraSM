import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { uploadFile, r2Configured } from '@/lib/r2'
import { randomBytes } from 'crypto'

const MAX_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Only JPEG, PNG, WEBP, or PDF files are allowed' }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File must be under 5 MB' }, { status: 400 })
  }

  const ext = file.name.split('.').pop() ?? 'bin'
  const key = `proofs/${session.user.id}/${Date.now()}-${randomBytes(6).toString('hex')}.${ext}`

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  if (!r2Configured) {
    // Dev fallback: return a fake URL so the flow can be tested without R2
    return NextResponse.json({ url: `/dev-proof/${key}`, name: file.name })
  }

  const url = await uploadFile({ key, body: buffer, contentType: file.type })
  if (!url) return NextResponse.json({ error: 'Upload failed' }, { status: 500 })

  return NextResponse.json({ url, name: file.name })
}
