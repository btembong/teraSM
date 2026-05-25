import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getActiveSemester } from '@/lib/active-semester'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const semester = await getActiveSemester((session.user as any).tenantId)
  return NextResponse.json(semester)
}
