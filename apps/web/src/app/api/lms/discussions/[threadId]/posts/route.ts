import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

type Params = { params: Promise<{ threadId: string }> }

// GET — posts in a thread
export async function GET(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { threadId } = await params
  const userId = (session.user as any).id

  const [thread, posts] = await Promise.all([
    prisma.discussionThread.findUnique({
      where: { id: threadId },
      include: {
        _count: { select: { posts: true } },
        courseOffering: { include: { course: true } },
      },
    }),
    prisma.discussionPost.findMany({
      where: { threadId },
      include: {
        votes: { where: { userId }, select: { id: true } },
      },
      orderBy: [{ isBestAnswer: 'desc' }, { upvoteCount: 'desc' }, { createdAt: 'asc' }],
    }),
  ])

  if (!thread) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const authorIds = [...new Set(posts.map(p => p.authorId))]
  const authors = await prisma.user.findMany({
    where: { id: { in: authorIds } },
    select: { id: true, firstName: true, lastName: true, avatarUrl: true, role: true },
  })
  const authorMap = Object.fromEntries(authors.map(a => [a.id, a]))

  const postsWithVoted = posts.map(p => ({
    ...p,
    hasVoted: p.votes.length > 0,
    votes: undefined,
    author: p.isAnonymous && (session.user as any).role === 'STUDENT'
      ? { id: p.authorId, firstName: 'Anonymous', lastName: '', avatarUrl: null, role: authorMap[p.authorId]?.role }
      : authorMap[p.authorId] ?? null,
  }))

  return NextResponse.json({ thread, posts: postsWithVoted })
}

// POST — add a post to a thread
export async function POST(req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { threadId } = await params
  const tenantId = (session.user as any).tenantId
  const userId = (session.user as any).id
  const body = await req.json()

  const thread = await prisma.discussionThread.findUnique({ where: { id: threadId } })
  if (!thread) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (thread.isLocked) return NextResponse.json({ error: 'Thread is locked' }, { status: 403 })

  const post = await prisma.discussionPost.create({
    data: {
      tenantId,
      threadId,
      authorId: userId,
      content: body.content,
      isAnonymous: body.isAnonymous ?? false,
      parentId: body.parentId ?? null,
      fileUrl: body.fileUrl ?? null,
      fileName: body.fileName ?? null,
      fileType: body.fileType ?? null,
    },
  })

  const author = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, firstName: true, lastName: true, avatarUrl: true, role: true },
  })

  // Bump updatedAt on thread
  await prisma.discussionThread.update({ where: { id: threadId }, data: { updatedAt: new Date() } })

  return NextResponse.json({ ...post, author }, { status: 201 })
}
