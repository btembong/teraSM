import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Users, Calendar, Building, Wrench, Plus } from 'lucide-react'
import AdminStudentLifeClient from './AdminStudentLifeClient'

export default async function AdminStudentLifePage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const tenantId = (session.user as any).tenantId

  const [clubs, events, hostelRooms, maintenanceRequests] = await Promise.all([
    prisma.club.findMany({
      where: { tenantId },
      include: { _count: { select: { memberships: { where: { status: 'ACTIVE' } } } } },
      orderBy: { name: 'asc' },
    }),
    prisma.campusEvent.findMany({
      where: { tenantId },
      include: { _count: { select: { rsvps: { where: { status: 'GOING' } } } } },
      orderBy: { startDate: 'desc' },
      take: 20,
    }),
    prisma.hostelRoom.findMany({
      where: { tenantId },
      orderBy: [{ building: 'asc' }, { roomNumber: 'asc' }],
    }),
    prisma.maintenanceRequest.findMany({
      where: { tenantId },
      include: { reportedBy: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
  ])

  const stats = {
    totalClubs: clubs.length,
    totalMembers: clubs.reduce((s, c) => s + c._count.memberships, 0),
    upcomingEvents: events.filter((e) => new Date(e.endDate) >= new Date()).length,
    openMaintenance: maintenanceRequests.filter((r) => r.status === 'OPEN').length,
    hostelOccupied: hostelRooms.reduce((s, r) => s + r.occupied, 0),
    hostelCapacity: hostelRooms.reduce((s, r) => s + r.capacity, 0),
  }

  return (
    <AdminStudentLifeClient
      clubs={JSON.parse(JSON.stringify(clubs))}
      events={JSON.parse(JSON.stringify(events))}
      hostelRooms={JSON.parse(JSON.stringify(hostelRooms))}
      maintenanceRequests={JSON.parse(JSON.stringify(maintenanceRequests))}
      stats={stats}
    />
  )
}
