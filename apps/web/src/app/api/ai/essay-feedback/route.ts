import { auth } from '@/lib/auth'
import { generateText } from '@/lib/ai'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { text, assignmentTitle } = await req.json()

  if (!text || text.trim().length < 50) {
    return NextResponse.json({ error: 'Text too short for feedback' }, { status: 400 })
  }

  const feedback = await generateText(
    `Assignment: "${assignmentTitle || 'Essay'}"\n\nStudent submission:\n${text}`,
    `You are an academic writing coach. Provide constructive feedback on the student's writing. Structure your response as:
**Strengths** (2-3 bullet points)
**Areas to Improve** (2-3 bullet points)
**Specific Suggestions** (actionable edits or additions)
**Overall Assessment** (1-2 sentences)
Be encouraging but honest. Do not write the essay for them.`,
    600
  )

  return NextResponse.json({ feedback })
}
