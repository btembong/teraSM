import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Trophy, Star, Flame, BookOpen, CheckCircle, Users, Zap, Award, TrendingUp, Lock } from 'lucide-react'

// ── XP rules ────────────────────────────────────────────────────────────────
function calcXP(stats: {
  attendanceRate: number
  avgScore: number
  submittedAssignments: number
  enrolledCourses: number
  profileComplete: boolean
  hasDownloadedId: boolean
}) {
  let xp = 0
  xp += Math.round(stats.attendanceRate * 2)       // up to 200 XP
  xp += Math.round(stats.avgScore * 1.5)            // up to 150 XP
  xp += stats.submittedAssignments * 10             // 10 per submission
  xp += stats.enrolledCourses * 15                  // 15 per course
  if (stats.profileComplete) xp += 50
  if (stats.hasDownloadedId) xp += 25
  return xp
}

function xpLevel(xp: number): { level: number; title: string; nextXP: number } {
  const thresholds = [
    { level: 1, title: 'Freshman',    nextXP: 100  },
    { level: 2, title: 'Scholar',     nextXP: 300  },
    { level: 3, title: 'Achiever',    nextXP: 600  },
    { level: 4, title: 'Honor Roll',  nextXP: 1000 },
    { level: 5, title: 'Dean\'s Star', nextXP: 9999 },
  ]
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (xp >= (i === 0 ? 0 : thresholds[i - 1].nextXP)) {
      return thresholds[i]
    }
  }
  return thresholds[0]
}

type Badge = {
  id: string
  icon: React.ElementType
  label: string
  desc: string
  earned: boolean
  color: string
}

export default async function AchievementsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const studentId = (session.user as any).id
  const tenantId = (session.user as any).tenantId

  const [user, attendances, grades, submissions, enrollments] = await Promise.all([
    prisma.user.findUnique({
      where: { id: studentId },
      select: { phone: true, avatarUrl: true, dateOfBirth: true, createdAt: true },
    }),
    prisma.attendance.findMany({
      where: { tenantId, studentId },
      select: { status: true },
    }),
    prisma.grade.findMany({
      where: { tenantId, studentId, publishedAt: { not: null } },
      select: { totalScore: true, gradePoint: true, courseOffering: { select: { course: { select: { creditHours: true } } } } },
    }),
    prisma.submission.findMany({
      where: { tenantId, studentId },
      select: { id: true, submittedAt: true },
    }),
    prisma.enrollment.findMany({
      where: { tenantId, studentId, status: 'ENROLLED' },
      select: { id: true },
    }),
  ])

  const present = attendances.filter(a => a.status === 'PRESENT').length
  const attendanceRate = attendances.length > 0 ? (present / attendances.length) * 100 : 0

  const totalPoints = grades.reduce((s, g) => s + (g.gradePoint ?? 0) * g.courseOffering.course.creditHours, 0)
  const totalCredits = grades.reduce((s, g) => s + g.courseOffering.course.creditHours, 0)
  const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0
  const avgScore = grades.length > 0 ? grades.reduce((s, g) => s + (g.totalScore ?? 0), 0) / grades.length : 0

  const profileComplete = !!(user?.phone && user?.dateOfBirth)

  const xp = calcXP({
    attendanceRate,
    avgScore,
    submittedAssignments: submissions.length,
    enrolledCourses: enrollments.length,
    profileComplete,
    hasDownloadedId: false,
  })

  const { level, title, nextXP } = xpLevel(xp)
  const prevXP = level > 1 ? [0, 100, 300, 600, 1000][level - 1] : 0
  const progressPct = Math.min(((xp - prevXP) / (nextXP - prevXP)) * 100, 100)

  // Attendance streak (consecutive present days — simplified)
  let streak = 0
  const sorted = [...attendances].reverse()
  for (const a of sorted) {
    if (a.status === 'PRESENT') streak++
    else break
  }

  const badges: Badge[] = [
    {
      id: 'first_login',
      icon: Star,
      label: 'Pioneer',
      desc: 'Logged in for the first time',
      earned: true,
      color: 'bg-blue-600',
    },
    {
      id: 'profile_complete',
      icon: CheckCircle,
      label: 'Profile Pro',
      desc: 'Completed your profile setup',
      earned: profileComplete,
      color: 'bg-indigo-600',
    },
    {
      id: 'enrolled',
      icon: BookOpen,
      label: 'Course Ready',
      desc: 'Enrolled in at least one course',
      earned: enrollments.length >= 1,
      color: 'bg-blue-500',
    },
    {
      id: 'first_submission',
      icon: Zap,
      label: 'Submitted',
      desc: 'Submitted your first assignment',
      earned: submissions.length >= 1,
      color: 'bg-violet-600',
    },
    {
      id: 'streak_5',
      icon: Flame,
      label: '5-Day Streak',
      desc: '5 consecutive days present',
      earned: streak >= 5,
      color: 'bg-orange-500',
    },
    {
      id: 'streak_20',
      icon: Flame,
      label: 'Perfect Month',
      desc: '20 consecutive days present',
      earned: streak >= 20,
      color: 'bg-red-500',
    },
    {
      id: 'gpa_3',
      icon: TrendingUp,
      label: 'High Achiever',
      desc: 'GPA of 3.0 or above',
      earned: gpa >= 3.0,
      color: 'bg-green-600',
    },
    {
      id: 'gpa_35',
      icon: Award,
      label: "Dean's List",
      desc: 'GPA of 3.5 or above',
      earned: gpa >= 3.5,
      color: 'bg-yellow-500',
    },
    {
      id: 'assignments_10',
      icon: CheckCircle,
      label: 'On It',
      desc: '10 assignments submitted',
      earned: submissions.length >= 10,
      color: 'bg-teal-600',
    },
    {
      id: 'full_attendance',
      icon: Users,
      label: 'Never Miss a Beat',
      desc: '100% attendance in a semester',
      earned: attendanceRate === 100 && attendances.length > 0,
      color: 'bg-blue-700',
    },
  ]

  const earned = badges.filter(b => b.earned).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Achievements</h1>
        <p className="text-sm text-gray-500 mt-1">Track your progress and earn badges as you go</p>
      </div>

      {/* XP Card */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.1),_transparent_60%)]" />
        <div className="relative flex flex-wrap items-center justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-5 h-5 text-yellow-300" />
              <span className="text-blue-200 text-sm font-medium">Level {level}</span>
            </div>
            <h2 className="text-3xl font-bold">{title}</h2>
            <p className="text-blue-200 text-sm mt-0.5">{xp.toLocaleString()} XP total</p>
          </div>
          <div className="text-right">
            <p className="text-blue-200 text-xs mb-1">{earned} / {badges.length} badges</p>
            <div className="flex gap-1 flex-wrap justify-end">
              {badges.filter(b => b.earned).slice(0, 5).map(b => (
                <div key={b.id} className={`w-7 h-7 ${b.color} rounded-full flex items-center justify-center`}>
                  <b.icon className="w-3.5 h-3.5 text-white" />
                </div>
              ))}
              {earned > 5 && <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold">+{earned - 5}</div>}
            </div>
          </div>
        </div>
        {/* XP Progress */}
        <div>
          <div className="flex justify-between text-xs text-blue-200 mb-1.5">
            <span>{xp} XP</span>
            <span>Next level: {nextXP} XP</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Attendance', value: `${Math.round(attendanceRate)}%`, icon: Users,    color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Avg Score',  value: avgScore > 0 ? `${Math.round(avgScore)}%` : '—', icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Submissions',value: String(submissions.length), icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Day Streak', value: String(streak),             icon: Flame,       color: 'text-orange-500', bg: 'bg-orange-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center text-center">
            <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-2`}>
              <Icon className={`w-4.5 h-4.5 ${color}`} />
            </div>
            <p className="text-xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Badges */}
      <div>
        <h2 className="font-semibold text-gray-900 text-sm mb-3">Badges ({earned} / {badges.length} earned)</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {badges.map(b => (
            <div
              key={b.id}
              className={`relative bg-white border rounded-2xl p-4 flex flex-col items-center text-center transition-all ${
                b.earned ? 'border-blue-100 shadow-sm' : 'border-gray-100 opacity-50'
              }`}
            >
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-2.5 ${b.earned ? b.color : 'bg-gray-100'}`}>
                {b.earned
                  ? <b.icon className="w-5 h-5 text-white" />
                  : <Lock className="w-4 h-4 text-gray-400" />
                }
              </div>
              <p className={`text-xs font-bold leading-tight mb-1 ${b.earned ? 'text-gray-900' : 'text-gray-400'}`}>{b.label}</p>
              <p className="text-xs text-gray-400 leading-tight">{b.desc}</p>
              {b.earned && (
                <div className="absolute top-2 right-2 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
