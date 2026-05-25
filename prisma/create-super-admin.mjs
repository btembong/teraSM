/**
 * Creates a Tera SM Super Admin account.
 * Run once: node prisma/create-super-admin.mjs
 */
import { PrismaClient } from '@prisma/client'
import { createHash } from 'crypto'
import { promisify } from 'util'
import { exec } from 'child_process'

// bcrypt via dynamic import (works without installing separately)
const p = new PrismaClient()

async function hashPassword(password) {
  // Use the same bcrypt the app uses
  const { default: bcrypt } = await import('bcryptjs')
  return bcrypt.hash(password, 12)
}

async function main() {
  const EMAIL     = 'superadmin@terasms.com'
  const PASSWORD  = 'SuperAdmin@2026!'
  const FIRST     = 'Tera'
  const LAST      = 'Admin'

  // 1. Create or find the Tera platform tenant
  let platformTenant = await p.tenant.findFirst({ where: { slug: 'tera-platform' } })

  if (!platformTenant) {
    platformTenant = await p.tenant.create({
      data: {
        name:       'Tera SM Platform',
        slug:       'tera-platform',
        plan:       'UNIVERSITY',
        status:     'ACTIVE',
        email:      'platform@terasms.com',
        country:    'US',
        timezone:   'UTC',
        currency:   'USD',
        studentCap: 999999,
        storageCap: 999999,
      },
    })
    console.log('✓ Platform tenant created')
  } else {
    console.log('✓ Platform tenant already exists')
  }

  // 2. Check if super admin already exists
  const existing = await p.user.findFirst({ where: { email: EMAIL } })
  if (existing) {
    console.log('✓ Super admin already exists:', EMAIL)
    console.log('  Password: SuperAdmin@2026!')
    return
  }

  // 3. Create super admin user
  const passwordHash = await hashPassword(PASSWORD)

  await p.user.create({
    data: {
      tenantId:           platformTenant.id,
      email:              EMAIL,
      emailVerified:      new Date(),
      firstName:          FIRST,
      lastName:           LAST,
      passwordHash,
      role:               'SUPER_ADMIN',
      status:             'ACTIVE',
      onboardingComplete: true,
    },
  })

  console.log('\n✅ Super admin created successfully!')
  console.log('─────────────────────────────────')
  console.log('  Email:    ', EMAIL)
  console.log('  Password: ', PASSWORD)
  console.log('  Role:     ', 'SUPER_ADMIN')
  console.log('─────────────────────────────────')
  console.log('  Go to http://localhost:3000/login')
  console.log('  After login you will be redirected to /super-admin')
  console.log('\n  ⚠️  Change this password after first login!')
}

main()
  .catch(e => { console.error('Error:', e.message); process.exit(1) })
  .finally(() => p.$disconnect())
