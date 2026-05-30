import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

// In-memory typing state: conversationId → Map<userId, { name, expiresAt }>
const typingStore = new Map<string, Map<string, { name: string; expiresAt: number }>>()

function getRoom(convId: string) {
  if (!typingStore.has(convId)) typingStore.set(convId, new Map())
  return typingStore.get(convId)!
}

// GET /api/chat/conversations/[id]/typing — returns who is currently typing
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id

  const room = getRoom(id)
  const now  = Date.now()
  const typing: { userId: string; name: string }[] = []

  for (const [uid, entry] of room.entries()) {
    if (entry.expiresAt < now) { room.delete(uid); continue }
    if (uid === userId) continue   // don't show yourself
    typing.push({ userId: uid, name: entry.name })
  }

  return NextResponse.json({ typing })
}

// POST /api/chat/conversations/[id]/typing — set typing state (TTL 4 seconds)
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id
  const name   = `${(session.user as any).firstName ?? ''} ${(session.user as any).lastName ?? ''}`.trim() || 'Someone'

  getRoom(id).set(userId, { name, expiresAt: Date.now() + 4000 })
  return NextResponse.json({ ok: true })
}

// DELETE /api/chat/conversations/[id]/typing — clear typing state on send/blur
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id
  getRoom(id).delete(userId)
  return NextResponse.json({ ok: true })
}
