import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Building, Users, Wifi } from 'lucide-react'

export default async function StudentHostelPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const studentId = (session.user as any).id
  const tenantId = (session.user as any).tenantId

  const allocation = await prisma.hostelAllocation.findFirst({
    where: { tenantId, studentId, isActive: true },
    include: { room: true },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hostel</h1>
        <p className="text-gray-500">Your accommodation details</p>
      </div>

      {!allocation ? (
        <div className="bg-white rounded-2xl border border-gray-200 text-center py-16">
          <Building className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No hostel allocation</p>
          <p className="text-gray-400 text-sm mt-1">Contact the accommodation office to apply for hostel.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center">
              <Building className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{allocation.room.building}</h2>
              <p className="text-gray-500">Room {allocation.room.roomNumber} · Floor {allocation.room.floor}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Building', value: allocation.room.building },
              { label: 'Room', value: allocation.room.roomNumber },
              { label: 'Capacity', value: `${allocation.room.occupied}/${allocation.room.capacity} occupied` },
              { label: 'Monthly Fee', value: `$${allocation.room.monthlyFee.toLocaleString()}` },
            ].map((item) => (
              <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">{item.label}</p>
                <p className="font-semibold text-gray-900 mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>

          {allocation.room.amenities.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Amenities</p>
              <div className="flex flex-wrap gap-2">
                {allocation.room.amenities.map((a) => (
                  <span key={a} className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg font-medium">
                    <Wifi className="w-3 h-3" />
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400">
            Allocated since {new Date(allocation.startDate).toLocaleDateString()}
            {allocation.endDate && ` · Until ${new Date(allocation.endDate).toLocaleDateString()}`}
          </div>
        </div>
      )}
    </div>
  )
}
