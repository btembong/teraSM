import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { renderToBuffer } from '@react-pdf/renderer'
import { OfferLetterDocument } from '@/lib/pdf/offer-letter'
import { uploadFile } from '@/lib/r2'
import { sendAdmissionOfferedEmail } from '@/lib/email'
import React from 'react'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

function generateReference(existingRef: string | null, appId: string): string {
  if (existingRef) return existingRef
  const year  = new Date().getFullYear()
  const short = appId.slice(-6).toUpperCase()
  return `OFFER-${year}-${short}`
}

// POST /api/admin/admissions/[id]/offer-letter
// Generates a branded PDF offer letter, uploads to R2, stores URL on application
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const { tenantId, role } = session.user as any
  if (!['TENANT_ADMIN', 'REGISTRAR'].includes(role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params

  // Load application
  const application = await prisma.admissionApplication.findFirst({
    where: { id, tenantId },
  })
  if (!application) return NextResponse.json({ message: 'Application not found.' }, { status: 404 })

  if (!['OFFERED', 'ACCEPTED'].includes(application.status)) {
    return NextResponse.json({
      message: 'Offer letter can only be generated for applications with OFFERED or ACCEPTED status.',
    }, { status: 400 })
  }

  // Load tenant info
  const [tenant, reviewer] = await Promise.all([
    prisma.tenant.findUnique({ where: { id: tenantId } }),
    application.reviewedBy
      ? prisma.user.findUnique({ where: { id: application.reviewedBy }, select: { firstName: true, lastName: true, role: true } })
      : null,
  ])
  if (!tenant) return NextResponse.json({ message: 'Tenant not found.' }, { status: 500 })

  // Optional overrides from request body
  const body = await req.json().catch(() => ({}))
  const {
    signatoryName  = reviewer ? `${reviewer.firstName} ${reviewer.lastName}` : 'The Registrar',
    signatoryTitle = reviewer?.role === 'TENANT_ADMIN' ? 'Vice-Chancellor' : 'Registrar',
    academicYear   = `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
    reportingDate,
    conditions,
  } = body

  const referenceNumber = generateReference(application.referenceNumber, application.id)

  const offerExpiry = application.offerExpiry
    ? application.offerExpiry.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : undefined

  const schoolAddress = [tenant.address, tenant.city, tenant.state, tenant.country].filter(Boolean).join(', ')

  // Build PDF data
  const pdfData = {
    schoolName:        tenant.name,
    schoolAddress:     schoolAddress || tenant.country,
    schoolEmail:       tenant.email,
    schoolPhone:       tenant.phone ?? undefined,
    schoolLogoUrl:     tenant.logoUrl ?? undefined,
    signatoryName,
    signatoryTitle,
    firstName:         application.firstName,
    lastName:          application.lastName,
    email:             application.email,
    address:           application.address ?? undefined,
    referenceNumber,
    programOfInterest: application.programOfInterest ?? 'Undergraduate Programme',
    entryLevel:        application.entryLevel ?? undefined,
    academicYear,
    reportingDate:     reportingDate ?? undefined,
    offerExpiry,
    conditions:        Array.isArray(conditions) ? conditions : undefined,
  }

  // Render PDF to buffer
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfBuffer = await renderToBuffer(
    React.createElement(OfferLetterDocument, { data: pdfData }) as any
  )

  // Upload to R2 (or fall back to base64 data URL in dev)
  const key = `offer-letters/${tenantId}/${id}-${Date.now()}.pdf`
  let fileUrl = await uploadFile({ key, body: pdfBuffer, contentType: 'application/pdf' })

  // Dev fallback: return base64 data URL so the letter is still usable without R2
  if (!fileUrl) {
    const b64 = Buffer.from(pdfBuffer).toString('base64')
    fileUrl = `data:application/pdf;base64,${b64}`
  }

  // Save URL + reference number to application
  await prisma.admissionApplication.update({
    where: { id },
    data: {
      offerLetterUrl:  fileUrl,
      referenceNumber: referenceNumber,
    },
  })

  // Email the applicant with the offer letter link (non-blocking)
  const trackingUrl = `${APP_URL}/apply/${tenant.slug}/track/${application.trackingToken}`
  sendAdmissionOfferedEmail({
    to:                application.email,
    firstName:         application.firstName,
    schoolName:        tenant.name,
    programOfInterest: application.programOfInterest ?? undefined,
    referenceNumber,
    offerExpiry:       application.offerExpiry ?? null,
    offerLetterUrl:    fileUrl,
    trackingUrl,
  }).catch(err => console.error('[offer-letter-email]', err))

  return NextResponse.json({ offerLetterUrl: fileUrl, referenceNumber })
}
