import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Users } from 'lucide-react'

const statusColor: Record<string, string> = {
  ACTIVE: 'bg-blue-50 text-blue-700',
  ON_LEAVE: 'bg-blue-100 text-blue-600',
  SUSPENDED: 'bg-gray-100 text-gray-500',
  TERMINATED: 'bg-gray-100 text-gray-500',
  RESIGNED: 'bg-gray-100 text-gray-500',
}

const typeColor: Record<string, string> = {
  FULL_TIME: 'bg-blue-50 text-blue-700',
  PART_TIME: 'bg-blue-100 text-blue-600',
  CONTRACT: 'bg-gray-100 text-gray-600',
  INTERN: 'bg-gray-50 text-gray-500',
}

export default async function AdminEmployeesPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const tenantId = (session.user as any).tenantId

  const employees = await prisma.employee.findMany({
    where: { tenantId },
    orderBy: { hireDate: 'desc' },
  })

  const userIds = employees.map((e) => e.userId)
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
  })
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]))

  const departments = await prisma.department.findMany({ where: { tenantId }, select: { id: true, name: true } })
  const deptMap = Object.fromEntries(departments.map((d) => [d.id, d.name]))

  const activeCount = employees.filter((e) => e.status === 'ACTIVE').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-500">{activeCount} active staff members</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 md:grid-cols-4">
        {(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN'] as const).map((type) => {
          const count = employees.filter((e) => e.employmentType === type).length
          return (
            <div key={type} className="bg-white rounded-2xl border border-gray-200 p-4">
              <p className="text-xl font-bold text-gray-900">{count}</p>
              <p className="text-sm text-gray-500 mt-1">{type.replace('_', ' ')}</p>
            </div>
          )
        })}
      </div>

      {/* Employee table */}
      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">All Staff ({employees.length})</h2>
        </div>
        {employees.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No employees added yet.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {employees.map((emp) => {
              const user = userMap[emp.userId]
              return (
                <div key={emp.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-700 flex-shrink-0">
                      {user?.firstName?.[0] ?? '?'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
                      <p className="text-sm text-gray-500">{emp.position} {emp.departmentId ? `· ${deptMap[emp.departmentId] ?? ''}` : ''}</p>
                      <p className="text-xs text-gray-400">{emp.employeeNo}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden md:block">
                      <p className="text-sm font-medium text-gray-900">${emp.basicSalary.toLocaleString()}</p>
                      <p className="text-xs text-gray-400">Hired {new Date(emp.hireDate).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${typeColor[emp.employmentType] ?? ''}`}>
                      {emp.employmentType.replace('_', ' ')}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusColor[emp.status] ?? ''}`}>
                      {emp.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
