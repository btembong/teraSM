import { auth } from '@/lib/auth'
import { uploadFile } from '@/lib/r2'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantId = (session.user as any).tenantId
  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })
  if (file.size > MAX_SIZE) return NextResponse.json({ error: 'File too large (max 10 MB)' }, { status: 400 })
  if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: 'File type not allowed' }, { status: 400 })

  const ext = file.name.split('.').pop() ?? 'bin'
  const key = `chat/${tenantId}/${randomUUID()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const url = await uploadFile({ key, body: buffer, contentType: file.type })
  if (!url) return NextResponse.json({ error: 'Storage not configured' }, { status: 500 })

  return NextResponse.json({ url, name: file.name, type: file.type })
}
