import { auth } from '@/lib/auth'
import { anthropic } from '@/lib/ai'
import { NextResponse } from 'next/server'

const SYSTEM = `You are Tera AI, a helpful assistant for students, teachers, and staff on the Tera SM school management platform.
You help with:
- Academic questions (courses, grades, assignments, timetables)
- Platform navigation (how to use features)
- General school-related queries (study tips, deadlines, campus info)
- Fee and payment questions
Keep answers concise, friendly, and school-appropriate. If you don't know something specific about their school, say so.`

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { messages } = await req.json()

  const stream = await anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: SYSTEM,
    messages,
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          controller.enqueue(encoder.encode(chunk.delta.text))
        }
      }
      controller.close()
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Transfer-Encoding': 'chunked' },
  })
}
