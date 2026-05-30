import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/public/tenant?slug=school-slug — returns minimal public branding info
export async function GET(req: NextRequest) {
  const slug = new URL(req.url).searchParams.get('slug')
  if (!slug) return NextResponse.json({ message: 'slug is required' }, { status: 400 })

  const tenant = await prisma.tenant.findFirst({
    where: { slug: slug.toLowerCase() },
    select: { name: true, logoUrl: true, slug: true },
  })

  if (!tenant) return NextResponse.json({ message: 'School not found' }, { status: 404 })
  return NextResponse.json(tenant)
}
