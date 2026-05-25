import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

/** Jaccard similarity between two text strings (word-level) */
function jaccardSimilarity(a: string, b: string): number {
  const tokenize = (s: string) =>
    new Set(s.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean))

  const setA = tokenize(a)
  const setB = tokenize(b)
  if (setA.size === 0 || setB.size === 0) return 0

  let intersection = 0
  for (const word of setA) if (setB.has(word)) intersection++
  const union = setA.size + setB.size - intersection
  return (intersection / union) * 100
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const target = await prisma.submission.findUnique({ where: { id } })
  if (!target?.content) {
    return NextResponse.json({ score: null, message: 'No text content to check' })
  }

  // Fetch all other submissions for the same assignment
  const peers = await prisma.submission.findMany({
    where: {
      assignmentId: target.assignmentId,
      id: { not: id },
      content: { not: null },
    },
    select: { id: true, content: true },
  })

  if (peers.length === 0) {
    await prisma.submission.update({ where: { id }, data: { plagiarismScore: 0 } })
    return NextResponse.json({ score: 0, message: 'No other submissions to compare against' })
  }

  // Highest similarity score across all peers
  let maxScore = 0
  const report: Array<{ peerId: string; similarity: number }> = []

  for (const peer of peers) {
    if (!peer.content) continue
    const similarity = jaccardSimilarity(target.content, peer.content)
    report.push({ peerId: peer.id, similarity: Math.round(similarity * 10) / 10 })
    if (similarity > maxScore) maxScore = similarity
  }

  const finalScore = Math.round(maxScore * 10) / 10

  await prisma.submission.update({
    where: { id },
    data: {
      plagiarismScore: finalScore,
      plagiarismReport: { checkedAt: new Date().toISOString(), comparisons: report },
    },
  })

  return NextResponse.json({ score: finalScore, report })
}
