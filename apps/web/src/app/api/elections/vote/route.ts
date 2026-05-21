import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const voterId = (session.user as any).id

  const { electionId, candidateId } = await req.json()

  // Check already voted
  const existing = await prisma.electionVote.findUnique({
    where: { tenantId_electionId_voterId: { tenantId, electionId, voterId } },
  })
  if (existing) return NextResponse.json({ error: 'Already voted' }, { status: 409 })

  // Check election is open
  const election = await prisma.election.findFirst({ where: { tenantId, id: electionId } })
  if (!election || election.status !== 'VOTING_OPEN') {
    return NextResponse.json({ error: 'Voting is not open' }, { status: 400 })
  }

  const vote = await prisma.electionVote.create({ data: { tenantId, electionId, voterId, candidateId } })
  return NextResponse.json(vote)
}
