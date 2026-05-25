import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

type Params = { params: Promise<{ postId: string }> }

// POST — toggle "best answer" on a post (staff/teacher only)
export async function POST(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { postId } = await params
  const role = (session.user as any).role
  if (!['TEACHER', 'STAFF', 'TENANT_ADMIN'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const post = await prisma.discussionPost.findUnique({ where: { id: postId } })
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (post.isBestAnswer) {
    // Unmark
    const updated = await prisma.discussionPost.update({
      where: { id: postId },
      data: { isBestAnswer: false },
    })
    return NextResponse.json(updated)
  }

  // Unmark any existing best answer in same thread, then mark this one
  await prisma.discussionPost.updateMany({
    where: { threadId: post.threadId, isBestAnswer: true },
    data: { isBestAnswer: false },
  })
  const updated = await prisma.discussionPost.update({
    where: { id: postId },
    data: { isBestAnswer: true },
  })
  return NextResponse.json(updated)
}
