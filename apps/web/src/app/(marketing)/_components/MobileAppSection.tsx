import { Smartphone, CheckCircle, BarChart2, BookOpen, CreditCard, Bell, Users, Calendar, Wifi, Signal, Battery, GraduationCap } from 'lucide-react'

const features = [
  'Works on iOS and Android',
  'Offline mode for low-connectivity areas',
  'Push notifications for results, fees, and alerts',
  'Biometric login — fingerprint and Face ID',
  'Digital student ID with scannable QR code',
]

// ── Shared iPhone shell ────────────────────────────────────────────────────────
function IPhoneShell({
  tilt,
  children,
  shadow,
}: {
  tilt: string
  children: React.ReactNode
  shadow: string
}) {
  return (
    <div style={{ transform: tilt, filter: shadow, flexShrink: 0 }}>
      {/* Titanium frame */}
      <div
        style={{
          width: 240,
          height: 500,
          borderRadius: 44,
          background: 'linear-gradient(145deg, #3a3a3c 0%, #1c1c1e 55%, #2c2c2e 100%)',
          padding: 3,
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.12), 0 0 0 1px rgba(0,0,0,0.8)',
          position: 'relative',
        }}
      >
        {/* Volume buttons — left */}
        {[44, 86, 112].map((top, i) => (
          <div
            key={i}
            style={{
              position: 'absolute', left: -4, top,
              width: 4, height: i === 0 ? 26 : 38,
              borderRadius: '3px 0 0 3px',
              background: 'linear-gradient(to right, #2a2a2c, #3a3a3c)',
              boxShadow: '-1px 0 0 rgba(255,255,255,0.06)',
            }}
          />
        ))}
        {/* Power button — right */}
        <div
          style={{
            position: 'absolute', right: -4, top: 96,
            width: 4, height: 52,
            borderRadius: '0 3px 3px 0',
            background: 'linear-gradient(to left, #2a2a2c, #3a3a3c)',
            boxShadow: '1px 0 0 rgba(255,255,255,0.06)',
          }}
        />
        {/* Screen */}
        <div style={{ borderRadius: 42, width: '100%', height: '100%', overflow: 'hidden', background: '#fff', position: 'relative' }}>
          {/* Gloss */}
          <div
            style={{
              position: 'absolute', inset: 0, zIndex: 20, pointerEvents: 'none', borderRadius: 42,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.13) 0%, transparent 45%)',
            }}
          />
          {/* Dynamic Island */}
          <div
            style={{
              position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
              width: 80, height: 24, background: '#000', borderRadius: 18, zIndex: 10,
            }}
          />
          {children}
        </div>
      </div>
    </div>
  )
}

// ── Student screen content ─────────────────────────────────────────────────────
function StudentScreen() {
  return (
    <>
      {/* Status bar */}
      <div className="flex items-center justify-between px-5 pt-4 pb-1 bg-blue-600" style={{ paddingTop: 38 }}>
        <span className="text-white text-xs font-bold">9:41</span>
        <div className="flex items-center gap-1">
          <Signal className="w-3 h-3 text-white" />
          <Wifi className="w-3 h-3 text-white" />
          <Battery className="w-3 h-3 text-white" />
        </div>
      </div>
      {/* Header */}
      <div className="bg-blue-600 px-4 pb-4">
        <p className="text-white text-sm font-bold leading-tight">Greenfield College</p>
        <p className="text-blue-200 text-xs">Student Portal</p>
        <div className="mt-3 bg-white/15 rounded-2xl px-3 py-2.5 flex items-center gap-2">
          <div className="w-8 h-8 bg-white/25 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">A</span>
          </div>
          <div>
            <p className="text-white text-xs font-semibold leading-tight">Amara Mensah</p>
            <p className="text-blue-200 text-xs">CS Year 3 · GPA 3.7</p>
          </div>
        </div>
      </div>
      {/* Nav items */}
      <div className="p-3 space-y-2 bg-gray-50 flex-1">
        {[
          { icon: BarChart2,    label: 'Dashboard',  color: 'text-blue-600',   bg: 'bg-blue-50',   active: true  },
          { icon: BookOpen,     label: 'My Courses', color: 'text-indigo-600', bg: 'bg-indigo-50', active: false },
          { icon: CreditCard,   label: 'Fees',       color: 'text-green-600',  bg: 'bg-green-50',  active: false },
          { icon: Calendar,     label: 'Timetable',  color: 'text-purple-600', bg: 'bg-purple-50', active: false },
          { icon: GraduationCap,label: 'Grades',     color: 'text-orange-600', bg: 'bg-orange-50', active: false },
          { icon: Bell,         label: 'Alerts',     color: 'text-rose-600',   bg: 'bg-rose-50',   active: false },
        ].map(({ icon: Icon, label, color, bg, active }) => (
          <div key={label} className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 ${active ? bg : 'bg-white border border-gray-100'}`}>
            <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${active ? color : 'text-gray-400'}`} />
            <span className={`text-xs font-semibold ${active ? color : 'text-gray-500'}`}>{label}</span>
            {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />}
          </div>
        ))}
      </div>
    </>
  )
}

// ── Parent screen content ──────────────────────────────────────────────────────
function ParentScreen() {
  return (
    <>
      {/* Status bar */}
      <div className="flex items-center justify-between px-5 pb-1 bg-indigo-700" style={{ paddingTop: 38 }}>
        <span className="text-white text-xs font-bold">9:41</span>
        <div className="flex items-center gap-1">
          <Signal className="w-3 h-3 text-white" />
          <Wifi className="w-3 h-3 text-white" />
          <Battery className="w-3 h-3 text-white" />
        </div>
      </div>
      {/* Header */}
      <div className="bg-indigo-700 px-4 pb-4">
        <p className="text-white text-sm font-bold">Greenfield College</p>
        <p className="text-indigo-200 text-xs">Parent Portal</p>
        <div className="mt-3 flex items-center gap-2.5">
          <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
            <Users className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white text-xs font-semibold">Mrs. Mensah</p>
            <p className="text-indigo-200 text-xs">Amara · Grade 11A</p>
          </div>
        </div>
      </div>
      {/* Stats */}
      <div className="p-3 grid grid-cols-2 gap-2 bg-gray-50">
        {[
          { label: 'GPA',          value: '3.7',  sub: 'Semester 1',  color: 'text-blue-600',   bg: 'bg-blue-50'   },
          { label: 'Attendance',   value: '92%',  sub: 'This term',   color: 'text-green-600',  bg: 'bg-green-50'  },
          { label: 'Fee balance',  value: '$240', sub: 'Due Feb 15',  color: 'text-orange-500', bg: 'bg-orange-50' },
          { label: 'Last result',  value: 'A-',   sub: 'Maths 301',   color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(({ label, value, sub, color, bg }) => (
          <div key={label} className={`${bg} rounded-2xl p-3`}>
            <p className={`text-lg font-bold ${color}`}>{value}</p>
            <p className="text-xs font-semibold text-gray-700 leading-tight">{label}</p>
            <p className="text-xs text-gray-400 leading-tight">{sub}</p>
          </div>
        ))}
      </div>
      {/* Pay button */}
      <div className="px-3 pt-1">
        <div className="bg-indigo-600 rounded-2xl px-4 py-3 text-center">
          <p className="text-white text-sm font-bold">Pay fees — GHS 1,200</p>
          <p className="text-indigo-200 text-xs mt-0.5">MTN MoMo · Paystack · Card</p>
        </div>
      </div>
    </>
  )
}

// ── Section ────────────────────────────────────────────────────────────────────
export default function MobileAppSection() {
  return (
    <section className="py-24 bg-gray-950 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left: two tilted iPhones */}
          <div className="flex items-center justify-center gap-4" style={{ minHeight: 540 }}>

            {/* Student phone — tilts left */}
            <div style={{ marginTop: 40 }}>
              <p className="text-center text-xs font-semibold text-slate-500 mb-4 uppercase tracking-widest">Student</p>
              <IPhoneShell
                tilt="perspective(1400px) rotateY(-18deg) rotateX(5deg) rotateZ(3deg)"
                shadow="drop-shadow(30px 30px 60px rgba(0,0,0,0.5))"
              >
                <StudentScreen />
              </IPhoneShell>
            </div>

            {/* Parent phone — tilts right */}
            <div style={{ marginTop: -20 }}>
              <p className="text-center text-xs font-semibold text-slate-500 mb-4 uppercase tracking-widest">Parent</p>
              <IPhoneShell
                tilt="perspective(1400px) rotateY(15deg) rotateX(5deg) rotateZ(-2deg)"
                shadow="drop-shadow(-30px 30px 60px rgba(0,0,0,0.5))"
              >
                <ParentScreen />
              </IPhoneShell>
            </div>
          </div>

          {/* Right: text */}
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-950/60 border border-blue-800/50 rounded-full px-4 py-1.5 text-sm text-blue-400 font-medium mb-6">
              <Smartphone className="w-3.5 h-3.5" />
              Mobile apps
            </div>
            <h2 className="text-4xl font-bold text-white mb-5">
              In every pocket, on every device
            </h2>
            <p className="text-slate-400 mb-8 leading-relaxed">
              Students check their timetable. Parents pay fees and track grades.
              Teachers mark attendance. All from the native iOS and Android app,
              even on slow connections.
            </p>
            <ul className="space-y-3 mb-10">
              {features.map(f => (
                <li key={f} className="flex items-center gap-3 text-sm text-slate-300">
                  <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            {/* Store badges */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 hover:bg-white/10 transition-colors cursor-pointer">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <div>
                  <p className="text-xs text-slate-400 leading-none">Download on the</p>
                  <p className="text-white font-semibold text-sm">App Store</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 hover:bg-white/10 transition-colors cursor-pointer">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3.18 23.76c.37.21.8.19 1.17-.03l12.6-7.34-2.68-2.68-11.09 10.05zM.5 1.49C.19 1.86 0 2.38 0 3.02v17.96c0 .64.19 1.16.5 1.53l.08.08 10.06-10.06v-.24L.58 1.41.5 1.49zM20.08 10.26l-2.57-1.49-2.99 2.99 2.99 2.99 2.59-1.51c.74-.43.74-1.55-.02-1.98zM4.35.27L16.95 7.61l-2.68 2.68L3.18.24C3.55.02 3.98.06 4.35.27z"/>
                </svg>
                <div>
                  <p className="text-xs text-slate-400 leading-none">Get it on</p>
                  <p className="text-white font-semibold text-sm">Google Play</p>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-600 mt-3">Mobile apps launching Q3 2026. Join the waitlist with your free trial.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
