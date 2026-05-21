import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { AccessToken } from 'livekit-server-sdk'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id
  const userName = session.user.name ?? 'Participant'
  const body = await req.json()
  const { liveClassId } = body

  const liveClass = await prisma.liveClass.findUnique({ where: { id: liveClassId } })
  if (!liveClass) return NextResponse.json({ message: 'Not found' }, { status: 404 })

  const isTeacher = liveClass.teacherId === userId

  const at = new AccessToken(
    process.env.LIVEKIT_API_KEY ?? '',
    process.env.LIVEKIT_API_SECRET ?? '',
    { identity: userId, name: userName, ttl: '4h' },
  )

  at.addGrant({
    room: liveClass.roomName,
    roomJoin: true,
    canPublish: isTeacher,
    canSubscribe: true,
    canPublishData: true,
    roomCreate: isTeacher,
    roomAdmin: isTeacher,
  })

  return NextResponse.json({
    token: await at.toJwt(),
    livekitUrl: process.env.NEXT_PUBLIC_LIVEKIT_URL ?? 'ws://localhost:7880',
    roomName: liveClass.roomName,
    isTeacher,
  })
}
