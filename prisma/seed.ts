/**
 * Seed: Fomic Polytechnic University (slug: fpui)
 * Adds academic structure, staff, and a demo student for end-to-end testing.
 * Idempotent — safe to re-run.
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

// Use DIRECT_URL to bypass the connection pooler (required for Neon DDL operations)
const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL } },
})

const TENANT_ID = 'cmpdxdtvk0000vrvk996xbrhn'

async function main() {
  console.log('Seeding Fomic Polytechnic University (fpui)...')

  // ─────────────────────────────────────────────────────────
  // 1. FACULTIES
  // ─────────────────────────────────────────────────────────
  const [fastFaculty, fbeFaculty] = await Promise.all([
    prisma.faculty.upsert({
      where:  { tenantId_code: { tenantId: TENANT_ID, code: 'FAST' } },
      update: {},
      create: {
        tenantId:    TENANT_ID,
        name:        'Faculty of Applied Sciences and Technology',
        code:        'FAST',
        description: 'Engineering, computing, and applied sciences programmes.',
      },
    }),
    prisma.faculty.upsert({
      where:  { tenantId_code: { tenantId: TENANT_ID, code: 'FBE' } },
      update: {},
      create: {
        tenantId:    TENANT_ID,
        name:        'Faculty of Business and Economics',
        code:        'FBE',
        description: 'Business, management, accounting, and economics programmes.',
      },
    }),
  ])
  console.log('  Faculties:', fastFaculty.code, fbeFaculty.code)

  // ─────────────────────────────────────────────────────────
  // 2. DEPARTMENTS
  // ─────────────────────────────────────────────────────────
  const [csDept, itDept, baDept, afDept] = await Promise.all([
    prisma.department.upsert({
      where:  { tenantId_code: { tenantId: TENANT_ID, code: 'CS' } },
      update: {},
      create: { tenantId: TENANT_ID, facultyId: fastFaculty.id, name: 'Computer Science', code: 'CS' },
    }),
    prisma.department.upsert({
      where:  { tenantId_code: { tenantId: TENANT_ID, code: 'IT' } },
      update: {},
      create: { tenantId: TENANT_ID, facultyId: fastFaculty.id, name: 'Information Technology', code: 'IT' },
    }),
    prisma.department.upsert({
      where:  { tenantId_code: { tenantId: TENANT_ID, code: 'BA' } },
      update: {},
      create: { tenantId: TENANT_ID, facultyId: fbeFaculty.id, name: 'Business Administration', code: 'BA' },
    }),
    prisma.department.upsert({
      where:  { tenantId_code: { tenantId: TENANT_ID, code: 'AF' } },
      update: {},
      create: { tenantId: TENANT_ID, facultyId: fbeFaculty.id, name: 'Accounting and Finance', code: 'AF' },
    }),
  ])
  console.log('  Departments: CS, IT, BA, AF')

  // ─────────────────────────────────────────────────────────
  // 3. PROGRAMS
  // ─────────────────────────────────────────────────────────
  const [hndCs, hndBa, dipIt] = await Promise.all([
    prisma.program.upsert({
      where:  { tenantId_code: { tenantId: TENANT_ID, code: 'HND-CS' } },
      update: {},
      create: {
        tenantId:       TENANT_ID,
        departmentId:   csDept.id,
        name:           'HND Computer Science',
        code:           'HND-CS',
        degreeType:     'ASSOCIATE',
        durationYears:  3,
        requiredCredits: 120,
        description:    'Higher National Diploma in Computer Science — covers programming, networking, databases, and software engineering.',
        isActive:       true,
      },
    }),
    prisma.program.upsert({
      where:  { tenantId_code: { tenantId: TENANT_ID, code: 'HND-BA' } },
      update: {},
      create: {
        tenantId:       TENANT_ID,
        departmentId:   baDept.id,
        name:           'HND Business Administration',
        code:           'HND-BA',
        degreeType:     'ASSOCIATE',
        durationYears:  3,
        requiredCredits: 120,
        description:    'Higher National Diploma in Business Administration — management, finance, marketing, and entrepreneurship.',
        isActive:       true,
      },
    }),
    prisma.program.upsert({
      where:  { tenantId_code: { tenantId: TENANT_ID, code: 'DIP-IT' } },
      update: {},
      create: {
        tenantId:       TENANT_ID,
        departmentId:   itDept.id,
        name:           'Diploma in Information Technology',
        code:           'DIP-IT',
        degreeType:     'DIPLOMA',
        durationYears:  2,
        requiredCredits: 80,
        description:    'Diploma in Information Technology — hardware, software, networking, and IT support fundamentals.',
        isActive:       true,
      },
    }),
  ])
  console.log('  Programs: HND-CS, HND-BA, DIP-IT')

  // ─────────────────────────────────────────────────────────
  // 4. ACADEMIC YEAR
  // ─────────────────────────────────────────────────────────
  // Mark any existing current year as non-current first
  await prisma.academicYear.updateMany({ where: { tenantId: TENANT_ID, isCurrent: true }, data: { isCurrent: false } })

  const academicYear = await prisma.academicYear.upsert({
    where:  { tenantId_name: { tenantId: TENANT_ID, name: '2025/2026' } },
    update: { isCurrent: true },
    create: {
      tenantId:     TENANT_ID,
      name:         '2025/2026',
      startDate:    new Date('2025-09-01'),
      endDate:      new Date('2026-08-31'),
      isCurrent:    true,
      gradingScale: 'PERCENTAGE',
      passMark:     50,
      gradeBoundaries: [
        { letter: 'A+', min: 95 }, { letter: 'A', min: 90 },
        { letter: 'B+', min: 85 }, { letter: 'B', min: 80 },
        { letter: 'C+', min: 75 }, { letter: 'C', min: 70 },
        { letter: 'D',  min: 60 }, { letter: 'F', min: 0  },
      ],
    },
  })
  console.log('  Academic Year:', academicYear.name)

  // ─────────────────────────────────────────────────────────
  // 5. SEMESTER — First Semester 2025/2026
  // ─────────────────────────────────────────────────────────
  await prisma.semester.updateMany({ where: { tenantId: TENANT_ID, isCurrent: true }, data: { isCurrent: false } })

  const semester = await prisma.semester.upsert({
    where: {
      tenantId_academicYearId_name: {
        tenantId:       TENANT_ID,
        academicYearId: academicYear.id,
        name:           'FIRST',
      },
    },
    update: { isCurrent: true, status: 'ACTIVE' },
    create: {
      tenantId:            TENANT_ID,
      academicYearId:      academicYear.id,
      name:                'FIRST',
      termType:            'SEMESTER',
      startDate:           new Date('2025-09-01'),
      endDate:             new Date('2026-01-31'),
      isCurrent:           true,
      status:              'ACTIVE',
      registrationOpen:    new Date('2025-08-15'),   // reg open from Aug 15
      registrationClose:   new Date('2026-10-31'),   // closes Oct 31
      addDropDeadline:     new Date('2026-10-07'),   // add/drop deadline 2 weeks in
      maxCreditsPerStudent: 21,
    },
  })
  console.log('  Semester: First Semester 2025/2026 (ACTIVE, isCurrent)')

  // ─────────────────────────────────────────────────────────
  // 6. ROOMS
  // ─────────────────────────────────────────────────────────
  const [lha, lhb, cl1, bl1] = await Promise.all([
    prisma.room.upsert({
      where:  { tenantId_name: { tenantId: TENANT_ID, name: 'Lecture Hall A' } },
      update: {},
      create: { tenantId: TENANT_ID, name: 'Lecture Hall A', code: 'LHA', building: 'Main Block', floor: 'Ground', capacity: 150, roomType: 'LECTURE', hasProjector: true, hasAC: false },
    }),
    prisma.room.upsert({
      where:  { tenantId_name: { tenantId: TENANT_ID, name: 'Lecture Hall B' } },
      update: {},
      create: { tenantId: TENANT_ID, name: 'Lecture Hall B', code: 'LHB', building: 'Main Block', floor: '1st', capacity: 100, roomType: 'LECTURE', hasProjector: true, hasAC: false },
    }),
    prisma.room.upsert({
      where:  { tenantId_name: { tenantId: TENANT_ID, name: 'Computer Lab 1' } },
      update: {},
      create: { tenantId: TENANT_ID, name: 'Computer Lab 1', code: 'CL1', building: 'Science Block', floor: '1st', capacity: 40, roomType: 'COMPUTER_LAB', hasProjector: true, hasAC: true },
    }),
    prisma.room.upsert({
      where:  { tenantId_name: { tenantId: TENANT_ID, name: 'Business Lab' } },
      update: {},
      create: { tenantId: TENANT_ID, name: 'Business Lab', code: 'BL1', building: 'Business Block', floor: 'Ground', capacity: 50, roomType: 'LECTURE', hasProjector: true, hasAC: true },
    }),
  ])
  console.log('  Rooms: LHA, LHB, CL1, BL1')

  // ─────────────────────────────────────────────────────────
  // 7. COURSES
  // ─────────────────────────────────────────────────────────
  const [cs101, cs102, cs103, math101, ba101, ba102, acc101, it101, it102] = await Promise.all([
    // HND-CS level 100
    prisma.course.upsert({
      where:  { tenantId_code: { tenantId: TENANT_ID, code: 'CS101' } },
      update: {},
      create: { tenantId: TENANT_ID, departmentId: csDept.id, code: 'CS101', title: 'Introduction to Computing', creditHours: 3, level: 100, prerequisites: [] },
    }),
    prisma.course.upsert({
      where:  { tenantId_code: { tenantId: TENANT_ID, code: 'CS102' } },
      update: {},
      create: { tenantId: TENANT_ID, departmentId: csDept.id, code: 'CS102', title: 'Programming Fundamentals', creditHours: 3, level: 100, description: 'Introduction to programming using Python. Variables, control flow, functions, and basic data structures.', prerequisites: [] },
    }),
    prisma.course.upsert({
      where:  { tenantId_code: { tenantId: TENANT_ID, code: 'CS103' } },
      update: {},
      create: { tenantId: TENANT_ID, departmentId: csDept.id, code: 'CS103', title: 'Computer Organisation and Architecture', creditHours: 3, level: 100, prerequisites: [] },
    }),
    prisma.course.upsert({
      where:  { tenantId_code: { tenantId: TENANT_ID, code: 'MATH101' } },
      update: {},
      create: { tenantId: TENANT_ID, departmentId: csDept.id, code: 'MATH101', title: 'Calculus I', creditHours: 3, level: 100, description: 'Limits, derivatives, and integration for computing students.', prerequisites: [] },
    }),
    // HND-BA level 100
    prisma.course.upsert({
      where:  { tenantId_code: { tenantId: TENANT_ID, code: 'BA101' } },
      update: {},
      create: { tenantId: TENANT_ID, departmentId: baDept.id, code: 'BA101', title: 'Principles of Management', creditHours: 3, level: 100, prerequisites: [] },
    }),
    prisma.course.upsert({
      where:  { tenantId_code: { tenantId: TENANT_ID, code: 'BA102' } },
      update: {},
      create: { tenantId: TENANT_ID, departmentId: baDept.id, code: 'BA102', title: 'Business Communication', creditHours: 3, level: 100, prerequisites: [] },
    }),
    prisma.course.upsert({
      where:  { tenantId_code: { tenantId: TENANT_ID, code: 'ACC101' } },
      update: {},
      create: { tenantId: TENANT_ID, departmentId: afDept.id, code: 'ACC101', title: 'Financial Accounting I', creditHours: 3, level: 100, prerequisites: [] },
    }),
    // DIP-IT level 100
    prisma.course.upsert({
      where:  { tenantId_code: { tenantId: TENANT_ID, code: 'IT101' } },
      update: {},
      create: { tenantId: TENANT_ID, departmentId: itDept.id, code: 'IT101', title: 'IT Essentials', creditHours: 3, level: 100, prerequisites: [] },
    }),
    prisma.course.upsert({
      where:  { tenantId_code: { tenantId: TENANT_ID, code: 'IT102' } },
      update: {},
      create: { tenantId: TENANT_ID, departmentId: itDept.id, code: 'IT102', title: 'Networking Fundamentals', creditHours: 3, level: 100, prerequisites: [] },
    }),
  ])
  console.log('  Courses: CS101, CS102, CS103, MATH101, BA101, BA102, ACC101, IT101, IT102')

  // ─────────────────────────────────────────────────────────
  // 8. PROGRAM — COURSE LINKS
  // ─────────────────────────────────────────────────────────
  const pcEntries = [
    // HND-CS 100-level required courses
    { programId: hndCs.id, courseId: cs101.id,   level: 100, isRequired: true },
    { programId: hndCs.id, courseId: cs102.id,   level: 100, isRequired: true },
    { programId: hndCs.id, courseId: cs103.id,   level: 100, isRequired: true },
    { programId: hndCs.id, courseId: math101.id, level: 100, isRequired: true },
    // HND-BA 100-level required courses
    { programId: hndBa.id, courseId: ba101.id,   level: 100, isRequired: true },
    { programId: hndBa.id, courseId: ba102.id,   level: 100, isRequired: true },
    { programId: hndBa.id, courseId: acc101.id,  level: 100, isRequired: true },
    // DIP-IT 100-level
    { programId: dipIt.id, courseId: it101.id,   level: 100, isRequired: true },
    { programId: dipIt.id, courseId: it102.id,   level: 100, isRequired: true },
  ]
  await Promise.all(
    pcEntries.map(entry =>
      prisma.programCourse.upsert({
        where:  { programId_courseId: { programId: entry.programId, courseId: entry.courseId } },
        update: {},
        create: { tenantId: TENANT_ID, ...entry },
      })
    )
  )
  console.log('  ProgramCourses linked')

  // ─────────────────────────────────────────────────────────
  // 9. FEE STRUCTURES
  // ─────────────────────────────────────────────────────────
  const [tuitionFee, regFee, ictFee] = await Promise.all([
    // Update the existing "tution fee" or create it properly
    prisma.feeStructure.upsert({
      where:  { id: (await prisma.feeStructure.findFirst({ where: { tenantId: TENANT_ID, name: { contains: 'tution' } } }))?.id ?? 'none' },
      update: { name: 'Tuition Fee', amount: 150000, billingPeriod: 'SEMESTER', isActive: true, lateFeeGraceDays: 7, lateFeePercent: 5 },
      create: { tenantId: TENANT_ID, name: 'Tuition Fee', amount: 150000, billingPeriod: 'SEMESTER', isRecurring: true, isActive: true, lateFeeGraceDays: 7, lateFeePercent: 5, dueDate: new Date('2025-10-31') },
    }),
    prisma.feeStructure.upsert({
      where:  { id: (await prisma.feeStructure.findFirst({ where: { tenantId: TENANT_ID, name: 'Registration Fee' } }))?.id ?? 'none' },
      update: { amount: 25000 },
      create: { tenantId: TENANT_ID, name: 'Registration Fee', amount: 25000, billingPeriod: 'ONE_TIME', isRecurring: false, isActive: true, dueDate: new Date('2025-10-15') },
    }),
    prisma.feeStructure.upsert({
      where:  { id: (await prisma.feeStructure.findFirst({ where: { tenantId: TENANT_ID, name: 'Library & ICT Fee' } }))?.id ?? 'none' },
      update: { amount: 15000 },
      create: { tenantId: TENANT_ID, name: 'Library & ICT Fee', amount: 15000, billingPeriod: 'SEMESTER', isRecurring: true, isActive: true },
    }),
  ])
  console.log('  Fee structures: Tuition (150,000 FCFA), Registration (25,000 FCFA), Library & ICT (15,000 FCFA)')

  // ─────────────────────────────────────────────────────────
  // 10. STAFF — Lepasia John (TEACHER)
  // ─────────────────────────────────────────────────────────
  const staffPassword = await bcrypt.hash('Staff@fpui1', 10)
  const staffUser = await prisma.user.upsert({
    where:  { tenantId_email: { tenantId: TENANT_ID, email: 'lepasia.john@fpui.edu.cm' } },
    update: {},
    create: {
      tenantId:          TENANT_ID,
      email:             'lepasia.john@fpui.edu.cm',
      firstName:         'Lepasia',
      lastName:          'John',
      role:              'TEACHER',
      status:            'ACTIVE',
      gender:            'MALE',
      phone:             '+237690001122',
      passwordHash:      staffPassword,
      onboardingComplete: true,
      mustChangePassword: false,
    },
  })
  console.log('  Staff created: Lepasia John —', staffUser.email)

  // ─────────────────────────────────────────────────────────
  // 11. COURSE OFFERINGS  (Lepasia John teaches all for now)
  // ─────────────────────────────────────────────────────────
  // Unique constraint: tenantId_courseId_semesterId — use upsert-by-id trick
  async function upsertOffering(courseId: string, roomId: string, schedule: object[]) {
    const existing = await prisma.courseOffering.findUnique({
      where: { tenantId_courseId_semesterId: { tenantId: TENANT_ID, courseId, semesterId: semester.id } },
    })
    if (existing) return existing
    return prisma.courseOffering.create({
      data: {
        tenantId:    TENANT_ID,
        courseId,
        semesterId:  semester.id,
        teacherId:   staffUser.id,
        roomId:      roomId,
        room:        (await prisma.room.findUnique({ where: { id: roomId }, select: { name: true } }))?.name,
        maxStudents: 50,
        schedule,
      },
    })
  }

  const [off_cs101, off_cs102, off_cs103, off_math101, off_ba101, off_it101] = await Promise.all([
    upsertOffering(cs101.id,   lha.id,  [{ day: 'MON', startTime: '08:00', endTime: '10:00' }, { day: 'WED', startTime: '08:00', endTime: '10:00' }]),
    upsertOffering(cs102.id,   cl1.id,  [{ day: 'TUE', startTime: '10:00', endTime: '12:00' }, { day: 'THU', startTime: '10:00', endTime: '12:00' }]),
    upsertOffering(cs103.id,   lhb.id,  [{ day: 'MON', startTime: '10:00', endTime: '12:00' }, { day: 'WED', startTime: '10:00', endTime: '12:00' }]),
    upsertOffering(math101.id, lhb.id,  [{ day: 'TUE', startTime: '08:00', endTime: '10:00' }, { day: 'FRI', startTime: '08:00', endTime: '10:00' }]),
    upsertOffering(ba101.id,   bl1.id,  [{ day: 'TUE', startTime: '14:00', endTime: '16:00' }, { day: 'THU', startTime: '14:00', endTime: '16:00' }]),
    upsertOffering(it101.id,   cl1.id,  [{ day: 'WED', startTime: '14:00', endTime: '16:00' }, { day: 'FRI', startTime: '10:00', endTime: '12:00' }]),
  ])
  console.log('  Course Offerings: CS101, CS102, CS103, MATH101, BA101, IT101')

  // ─────────────────────────────────────────────────────────
  // 12. STUDENT — Blaise Tembong
  // ─────────────────────────────────────────────────────────
  const studentPassword = await bcrypt.hash('Student@fpui1', 10)
  const studentUser = await prisma.user.upsert({
    where:  { tenantId_email: { tenantId: TENANT_ID, email: 'blaise.tembong@fpui.edu.cm' } },
    update: {},
    create: {
      tenantId:          TENANT_ID,
      email:             'blaise.tembong@fpui.edu.cm',
      firstName:         'Blaise',
      lastName:          'Tembong',
      role:              'STUDENT',
      status:            'ACTIVE',
      gender:            'MALE',
      phone:             '+237677445566',
      dateOfBirth:       new Date('2003-04-12'),
      passwordHash:      studentPassword,
      onboardingComplete: true,
      mustChangePassword: false,
    },
  })

  // Student Profile
  const existingProfile = await (prisma as any).studentProfile.findUnique({ where: { userId: studentUser.id } })
  const studentProfile = existingProfile ?? await (prisma as any).studentProfile.create({
    data: {
      tenantId:         TENANT_ID,
      userId:           studentUser.id,
      studentId:        'STU/2025/0001',
      programId:        hndCs.id,
      level:            100,
      admissionYear:    2025,
      expectedGradYear: 2028,
      emergencyName:    'Mama Tembong',
      emergencyPhone:   '+237677100200',
      emergencyRelation: 'Mother',
    },
  })
  console.log('  Student created: Blaise Tembong —', studentUser.email, '| ID:', studentProfile.studentId)

  // ─────────────────────────────────────────────────────────
  // 13. INVOICE for Blaise Tembong
  // ─────────────────────────────────────────────────────────
  const existingInvoice = await prisma.invoice.findFirst({
    where: { tenantId: TENANT_ID, studentId: studentUser.id },
  })

  if (!existingInvoice) {
    const totalAmount = 150000 + 25000 + 15000   // tuition + registration + ICT (FCFA)
    const invoice = await prisma.invoice.create({
      data: {
        tenantId:    TENANT_ID,
        studentId:   studentUser.id,
        semesterId:  semester.id,
        invoiceNo:   'FPUI-2025-0001',
        status:      'SENT',
        totalAmount,
        paidAmount:  0,
        dueDate:     new Date('2025-10-31'),
        issuedAt:    new Date('2025-09-01'),
        notes:       'First Semester 2025/2026 fees.',
        items: {
          create: [
            { description: 'Tuition Fee — First Semester 2025/2026', feeStructureId: tuitionFee.id, amount: 150000, quantity: 1, subtotal: 150000 },
            { description: 'Registration Fee',                        feeStructureId: regFee.id,    amount:  25000, quantity: 1, subtotal:  25000 },
            { description: 'Library & ICT Fee — First Semester',      feeStructureId: ictFee.id,    amount:  15000, quantity: 1, subtotal:  15000 },
          ],
        },
      },
    })
    console.log('  Invoice created: FPUI-2025-0001 — 190,000 FCFA SENT (due 31 Oct 2025)')
  } else {
    console.log('  Invoice already exists, skipping.')
  }

  // ─────────────────────────────────────────────────────────
  // 14. ENROLLMENTS for Blaise Tembong
  // ─────────────────────────────────────────────────────────
  // NOTE: fee clearance gate is normally enforced at runtime.
  // For seed purposes, we bypass it by inserting enrollments directly.
  const enrollTargets = [
    { offeringId: off_cs101.id,   courseName: 'CS101' },
    { offeringId: off_cs102.id,   courseName: 'CS102' },
    { offeringId: off_math101.id, courseName: 'MATH101' },
  ]

  for (const { offeringId, courseName } of enrollTargets) {
    await prisma.enrollment.upsert({
      where: { tenantId_studentId_courseOfferingId: { tenantId: TENANT_ID, studentId: studentUser.id, courseOfferingId: offeringId } },
      update: {},
      create: { tenantId: TENANT_ID, studentId: studentUser.id, courseOfferingId: offeringId, status: 'ENROLLED' },
    })
    console.log(`  Enrolled Blaise in ${courseName}`)
  }

  // ─────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────
  console.log('')
  console.log('  Seed complete.')
  console.log('  ┌─────────────────────────────────────────────────────')
  console.log('  │  School:   Fomic Polytechnic University (fpui)')
  console.log('  │  Apply:    /apply/fpui')
  console.log('  │  Admin:    you@gmail.com  (existing)')
  console.log('  │')
  console.log('  │  Staff:    lepasia.john@fpui.edu.cm   pw: Staff@fpui1')
  console.log('  │  Student:  blaise.tembong@fpui.edu.cm pw: Student@fpui1')
  console.log('  │  Std ID:   STU/2025/0001   Program: HND-CS   Level: 100')
  console.log('  │  Invoice:  FPUI-2025-0001  190,000 FCFA SENT (Tuition + Reg + ICT)')
  console.log('  │  Enrolled: CS101, CS102, MATH101 (9 credit hours)')
  console.log('  └─────────────────────────────────────────────────────')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
