import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { sendAdmissionReceivedEmail } from '@/lib/email'

type Params = { params: Promise<{ slug: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { slug } = await params
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: { id: true, name: true, logoUrl: true, status: true },
  })
  if (!tenant || tenant.status === 'SUSPENDED' || tenant.status === 'CANCELLED') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const programs = await prisma.program.findMany({
    where: { tenantId: tenant.id, isActive: true },
    select: { name: true, code: true, level: true },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json({ name: tenant.name, logoUrl: tenant.logoUrl, programs })
}

export async function POST(req: NextRequest, { params }: Params) {
  const { slug } = await params
  const tenant = await prisma.tenant.findUnique({ where: { slug }, select: { id: true, name: true, logoUrl: true, status: true } })
  if (!tenant || tenant.status === 'SUSPENDED' || tenant.status === 'CANCELLED') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await req.json()
  const {
    firstName, lastName, email, phone, dateOfBirth, gender, nationality,
    address, programOfInterest, entryLevel, previousSchool,
    qualifications, personalStatement, documents,
  } = body

  if (!firstName || !lastName || !email) {
    return NextResponse.json({ error: 'First name, last name and email are required' }, { status: 400 })
  }

  const existing = await (prisma as any).admissionApplication.findFirst({
    where: { tenantId: tenant.id, email: email.toLowerCase().trim() },
    select: { id: true, status: true, trackingToken: true },
  })
  if (existing) {
    return NextResponse.json({
      error: 'An application with this email already exists.',
      status: existing.status,
      trackingToken: existing.trackingToken,
    }, { status: 409 })
  }

  // Generate a human-readable reference number
  const year  = new Date().getFullYear()
  const count = await (prisma as any).admissionApplication.count({ where: { tenantId: tenant.id } })
  const refNum = `APP-${year}-${String(count + 1).padStart(4, '0')}`

  const application = await (prisma as any).admissionApplication.create({
    data: {
      tenantId:          tenant.id,
      referenceNumber:   refNum,
      firstName:         firstName.trim(),
      lastName:          lastName.trim(),
      email:             email.toLowerCase().trim(),
      phone:             phone ?? null,
      dateOfBirth:       dateOfBirth ? new Date(dateOfBirth) : null,
      gender:            gender ?? null,
      nationality:       nationality ?? null,
      address:           address ?? null,
      programOfInterest: programOfInterest ?? null,
      entryLevel:        entryLevel ?? null,
      previousSchool:    previousSchool ?? null,
      qualifications:    qualifications ?? null,
      personalStatement: personalStatement ?? null,
      admissionDocuments: documents?.length
        ? {
            create: (documents as any[]).map((d: any) => ({
              docType:  d.docType,
              fileName: d.fileName,
              fileSize: d.fileSize ?? null,
              fileUrl:  d.fileUrl ?? '',
            })),
          }
        : undefined,
    },
  })

  // Notify all admins + registrars of this tenant (fire-and-forget)
  prisma.user.findMany({
    where: { tenantId: tenant.id, role: { in: ['TENANT_ADMIN', 'REGISTRAR'] }, status: 'ACTIVE' },
    select: { id: true },
  }).then(admins => {
    if (!admins.length) return
    return prisma.notification.createMany({
      data: admins.map(a => ({
        tenantId: tenant.id,
        userId:   a.id,
        title:    'New Admission Application',
        body:     `${application.firstName} ${application.lastName} applied for ${application.programOfInterest ?? 'a programme'}.`,
        link:     '/admin/admissions',
        type:     'GENERAL',
      })),
    })
  }).catch(err => console.error('[notify] admission received:', err))

  // Fire-and-forget email (don't block the response)
  const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/apply/${slug}/track/${application.trackingToken}`
  prisma.tenantSettings.findUnique({ where: { tenantId: tenant.id }, select: { primaryColor: true } })
    .then(settings => sendAdmissionReceivedEmail({
      to:              application.email,
      firstName:       application.firstName,
      schoolName:      tenant.name ?? 'the school',
      referenceNumber: application.referenceNumber,
      trackingUrl,
      logoUrl:     tenant.logoUrl,
      brandColor:  settings?.primaryColor,
    }))
    .catch(err => console.error('[email] admission received:', err))

  return NextResponse.json({
    id:              application.id,
    referenceNumber: application.referenceNumber,
    trackingToken:   application.trackingToken,
  }, { status: 201 })
}
