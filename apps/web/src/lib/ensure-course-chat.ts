import { prisma } from '@/lib/prisma'

/**
 * Finds or creates a GROUP conversation for a CourseOffering.
 * Then adds the given student as a participant if not already present.
 * The teacher (if set on the offering) is always a participant.
 */
export async function ensureCourseGroupChat(tenantId: string, courseOfferingId: string, studentId: string) {
  const offering = await prisma.courseOffering.findFirst({
    where: { id: courseOfferingId, tenantId },
    include: { course: { select: { code: true, title: true } }, teacher: { select: { id: true } } },
  })
  if (!offering) return

  // Find existing group chat for this offering
  let conv = await (prisma as any).conversation.findFirst({
    where: { tenantId, type: 'GROUP', courseOfferingId },
  }) as { id: string } | null

  if (!conv) {
    // Create the group chat
    const teacherId = (offering.teacher as any)?.id ?? null
    conv = await (prisma as any).conversation.create({
      data: {
        tenantId,
        type:            'GROUP',
        courseOfferingId,
        name:            `${offering.course.code} — ${offering.course.title}`,
        description:     'Course group chat. Auto-created on enrollment.',
        createdById:     teacherId ?? studentId,
        participants: {
          create: [
            ...(teacherId ? [{ tenantId, userId: teacherId, isAdmin: true }] : []),
          ],
        },
      },
    })
  }

  // Add student if not already a participant
  await (prisma as any).conversationParticipant.upsert({
    where:  { conversationId_userId: { conversationId: conv.id, userId: studentId } },
    create: { tenantId, conversationId: conv.id, userId: studentId },
    update: {},
  })
}
