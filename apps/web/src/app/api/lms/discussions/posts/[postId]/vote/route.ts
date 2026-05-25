import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

type Params = { params: Promise<{ postId: string }> }

// POST — toggle upvote on a post
export async function POST(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { postId } = await params
  const userId = (session.user as any).id

  const existing = await prisma.discussionVote.findUnique({
    where: { postId_userId: { postId, userId } },
  })

  if (existing) {
    // Remove vote
    await prisma.discussionVote.delete({ where: { postId_userId: { postId, userId } } })
    const post = await prisma.discussionPost.update({
      where: { id: postId },
      data: { upvoteCount: { decrement: 1 } },
      select: { upvoteCount: true },
    })
    return NextResponse.json({ upvoteCount: post.upvoteCount, hasVoted: false })
  } else {
    await prisma.discussionVote.create({ data: { postId, userId } })
    const post = await prisma.discussionPost.update({
      where: { id: postId },
      data: { upvoteCount: { increment: 1 } },
      select: { upvoteCount: true },
    })
    return NextResponse.json({ upvoteCount: post.upvoteCount, hasVoted: true })
  }
}
