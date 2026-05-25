'use client'

import { useState } from 'react'
import {
  Calendar, Clock, CheckCircle, ArrowRight, Loader2,
  Video, Users, MessageSquare, X,
} from 'lucide-react'

// ── Helpers ───────────────────────────────────────────────────────────────────

function getBusinessDays(count: number): Date[] {
  const days: Date[] = []
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  while (days.length < count) {
    d.setDate(d.getDate() + 1)
    if (d.getDay() !== 0 && d.getDay() !== 6) days.push(new Date(d))
  }
  return days
}

const DAY_SHORT  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MON_SHORT  = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const TIMES      = ['9:00 AM', '12:00 PM', '3:00 PM']

const ROLES = [
  'Principal / Head of School',
  'School Administrator',
  'Registrar',
  'Finance Officer',
  'HR Manager',
  'Teacher / Lecturer',
  'IT Manager',
  'Other',
]

const COUNTS = ['Under 200', '200 – 500', '500 – 1,000', '1,000 – 3,000', '3,000 – 10,000', 'Over 10,000']

const EXPECT = [
  {
    icon: Video,
    title: 'Live walkthrough',
    desc: 'We screen-share the actual platform configured for your institution type, so you see exactly what your staff and students would see.',
  },
  {
    icon: MessageSquare,
    title: 'Q&A time included',
    desc: 'The last 10 minutes are yours. Ask anything about features, pricing, migration, or integrations.',
  },
  {
    icon: Users,
    title: 'A real person, not a bot',
    desc: 'You will speak to a team member who actually knows the product, not a generic sales script.',
  },
]

// ── Confirmation modal ────────────────────────────────────────────────────────

function ConfirmModal({
  email, slot, onClose,
}: {
  email: string; slot: string; onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: 'blur(6px)', background: 'rgba(0,0,0,0.55)' }}
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-3xl p-10 max-w-md w-full relative shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Blue icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-blue-600 dark:text-blue-400" />
            </div>
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border-2 border-blue-200 dark:border-blue-800 scale-110" />
          </div>
        </div>

        {/* Text */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            You are booked!
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
            A confirmation has been sent to{' '}
            <strong className="text-gray-900 dark:text-white">{email}</strong>.
            Our team will reach out within a few hours to confirm your call link.
          </p>
        </div>

        {/* Slot summary */}
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-2xl px-5 py-4 flex items-center gap-3 mb-8">
          <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <div>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wide mb-0.5">Your slot</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">{slot}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={onClose}
            className="w-full py-3 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 transition-colors text-sm"
          >
            Got it, thanks
          </button>
          <div className="flex items-center justify-center gap-4 text-sm">
            <a href="/features" className="text-blue-600 hover:text-blue-700 font-medium">Explore features</a>
            <span className="text-gray-300 dark:text-gray-700">|</span>
            <a href="/register" className="text-blue-600 hover:text-blue-700 font-medium">Start free trial</a>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function BookingSection() {
  const days = getBusinessDays(5)

  const [selectedSlot, setSelectedSlot] = useState<{ day: number; time: string } | null>(null)
  const [form, setForm]   = useState({ name: '', email: '', school: '', role: '', count: '' })
  const [loading, setLoading] = useState(false)
  const [done, setDone]   = useState(false)
  const [slot, setSlot]   = useState('')
  const [error, setError] = useState('')

  function setField(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedSlot) { setError('Please choose a date and time.'); return }
    if (!form.name || !form.email || !form.school || !form.role || !form.count) {
      setError('Please fill in all fields.')
      return
    }
    setError('')
    setLoading(true)

    const day      = days[selectedSlot.day]
    const slotLabel = `${DAY_SHORT[day.getDay()]} ${day.getDate()} ${MON_SHORT[day.getMonth()]} at ${selectedSlot.time} WAT`

    try {
      const res = await fetch('/api/book-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, slot: slotLabel }),
      })
      if (!res.ok) throw new Error()
      setSlot(slotLabel)
      setDone(true)
    } catch {
      setError('Something went wrong. Please try again or email us directly.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Confirmation modal */}
      {done && (
        <ConfirmModal
          email={form.email}
          slot={slot}
          onClose={() => setDone(false)}
        />
      )}

      <section id="book-demo" className="py-24 bg-white dark:bg-gray-950">
        <div className="max-w-6xl mx-auto px-6">

          {/* Heading */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-full px-4 py-1.5 text-sm text-blue-700 dark:text-blue-400 font-medium mb-6">
              <Video className="w-3.5 h-3.5" />
              Live product demo
            </div>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              See Tera SM live in 30 minutes
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
              Not sure if Tera SM is right for your institution? Book a live walkthrough
              tailored to your specific needs. No sales pressure, just answers.
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-12 items-start">

            {/* Left: what to expect */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-5 text-lg">What to expect</h3>
                <div className="space-y-5">
                  {EXPECT.map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="flex gap-4">
                      <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/30 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{title}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trust badges */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-5 space-y-3">
                {[
                  '30 minutes, done.',
                  'No credit card required.',
                  'No commitment, just answers.',
                  'Available Mon to Fri, 9 AM to 5 PM WAT.',
                ].map((t) => (
                  <div key={t} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    {t}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: slot picker + form */}
            <div className="lg:col-span-3">
              <form onSubmit={submit} className="space-y-8">

                {/* Slot picker */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">Pick a date and time (WAT)</p>
                  </div>

                  <div className="grid grid-cols-5 gap-2">
                    {days.map((day, di) => (
                      <div key={di} className="flex flex-col gap-2">
                        <div className="text-center pb-1 border-b border-gray-100 dark:border-gray-800">
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{DAY_SHORT[day.getDay()]}</p>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{day.getDate()}</p>
                          <p className="text-xs text-gray-400">{MON_SHORT[day.getMonth()]}</p>
                        </div>
                        {TIMES.map((time) => {
                          const active = selectedSlot?.day === di && selectedSlot?.time === time
                          return (
                            <button
                              key={time}
                              type="button"
                              onClick={() => setSelectedSlot({ day: di, time })}
                              className={`text-xs py-2 px-1 rounded-xl border font-medium transition-all text-center ${
                                active
                                  ? 'bg-blue-600 border-blue-600 text-white'
                                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-blue-400 hover:text-blue-600'
                              }`}
                            >
                              {time}
                            </button>
                          )
                        })}
                      </div>
                    ))}
                  </div>

                  {selectedSlot && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-xl px-4 py-2">
                      <Clock className="w-4 h-4 flex-shrink-0" />
                      <span>
                        <strong>
                          {DAY_SHORT[days[selectedSlot.day].getDay()]}{' '}
                          {days[selectedSlot.day].getDate()}{' '}
                          {MON_SHORT[days[selectedSlot.day].getMonth()]}
                        </strong>{' '}
                        at <strong>{selectedSlot.time} WAT</strong> selected
                      </span>
                    </div>
                  )}
                </div>

                {/* Form fields */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Full name</label>
                    <input
                      type="text"
                      placeholder="Dr. Amara Osei"
                      value={form.name}
                      onChange={setField('name')}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Work email</label>
                    <input
                      type="email"
                      placeholder="amara@accraacademy.edu.gh"
                      value={form.email}
                      onChange={setField('email')}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">School / institution name</label>
                    <input
                      type="text"
                      placeholder="Accra Academy Senior High School"
                      value={form.school}
                      onChange={setField('school')}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Your role</label>
                    <select
                      value={form.role}
                      onChange={setField('role')}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="">Select your role</option>
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Approximate student count</label>
                    <select
                      value={form.count}
                      onChange={setField('count')}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="">Select range</option>
                      {COUNTS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900 rounded-xl px-4 py-3">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Booking your demo...
                    </>
                  ) : (
                    <>
                      Book my demo <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-xs text-center text-gray-400 dark:text-gray-500">
                  We will confirm via email within a few hours. All times are West Africa Time (UTC+1).
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
