import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { AccessToken } from 'livekit-server-sdk'

@Injectable()
export class LiveClassesService {
  constructor(private prisma: PrismaService) {}

  private get livekitHost() {
    return process.env.LIVEKIT_URL ?? 'ws://localhost:7880'
  }

  private get livekitApiKey() {
    return process.env.LIVEKIT_API_KEY ?? ''
  }

  private get livekitApiSecret() {
    return process.env.LIVEKIT_API_SECRET ?? ''
  }

  // Generate a unique room name
  private roomName(tenantId: string, liveClassId: string) {
    return `${tenantId}-${liveClassId}`
  }

  // Generate a LiveKit JWT token for a participant
  async generateToken(liveClassId: string, userId: string, userName: string, isTeacher = false) {
    const liveClass = await this.prisma.liveClass.findUnique({ where: { id: liveClassId } })
    if (!liveClass) throw new Error('Live class not found')

    const at = new AccessToken(this.livekitApiKey, this.livekitApiSecret, {
      identity: userId,
      name: userName,
      ttl: '4h',
    })

    at.addGrant({
      room: liveClass.roomName,
      roomJoin: true,
      canPublish: isTeacher, // only teacher publishes audio/video by default
      canSubscribe: true,
      canPublishData: true,
      roomCreate: isTeacher,
      roomAdmin: isTeacher,
    })

    return {
      token: await at.toJwt(),
      livekitUrl: this.livekitHost,
      roomName: liveClass.roomName,
    }
  }

  async list(tenantId: string, courseOfferingId?: string) {
    return this.prisma.liveClass.findMany({
      where: { tenantId, ...(courseOfferingId ? { courseOfferingId } : {}) },
      include: {
        _count: { select: { participants: true, recordings: true } },
        courseOffering: { include: { course: true } },
      },
      orderBy: { scheduledAt: 'desc' },
    })
  }

  async findById(id: string) {
    return this.prisma.liveClass.findUnique({
      where: { id },
      include: {
        participants: true,
        recordings: true,
        courseOffering: { include: { course: true } },
      },
    })
  }

  async create(tenantId: string, data: {
    courseOfferingId: string
    teacherId: string
    title: string
    description?: string
    scheduledAt: string
    durationMins?: number
    isRecorded?: boolean
  }) {
    const id = `lc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    return this.prisma.liveClass.create({
      data: {
        tenantId,
        courseOfferingId: data.courseOfferingId,
        teacherId: data.teacherId,
        title: data.title,
        description: data.description,
        scheduledAt: new Date(data.scheduledAt),
        durationMins: data.durationMins ?? 60,
        isRecorded: data.isRecorded ?? false,
        roomName: this.roomName(tenantId, id),
      },
    })
  }

  async start(id: string) {
    return this.prisma.liveClass.update({
      where: { id },
      data: { status: 'LIVE', startedAt: new Date() },
    })
  }

  async end(id: string) {
    return this.prisma.liveClass.update({
      where: { id },
      data: { status: 'ENDED', endedAt: new Date() },
    })
  }

  async cancel(id: string) {
    return this.prisma.liveClass.update({
      where: { id },
      data: { status: 'CANCELLED' },
    })
  }

  async trackJoin(tenantId: string, liveClassId: string, userId: string) {
    return this.prisma.liveClassParticipant.upsert({
      where: { liveClassId_userId: { liveClassId, userId } },
      create: { tenantId, liveClassId, userId },
      update: { joinedAt: new Date(), leftAt: null },
    })
  }

  async trackLeave(liveClassId: string, userId: string) {
    const participant = await this.prisma.liveClassParticipant.findUnique({
      where: { liveClassId_userId: { liveClassId, userId } },
    })
    if (!participant) return
    const duration = Math.floor((Date.now() - participant.joinedAt.getTime()) / 1000)
    return this.prisma.liveClassParticipant.update({
      where: { liveClassId_userId: { liveClassId, userId } },
      data: { leftAt: new Date(), duration },
    })
  }

  async addRecording(tenantId: string, liveClassId: string, url: string, duration?: number, fileSize?: number) {
    return this.prisma.liveClassRecording.create({
      data: { tenantId, liveClassId, url, duration, fileSize },
    })
  }

  // Upcoming classes for a student (via enrolled course offerings)
  async upcoming(tenantId: string, courseOfferingIds: string[]) {
    return this.prisma.liveClass.findMany({
      where: {
        tenantId,
        courseOfferingId: { in: courseOfferingIds },
        status: { in: ['SCHEDULED', 'LIVE'] },
        scheduledAt: { gte: new Date(Date.now() - 60 * 60 * 1000) }, // within past hour or future
      },
      include: { courseOffering: { include: { course: true } } },
      orderBy: { scheduledAt: 'asc' },
    })
  }
}
