import { NextRequest } from 'next/server'
import {
  groq, RISHI_MODEL,
  buildWeeklyMessages, buildAskMessages, buildEmergencyMessages,
} from '@/lib/groq'
import type { ProfileCtx, WeekCtx } from '@/lib/groq'

export const runtime = 'nodejs'
export const maxDuration = 60

interface RequestBody {
  type:       'weekly' | 'ask' | 'emergency'
  profile:    ProfileCtx
  week:       WeekCtx
  question?:  string
  recentMood?: number | null
  lastUrge?:  { intensity: number; minutesAgo: number } | null
  sankalp?:   string | null
}

export async function POST(req: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return Response.json(
      { error: 'Rishi is not yet configured. Please add GROQ_API_KEY to your environment.' },
      { status: 503 }
    )
  }

  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { type, profile, week, question, recentMood, lastUrge, sankalp } = body

  let messages: { role: 'system' | 'user' | 'assistant'; content: string }[]
  let maxTokens: number

  if (type === 'weekly') {
    messages  = buildWeeklyMessages(profile, week)
    maxTokens = 1400
  } else if (type === 'ask') {
    if (!question?.trim()) {
      return Response.json({ error: 'Question is required.' }, { status: 400 })
    }
    messages  = buildAskMessages(profile, week, question)
    maxTokens = 900
  } else if (type === 'emergency') {
    messages  = buildEmergencyMessages(profile, recentMood ?? null, lastUrge ?? null, sankalp ?? null)
    maxTokens = 550
  } else {
    return Response.json({ error: 'Invalid type.' }, { status: 400 })
  }

  try {
    const stream = await groq.chat.completions.create({
      model:       RISHI_MODEL,
      messages,
      stream:      true as const,
      max_tokens:  maxTokens,
      temperature: 0.82,
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content ?? ''
            if (text) controller.enqueue(encoder.encode(text))
          }
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (err) {
    console.error('[Rishi API]', err)
    return Response.json(
      { error: 'The sage is momentarily in deep meditation. Please try again in a moment.' },
      { status: 500 }
    )
  }
}
