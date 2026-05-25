import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { content, assignmentTitle } = await req.json()

  if (!content) return NextResponse.json({ error: 'No content to review' }, { status: 400 })

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    messages: [{
      role: 'user',
      content: `You are a teacher's grading assistant. Review this student submission for the assignment: "${assignmentTitle}".

Write 3–5 sentences of constructive feedback. Be specific about:
- What the student did well
- Where they can improve
- Any gaps in understanding

Be encouraging but honest. Write directly to the student (use "you"). Do not assign a score.

Student submission:
"""
${content.slice(0, 3000)}
"""`,
    }],
  })

  const feedback = (message.content[0] as any).text as string

  // Persist AI feedback to DB
  await prisma.submission.update({
    where: { id },
    data: { aiFeedback: feedback },
  })

  return NextResponse.json({ feedback })
}
