import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const userId = (session.user as any).id

  const elections = await prisma.election.findMany({
    where: { tenantId },
    include: {
      candidates: {
        where: { status: 'APPROVED' },
        include: { student: { select: { firstName: true, lastName: true, avatarUrl: true } } },
      },
      votes: { where: { voterId: userId }, select: { candidateId: true } },
      _count: { select: { votes: true } },
    },
    orderBy: { votingEnd: 'desc' },
  })

  return NextResponse.json(elections.map((e) => ({
    ...e,
    myVote: e.votes[0]?.candidateId ?? null,
    votes: undefined,
  })))
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId

  const body = await req.json()
  const election = await prisma.election.create({
    data: { tenantId, ...body, nominationsStart: new Date(body.nominationsStart), nominationsEnd: new Date(body.nominationsEnd), votingStart: new Date(body.votingStart), votingEnd: new Date(body.votingEnd) },
  })
  return NextResponse.json(election)
}
