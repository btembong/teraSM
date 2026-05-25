/**
 * Tera SM — Demo Seed Script
 * Run: node prisma/seed.mjs
 * Seeds realistic demo data into the existing tenant.
 */
import { PrismaClient } from '@prisma/client'
import { createHash } from 'crypto'

const p = new PrismaClient()
const TENANT_ID = 'cmp18ao0n0000vrqkwcpugbwx'
const ADMIN_ID  = 'cmp18apw80002vrqkydmys4mj'

// Simple password hash (same as auth.ts uses bcrypt, but for demo users we set a known hash)
// We'll set a placeholder — these are demo accounts not meant to be logged into
const DEMO_PASS = '$2b$10$demo.placeholder.hash.not.real'

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function cuid() {
  return 'c' + uid() + uid()
}

async function main() {
  console.log('🌱 Seeding demo data for tenant:', TENANT_ID)

  // ─── 1. ACADEMIC YEAR + SEMESTER ──────────────────────────────────────
  console.log('📅 Creating academic year...')

  // Clear existing isCurrent flags
  await p.academicYear.updateMany({ where: { tenantId: TENANT_ID }, data: { isCurrent: false } })
  await p.semester.updateMany({ where: { tenantId: TENANT_ID }, data: { isCurrent: false } })

  const year = await p.academicYear.upsert({
    where: { tenantId_name: { tenantId: TENANT_ID, name: '2025/2026' } },
    update: { isCurrent: true },
    create: {
      tenantId: TENANT_ID,
      name: '2025/2026',
      startDate: new Date('2025-09-01'),
      endDate: new Date('2026-06-30'),
      isCurrent: true,
      gradingScale: 'PERCENTAGE',
      passMark: 50,
    },
  })

  const semester = await p.semester.upsert({
    where: { tenantId_academicYearId_name: { tenantId: TENANT_ID, academicYearId: year.id, name: 'FIRST' } },
    update: { isCurrent: true, status: 'ACTIVE' },
    create: {
      tenantId: TENANT_ID,
      academicYearId: year.id,
      name: 'FIRST',
      termType: 'SEMESTER',
      startDate: new Date('2025-09-01'),
      endDate: new Date('2026-01-31'),
      isCurrent: true,
      status: 'ACTIVE',
    },
  })

  console.log('  ✓ Academic year 2025/2026, First Semester')

  // ─── 2. DEPARTMENTS ───────────────────────────────────────────────────
  console.log('🏫 Creating departments...')

  const deptData = [
    { code: 'CS',  name: 'Computer Science',        description: 'Computing, software engineering and AI' },
    { code: 'BUS', name: 'Business Administration',  description: 'Management, finance and entrepreneurship' },
    { code: 'ENG', name: 'Engineering',              description: 'Civil, mechanical and electrical engineering' },
    { code: 'ART', name: 'Arts & Humanities',        description: 'Literature, philosophy and social sciences' },
  ]

  const depts = {}
  for (const d of deptData) {
    const dept = await p.department.upsert({
      where: { tenantId_code: { tenantId: TENANT_ID, code: d.code } },
      update: {},
      create: { tenantId: TENANT_ID, ...d },
    })
    depts[d.code] = dept
  }

  console.log('  ✓ 4 departments created')

  // ─── 3. COURSES ───────────────────────────────────────────────────────
  console.log('📚 Creating courses...')

  const courseData = [
    { code: 'CS101', title: 'Introduction to Programming',      deptCode: 'CS',  level: 100, creditHours: 3 },
    { code: 'CS201', title: 'Data Structures & Algorithms',     deptCode: 'CS',  level: 200, creditHours: 3 },
    { code: 'CS301', title: 'Database Systems',                 deptCode: 'CS',  level: 300, creditHours: 3 },
    { code: 'CS302', title: 'Artificial Intelligence',          deptCode: 'CS',  level: 300, creditHours: 3 },
    { code: 'BUS101', title: 'Principles of Management',        deptCode: 'BUS', level: 100, creditHours: 3 },
    { code: 'BUS201', title: 'Financial Accounting',            deptCode: 'BUS', level: 200, creditHours: 3 },
    { code: 'BUS301', title: 'Marketing Strategy',              deptCode: 'BUS', level: 300, creditHours: 3 },
    { code: 'ENG101', title: 'Engineering Mathematics I',       deptCode: 'ENG', level: 100, creditHours: 4 },
    { code: 'ENG201', title: 'Thermodynamics',                  deptCode: 'ENG', level: 200, creditHours: 3 },
    { code: 'ART101', title: 'Introduction to Literature',      deptCode: 'ART', level: 100, creditHours: 3 },
    { code: 'ART201', title: 'Philosophy of Mind',              deptCode: 'ART', level: 200, creditHours: 3 },
  ]

  const courses = {}
  for (const c of courseData) {
    const course = await p.course.upsert({
      where: { tenantId_code: { tenantId: TENANT_ID, code: c.code } },
      update: {},
      create: {
        tenantId: TENANT_ID,
        code: c.code,
        title: c.title,
        departmentId: depts[c.deptCode].id,
        level: c.level,
        creditHours: c.creditHours,
        status: 'ACTIVE',
      },
    })
    courses[c.code] = course
  }

  console.log('  ✓ 11 courses created')

  // ─── 4. TEACHER USERS ─────────────────────────────────────────────────
  console.log('👩‍🏫 Creating teacher users...')

  const teacherData = [
    { email: 'dr.amara@greenfield.edu', firstName: 'Amara',   lastName: 'Mensah',  },
    { email: 'prof.osei@greenfield.edu', firstName: 'Kofi',   lastName: 'Osei',    },
    { email: 'dr.tanaka@greenfield.edu', firstName: 'Yuki',   lastName: 'Tanaka',  },
    { email: 'prof.silva@greenfield.edu', firstName: 'Carlos', lastName: 'Silva',  },
  ]

  const teachers = []
  for (const t of teacherData) {
    const existing = await p.user.findFirst({ where: { tenantId: TENANT_ID, email: t.email } })
    if (existing) {
      teachers.push(existing)
    } else {
      const u = await p.user.create({
        data: {
          tenantId: TENANT_ID,
          email: t.email,
          firstName: t.firstName,
          lastName: t.lastName,
          role: 'TEACHER',
          status: 'ACTIVE',
          passwordHash: DEMO_PASS,
          onboardingComplete: true,
        },
      })
      teachers.push(u)
    }
  }

  console.log('  ✓', teachers.length, 'teachers')

  // ─── 5. STUDENT USERS ─────────────────────────────────────────────────
  console.log('🎓 Creating student users...')

  const studentNames = [
    ['Ama', 'Asante'], ['Kwame', 'Boateng'], ['Fatima', 'Diallo'], ['Samuel', 'Nkrumah'],
    ['Zainab', 'Ibrahim'], ['Emmanuel', 'Owusu'], ['Grace', 'Adom'], ['Daniel', 'Appiah'],
    ['Naomi', 'Adjei'], ['Michael', 'Ankrah'], ['Abena', 'Korsah'], ['Joseph', 'Tetteh'],
    ['Linda', 'Quaye'], ['David', 'Mensah'], ['Hannah', 'Osei'], ['Isaac', 'Acheampong'],
    ['Ruth', 'Darko'], ['Peter', 'Frimpong'], ['Sarah', 'Asare'], ['James', 'Bonsu'],
  ]

  const students = []
  for (const [fn, ln] of studentNames) {
    const email = `${fn.toLowerCase()}.${ln.toLowerCase()}@student.greenfield.edu`
    const existing = await p.user.findFirst({ where: { tenantId: TENANT_ID, email } })
    if (existing) {
      students.push(existing)
    } else {
      const u = await p.user.create({
        data: {
          tenantId: TENANT_ID,
          email,
          firstName: fn,
          lastName: ln,
          role: 'STUDENT',
          status: 'ACTIVE',
          passwordHash: DEMO_PASS,
          onboardingComplete: true,
        },
      })
      students.push(u)
    }
  }

  console.log('  ✓', students.length, 'students')

  // ─── 6. STAFF USERS ───────────────────────────────────────────────────
  console.log('👤 Creating staff users...')

  const staffData = [
    { email: 'hr@greenfield.edu',      firstName: 'Patricia', lastName: 'Agyei',  role: 'HR_ADMIN' },
    { email: 'finance@greenfield.edu', firstName: 'Stephen',  lastName: 'Brobbey', role: 'FINANCE_ADMIN' },
    { email: 'registrar@greenfield.edu', firstName: 'Janet',  lastName: 'Darko',  role: 'REGISTRAR' },
  ]

  const staffUsers = []
  for (const s of staffData) {
    const existing = await p.user.findFirst({ where: { tenantId: TENANT_ID, email: s.email } })
    if (existing) {
      staffUsers.push(existing)
    } else {
      const u = await p.user.create({
        data: {
          tenantId: TENANT_ID,
          email: s.email,
          firstName: s.firstName,
          lastName: s.lastName,
          role: s.role,
          status: 'ACTIVE',
          passwordHash: DEMO_PASS,
          onboardingComplete: true,
        },
      })
      staffUsers.push(u)
    }
  }

  console.log('  ✓', staffUsers.length, 'staff users')

  // ─── 7. COURSE OFFERINGS ──────────────────────────────────────────────
  console.log('📖 Creating course offerings...')

  const offeringMap = [
    { courseCode: 'CS101', teacherIdx: 0, room: 'LH-101', schedule: [{ day: 'MON', startTime: '08:00', endTime: '10:00' }, { day: 'WED', startTime: '08:00', endTime: '10:00' }] },
    { courseCode: 'CS201', teacherIdx: 0, room: 'LH-102', schedule: [{ day: 'TUE', startTime: '10:00', endTime: '12:00' }] },
    { courseCode: 'CS301', teacherIdx: 1, room: 'LH-201', schedule: [{ day: 'MON', startTime: '14:00', endTime: '16:00' }] },
    { courseCode: 'CS302', teacherIdx: 0, room: 'LH-203', schedule: [{ day: 'THU', startTime: '09:00', endTime: '11:00' }] },
    { courseCode: 'BUS101', teacherIdx: 2, room: 'BH-101', schedule: [{ day: 'MON', startTime: '09:00', endTime: '11:00' }] },
    { courseCode: 'BUS201', teacherIdx: 2, room: 'BH-202', schedule: [{ day: 'WED', startTime: '14:00', endTime: '16:00' }] },
    { courseCode: 'BUS301', teacherIdx: 3, room: 'BH-301', schedule: [{ day: 'FRI', startTime: '10:00', endTime: '12:00' }] },
    { courseCode: 'ENG101', teacherIdx: 3, room: 'EH-101', schedule: [{ day: 'TUE', startTime: '08:00', endTime: '10:00' }, { day: 'THU', startTime: '08:00', endTime: '10:00' }] },
    { courseCode: 'ART101', teacherIdx: 1, room: 'AH-101', schedule: [{ day: 'WED', startTime: '11:00', endTime: '13:00' }] },
  ]

  const offerings = {}
  for (const o of offeringMap) {
    const existing = await p.courseOffering.findFirst({
      where: { tenantId: TENANT_ID, courseId: courses[o.courseCode].id, semesterId: semester.id },
    })
    if (existing) {
      offerings[o.courseCode] = existing
    } else {
      const off = await p.courseOffering.create({
        data: {
          tenantId: TENANT_ID,
          courseId: courses[o.courseCode].id,
          semesterId: semester.id,
          teacherId: teachers[o.teacherIdx].id,
          room: o.room,
          maxStudents: 40,
          schedule: o.schedule,
        },
      })
      offerings[o.courseCode] = off
    }
  }

  console.log('  ✓', Object.keys(offerings).length, 'course offerings')

  // ─── 8. ENROLLMENTS ───────────────────────────────────────────────────
  console.log('📋 Enrolling students...')

  // Each student gets 3–5 courses
  const offeringList = Object.values(offerings)
  let enrollCount = 0
  for (let i = 0; i < students.length; i++) {
    const s = students[i]
    const numCourses = 3 + (i % 3) // 3, 4, or 5
    const myCourses = offeringList.slice(i % offeringList.length, (i % offeringList.length) + numCourses)
    for (const off of myCourses) {
      const exists = await p.enrollment.findFirst({ where: { tenantId: TENANT_ID, studentId: s.id, courseOfferingId: off.id } })
      if (!exists) {
        await p.enrollment.create({
          data: {
            tenantId: TENANT_ID,
            studentId: s.id,
            courseOfferingId: off.id,
            status: 'ENROLLED',
            enrolledAt: new Date(Date.now() - Math.random() * 30 * 24 * 3600 * 1000),
          },
        })
        enrollCount++
      }
    }
  }

  console.log('  ✓', enrollCount, 'new enrollments')

  // ─── 9. LMS — CONTENT + ASSIGNMENTS + SUBMISSIONS ─────────────────────
  console.log('📝 Creating LMS content, assignments, and submissions...')

  const cs101 = offerings['CS101']
  const bus101 = offerings['BUS101']
  const eng101 = offerings['ENG101']

  // Course content
  const contentItems = [
    { courseOfferingId: cs101.id, title: 'Week 1 Slides — Introduction to Python',         type: 'PDF',  url: 'https://example.com/cs101-week1.pdf',  isPublished: true },
    { courseOfferingId: cs101.id, title: 'Video: Variables and Data Types',                 type: 'VIDEO', url: 'https://example.com/cs101-video1.mp4', isPublished: true },
    { courseOfferingId: cs101.id, title: 'Week 2 Slides — Control Structures',              type: 'PDF',  url: 'https://example.com/cs101-week2.pdf',  isPublished: true },
    { courseOfferingId: bus101.id, title: 'Chapter 1 — Principles of Management',          type: 'PDF',  url: 'https://example.com/bus101-ch1.pdf',    isPublished: true },
    { courseOfferingId: bus101.id, title: 'Case Study: Toyota Lean Management',             type: 'DOCUMENT', url: 'https://example.com/toyota-case.docx', isPublished: true },
    { courseOfferingId: eng101.id, title: 'Calculus Review Notes',                         type: 'PDF',  url: 'https://example.com/eng101-calc.pdf',   isPublished: true },
    { courseOfferingId: eng101.id, title: 'Problem Set Week 1',                            type: 'PDF',  url: 'https://example.com/eng101-ps1.pdf',    isPublished: true },
  ]

  for (const c of contentItems) {
    const exists = await p.courseContent.findFirst({ where: { tenantId: TENANT_ID, courseOfferingId: c.courseOfferingId, title: c.title } })
    if (!exists) {
      await p.courseContent.create({
        data: { tenantId: TENANT_ID, ...c, order: 0, publishedAt: c.isPublished ? new Date() : null },
      })
    }
  }

  // Assignments
  const now = new Date()
  const assignmentData = [
    { courseOfferingId: cs101.id, title: 'Assignment 1: Hello World Program',   dueDate: new Date(now.getTime() - 3 * 24 * 3600000), isPublished: true },
    { courseOfferingId: cs101.id, title: 'Assignment 2: Calculator App',         dueDate: new Date(now.getTime() + 5 * 24 * 3600000), isPublished: true },
    { courseOfferingId: bus101.id, title: 'Essay: Theories of Management',       dueDate: new Date(now.getTime() - 1 * 24 * 3600000), isPublished: true },
    { courseOfferingId: bus101.id, title: 'Case Analysis: Amazon Leadership',    dueDate: new Date(now.getTime() + 7 * 24 * 3600000), isPublished: true },
    { courseOfferingId: eng101.id, title: 'Problem Set 1: Differentiation',      dueDate: new Date(now.getTime() - 2 * 24 * 3600000), isPublished: true },
    { courseOfferingId: eng101.id, title: 'Problem Set 2: Integration',          dueDate: new Date(now.getTime() + 10 * 24 * 3600000), isPublished: true },
  ]

  const assignments = []
  for (const a of assignmentData) {
    const exists = await p.assignment.findFirst({ where: { tenantId: TENANT_ID, courseOfferingId: a.courseOfferingId, title: a.title } })
    if (exists) {
      assignments.push(exists)
    } else {
      const asgn = await p.assignment.create({
        data: { tenantId: TENANT_ID, ...a, maxScore: 100, allowLate: false, publishedAt: a.isPublished ? new Date() : null },
      })
      assignments.push(asgn)
    }
  }

  // Submissions (SUBMITTED = pending teacher review)
  let subCount = 0
  for (let i = 0; i < Math.min(students.length, 12); i++) {
    const s = students[i]
    // Each student submits for 2 past-due assignments
    const pastAssignments = assignments.filter(a => a.dueDate < now).slice(0, 2)
    for (const asgn of pastAssignments) {
      const exists = await p.submission.findFirst({ where: { tenantId: TENANT_ID, assignmentId: asgn.id, studentId: s.id } })
      if (!exists) {
        await p.submission.create({
          data: {
            tenantId: TENANT_ID,
            assignmentId: asgn.id,
            studentId: s.id,
            status: 'SUBMITTED',
            content: 'My submission for this assignment. I completed all the required tasks as outlined in the instructions.',
            submittedAt: new Date(asgn.dueDate.getTime() - Math.random() * 12 * 3600000),
          },
        })
        subCount++
      }
    }
  }

  console.log('  ✓', contentItems.length, 'content items,', assignments.length, 'assignments,', subCount, 'submissions pending review')

  // ─── 10. HR SETUP ─────────────────────────────────────────────────────
  console.log('👔 Setting up HR...')

  // Leave types
  const leaveTypes = {}
  const ltData = [
    { name: 'Annual Leave',    code: 'AL', daysPerYear: 21, isPaid: true  },
    { name: 'Sick Leave',      code: 'SL', daysPerYear: 14, isPaid: true  },
    { name: 'Maternity Leave', code: 'ML', daysPerYear: 90, isPaid: true  },
    { name: 'Study Leave',     code: 'STL', daysPerYear: 10, isPaid: false },
  ]

  for (const lt of ltData) {
    const existing = await p.leaveType.findFirst({ where: { tenantId: TENANT_ID, code: lt.code } })
    if (existing) {
      leaveTypes[lt.code] = existing
    } else {
      const l = await p.leaveType.create({ data: { tenantId: TENANT_ID, ...lt, isActive: true } })
      leaveTypes[lt.code] = l
    }
  }

  // Employees (teachers + staff)
  const allStaff = [...teachers, ...staffUsers]
  const employees = []
  const positions = ['Lecturer', 'Senior Lecturer', 'Associate Professor', 'Professor', 'HR Manager', 'Finance Officer', 'Registrar Officer']

  for (let i = 0; i < allStaff.length; i++) {
    const u = allStaff[i]
    const exists = await p.employee.findFirst({ where: { tenantId: TENANT_ID, userId: u.id } })
    if (exists) {
      employees.push(exists)
    } else {
      const empNo = `EMP/${2024}/${String(i + 1).padStart(3, '0')}`
      const emp = await p.employee.create({
        data: {
          tenantId: TENANT_ID,
          userId: u.id,
          employeeNo: empNo,
          departmentId: i < 4 ? Object.values(depts)[i % 4].id : null,
          position: positions[i % positions.length],
          employmentType: 'FULL_TIME',
          status: 'ACTIVE',
          hireDate: new Date(`202${2 + (i % 3)}-0${1 + (i % 9)}-01`),
          basicSalary: 2500 + i * 250,
        },
      })
      employees.push(emp)

      // Leave balances
      const currentYear = new Date().getFullYear()
      for (const lt of Object.values(leaveTypes)) {
        const used = Math.floor(Math.random() * 5)
        await p.leaveBalance.create({
          data: {
            tenantId: TENANT_ID,
            employeeId: emp.id,
            leaveTypeId: lt.id,
            year: currentYear,
            entitled: lt.daysPerYear,
            used,
            pending: 0,
            remaining: lt.daysPerYear - used,
          },
        })
      }
    }
  }

  console.log('  ✓', employees.length, 'employees created')

  // Leave requests (PENDING — shows in pending actions)
  const pendingLeaveData = [
    { empIdx: 0, ltCode: 'AL', days: 5,  reason: 'Family vacation planned for the holiday period' },
    { empIdx: 1, ltCode: 'SL', days: 3,  reason: 'Medical appointment and recovery time needed' },
    { empIdx: 2, ltCode: 'STL', days: 4, reason: 'Attending international academic conference' },
    { empIdx: 3, ltCode: 'AL', days: 7,  reason: 'Annual leave — travel abroad' },
  ]

  let lrCount = 0
  for (const lr of pendingLeaveData) {
    const emp = employees[lr.empIdx]
    if (!emp) continue
    const lt = leaveTypes[lr.ltCode]
    const startDate = new Date(now.getTime() + (lr.empIdx + 1) * 7 * 24 * 3600000)
    const endDate = new Date(startDate.getTime() + lr.days * 24 * 3600000)
    const exists = await p.leaveRequest.findFirst({
      where: { tenantId: TENANT_ID, employeeId: emp.id, status: 'PENDING' },
    })
    if (!exists) {
      await p.leaveRequest.create({
        data: {
          tenantId: TENANT_ID,
          employeeId: emp.id,
          leaveTypeId: lt.id,
          startDate,
          endDate,
          days: lr.days,
          reason: lr.reason,
          status: 'PENDING',
        },
      })
      lrCount++
    }
  }

  console.log('  ✓', lrCount, 'pending leave requests')

  // Payroll periods
  const payrollMonths = [
    { name: 'September 2025', month: 9,  year: 2025, status: 'PAID' },
    { name: 'October 2025',   month: 10, year: 2025, status: 'PAID' },
    { name: 'November 2025',  month: 11, year: 2025, status: 'PROCESSING' },
    { name: 'December 2025',  month: 12, year: 2025, status: 'DRAFT' },
  ]

  const payrollPeriods = []
  for (const pp of payrollMonths) {
    const exists = await p.payrollPeriod.findFirst({ where: { tenantId: TENANT_ID, month: pp.month, year: pp.year } })
    if (exists) {
      payrollPeriods.push(exists)
    } else {
      const period = await p.payrollPeriod.create({
        data: {
          tenantId: TENANT_ID,
          ...pp,
          processedAt: pp.status !== 'DRAFT' ? new Date() : null,
          paidAt: pp.status === 'PAID' ? new Date() : null,
        },
      })
      payrollPeriods.push(period)

      // Payslips for paid periods
      if (pp.status === 'PAID') {
        for (const emp of employees) {
          const exists2 = await p.payslip.findFirst({ where: { tenantId: TENANT_ID, employeeId: emp.id, payrollPeriodId: period.id } })
          if (!exists2) {
            const allowances = emp.basicSalary * 0.2
            const deductions = emp.basicSalary * 0.1
            await p.payslip.create({
              data: {
                tenantId: TENANT_ID,
                employeeId: emp.id,
                payrollPeriodId: period.id,
                basicSalary: emp.basicSalary,
                allowances,
                deductions,
                netPay: emp.basicSalary + allowances - deductions,
              },
            })
          }
        }
      }
    }
  }

  console.log('  ✓ 4 payroll periods created')

  // ─── 11. FINANCE ──────────────────────────────────────────────────────
  console.log('💰 Creating fee structures and invoices...')

  // Fee structures
  const feeStructData = [
    { name: 'Tuition Fee — CS',    amount: 3500, programId: depts['CS'].id },
    { name: 'Tuition Fee — BUS',   amount: 3200, programId: depts['BUS'].id },
    { name: 'Tuition Fee — ENG',   amount: 3800, programId: depts['ENG'].id },
    { name: 'Tuition Fee — ART',   amount: 2800, programId: depts['ART'].id },
    { name: 'Library Fee',         amount: 150,  programId: null },
    { name: 'Laboratory Fee',      amount: 300,  programId: null },
    { name: 'Student Union Fee',   amount: 80,   programId: null },
  ]

  for (const f of feeStructData) {
    const exists = await p.feeStructure.findFirst({ where: { tenantId: TENANT_ID, name: f.name } })
    if (!exists) {
      await p.feeStructure.create({
        data: { tenantId: TENANT_ID, ...f, semesterId: semester.id, isRecurring: true, isActive: true },
      })
    }
  }

  // Invoices: mix of PAID, SENT, OVERDUE
  let invoiceCount = 0
  const statuses = ['PAID', 'PAID', 'SENT', 'OVERDUE', 'PARTIALLY_PAID']
  for (let i = 0; i < students.length; i++) {
    const s = students[i]
    const invoiceNo = `INV-2025-${String(i + 1).padStart(4, '0')}`
    const exists = await p.invoice.findFirst({ where: { tenantId: TENANT_ID, invoiceNo } })
    if (!exists) {
      const status = statuses[i % statuses.length]
      const totalAmount = 3500 + (i % 4) * 300
      const paidAmount = status === 'PAID' ? totalAmount : status === 'PARTIALLY_PAID' ? totalAmount * 0.5 : 0
      const dueDate = new Date(now.getTime() + (status === 'OVERDUE' ? -10 : 30) * 24 * 3600000)

      const inv = await p.invoice.create({
        data: {
          tenantId: TENANT_ID,
          studentId: s.id,
          semesterId: semester.id,
          invoiceNo,
          status,
          totalAmount,
          paidAmount,
          dueDate,
          issuedAt: new Date(now.getTime() - 14 * 24 * 3600000),
        },
      })

      // Invoice item
      await p.invoiceItem.create({
        data: {
          invoiceId: inv.id,
          description: 'Tuition Fee — First Semester 2025/2026',
          amount: totalAmount,
          quantity: 1,
          subtotal: totalAmount,
        },
      })

      // Payment record for paid invoices
      if (status === 'PAID') {
        await p.payment.create({
          data: {
            tenantId: TENANT_ID,
            studentId: s.id,
            invoiceId: inv.id,
            amount: totalAmount,
            method: 'PAYSTACK',
            status: 'SUCCESS',
            reference: `PAY-${invoiceNo}-${Date.now()}-${i}`,
            paidAt: new Date(now.getTime() - Math.random() * 20 * 24 * 3600000),
          },
        })
      }

      invoiceCount++
    }
  }

  console.log('  ✓', invoiceCount, 'invoices created (mix of PAID, SENT, OVERDUE)')

  // ─── 12. SCHOLARSHIPS ─────────────────────────────────────────────────
  const scholarData = [
    { name: 'Merit Excellence Award', type: 'SCHOLARSHIP', amount: 1000, description: 'Awarded to students with CGPA above 3.5' },
    { name: 'Need-Based Bursary',     type: 'BURSARY',     amount: 800,  description: 'Financial support for students in need' },
    { name: 'Sports Achievement',     type: 'SCHOLARSHIP', percentage: 25, description: 'For student athletes representing the school' },
  ]

  for (const sc of scholarData) {
    const exists = await p.scholarship.findFirst({ where: { tenantId: TENANT_ID, name: sc.name } })
    if (!exists) {
      await p.scholarship.create({ data: { tenantId: TENANT_ID, ...sc, isActive: true } })
    }
  }

  // ─── 13. LIVE CLASSES ─────────────────────────────────────────────────
  console.log('🎥 Creating live classes...')

  const todayDate = new Date()
  todayDate.setHours(9, 0, 0, 0)

  const liveClassData = [
    { courseCode: 'CS101', teacherIdx: 0, title: 'Intro to Python — Week 3', scheduledAt: new Date(todayDate), status: 'SCHEDULED' },
    { courseCode: 'BUS101', teacherIdx: 2, title: 'Leadership Theories Discussion', scheduledAt: new Date(todayDate.getTime() + 2 * 3600000), status: 'SCHEDULED' },
    { courseCode: 'ENG101', teacherIdx: 3, title: 'Problem Solving Session — Calculus', scheduledAt: new Date(todayDate.getTime() - 7 * 24 * 3600000), status: 'ENDED' },
    { courseCode: 'CS201', teacherIdx: 0, title: 'Sorting Algorithms Deep Dive', scheduledAt: new Date(todayDate.getTime() - 14 * 24 * 3600000), status: 'ENDED' },
  ]

  for (const lc of liveClassData) {
    const off = offerings[lc.courseCode]
    if (!off) continue
    const roomName = `room-${lc.courseCode.toLowerCase()}-${lc.status.toLowerCase()}-${Date.now()}`
    const exists = await p.liveClass.findFirst({ where: { tenantId: TENANT_ID, courseOfferingId: off.id, title: lc.title } })
    if (!exists) {
      await p.liveClass.create({
        data: {
          tenantId: TENANT_ID,
          courseOfferingId: off.id,
          teacherId: teachers[lc.teacherIdx].id,
          title: lc.title,
          scheduledAt: lc.scheduledAt,
          durationMins: 90,
          status: lc.status,
          roomName,
          startedAt: lc.status === 'ENDED' ? new Date(lc.scheduledAt.getTime()) : null,
          endedAt: lc.status === 'ENDED' ? new Date(lc.scheduledAt.getTime() + 90 * 60000) : null,
        },
      })
    }
  }

  console.log('  ✓ 4 live classes created')

  // ─── 14. ANNOUNCEMENTS ────────────────────────────────────────────────
  console.log('📢 Creating announcements...')

  const announcementData = [
    { title: 'Welcome Back — First Semester 2025/2026 Begins!', body: 'We are pleased to welcome all students and staff back for the 2025/2026 academic year. Classes commence on Monday 8th September. Please ensure all registration and fee payment is completed before the end of Week 2. We wish you all a productive and successful semester.', audience: 'ALL', isPinned: true },
    { title: 'Fee Payment Deadline — 30th November 2025', body: 'A reminder that the deadline for full fee payment for the first semester is 30th November 2025. Students with outstanding balances after this date will incur a 5% late penalty. Please visit the Finance Office or log in to the student portal to make your payment. Scholarship recipients should ensure their award letters are submitted to the Finance Office.', audience: 'STUDENTS', isPinned: false },
    { title: 'Staff Training Day — 15th November 2025', body: 'All teaching and administrative staff are required to attend the mandatory professional development training on Saturday 15th November 2025 from 9:00 AM to 3:00 PM in the Main Hall. Topics include the new LMS features, student welfare updates, and the 2026 accreditation preparation process. Attendance is compulsory. Please confirm attendance with the HR Office by 10th November.', audience: 'STAFF', isPinned: false },
    { title: 'Library Extended Hours During Exam Period', body: 'The university library will operate extended hours from 7:00 AM to 11:00 PM daily during the examination period (15th January to 31st January 2026). Digital library resources are available 24/7 through the student portal. Students requiring access to special collections or research assistance should book appointments via the library desk.', audience: 'ALL', isPinned: false },
    { title: 'New LMS Features Now Live', body: 'The Learning Management System has been upgraded with several new features including video lecture playback, improved assignment submission, and AI-powered essay feedback. Teachers can now upload SCORM content and create interactive quizzes. Students will notice a redesigned course homepage with a personalised deadline tracker. Please report any issues to the IT helpdesk.', audience: 'ALL', isPinned: false },
  ]

  for (const a of announcementData) {
    const exists = await p.announcement.findFirst({ where: { tenantId: TENANT_ID, title: a.title } })
    if (!exists) {
      await p.announcement.create({
        data: {
          tenantId: TENANT_ID,
          authorId: ADMIN_ID,
          ...a,
          isPublished: true,
          publishedAt: new Date(now.getTime() - Math.random() * 14 * 24 * 3600000),
        },
      })
    }
  }

  console.log('  ✓ 5 announcements created')

  // ─── 15. AUDIT LOGS ───────────────────────────────────────────────────
  const auditEntries = [
    { action: 'user.created',          details: { email: 'ama.asante@student.greenfield.edu', role: 'STUDENT' } },
    { action: 'enrollment.created',    details: { course: 'CS101', student: 'Ama Asante' } },
    { action: 'announcement.created',  details: { title: 'Welcome Back — First Semester 2025/2026 Begins!' } },
    { action: 'invoice.created',       details: { invoiceNo: 'INV-2025-0001', amount: 3500 } },
    { action: 'leave.approved',        details: { employee: 'Dr. Amara Mensah', days: 5 } },
    { action: 'user.created',          details: { email: 'kwame.boateng@student.greenfield.edu', role: 'STUDENT' } },
    { action: 'invoice.paid',          details: { invoiceNo: 'INV-2025-0002', amount: 3800 } },
    { action: 'enrollment.created',    details: { course: 'BUS101', student: 'Fatima Diallo' } },
  ]

  const existingLogs = await p.auditLog.count({ where: { tenantId: TENANT_ID } })
  if (existingLogs === 0) {
    for (let i = 0; i < auditEntries.length; i++) {
      const e = auditEntries[i]
      await p.auditLog.create({
        data: {
          tenantId: TENANT_ID,
          userId: ADMIN_ID,
          action: e.action,
          details: e.details,
          ipAddress: '196.201.214.5',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          createdAt: new Date(now.getTime() - (auditEntries.length - i) * 3 * 3600000),
        },
      })
    }
    console.log('  ✓ 8 audit log entries')
  }

  // ─── 16. UPDATE TENANT NAME ───────────────────────────────────────────
  await p.tenant.update({
    where: { id: TENANT_ID },
    data: { name: 'Green Field University', plan: 'PRO' },
  })

  console.log('\n✅ Seed complete! Summary:')
  console.log('  Tenant: Green Field University (PRO plan)')
  console.log('  4 departments, 11 courses, 9 course offerings')
  console.log('  4 teachers, 20 students, 3 staff')
  console.log('  Enrollments, LMS content, assignments, submissions')
  console.log('  HR: employees, leave types, pending leave requests, payroll')
  console.log('  Finance: fee structures, invoices (mix of PAID/SENT/OVERDUE)')
  console.log('  5 announcements, live classes, audit logs')
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => p.$disconnect())
