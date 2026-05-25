import { MessageSquare, CheckCircle, Wifi, Signal, Battery } from 'lucide-react'

const messages = [
  {
    time: '10:32 AM',
    tag: 'Result',
    tagBg: 'bg-blue-100 text-blue-700',
    text: 'Your Semester 1 results are ready. GPA: 3.7 / 4.0 — Dean\'s List! View your full results and download your transcript:',
    link: 'portal.accraacademy.edu.gh/results',
  },
  {
    time: '11:00 AM',
    tag: 'Fee Reminder',
    tagBg: 'bg-amber-100 text-amber-700',
    text: 'Your Q2 invoice of GHS 1,200 is due in 3 days. Pay instantly with MTN MoMo or Paystack:',
    link: 'portal.accraacademy.edu.gh/pay',
  },
  {
    time: '8:47 AM',
    tag: 'Class Alert',
    tagBg: 'bg-slate-100 text-slate-600',
    text: 'CS 301 (Today, 10:00 AM) has been cancelled by Dr. Mensah. Your updated timetable:',
    link: 'portal.accraacademy.edu.gh/timetable',
  },
]

const benefits = [
  'Fee reminders with one-tap MoMo / Paystack link',
  'Results published — parents notified in seconds',
  'Class cancellations sent the moment they happen',
  'Zero manual effort from your admin team',
  'Delivered to every network across Africa',
]

export default function WhatsAppShowcase() {
  return (
    <section className="py-24 bg-white dark:bg-gray-950 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* ── Left: text ── */}
          <div>
            <div className="inline-flex items-center gap-2 bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900 rounded-full px-4 py-1.5 text-sm text-green-700 dark:text-green-400 font-medium mb-6">
              <MessageSquare className="w-3.5 h-3.5" />
              WhatsApp automation
            </div>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-5">
              Stop sending WhatsApp messages manually
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
              Every school in Africa already uses WhatsApp to communicate — but manually.
              Tera SM automates every notification so your team never types a single
              message again.
            </p>
            <ul className="space-y-3 mb-8">
              {benefits.map(b => (
                <li key={b} className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl px-5 py-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Powered by</p>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">WhatsApp Business API via Twilio</p>
              <p className="text-xs text-gray-400 mt-0.5">Official API — verified sender, no bans, full delivery reports</p>
            </div>
          </div>

          {/* ── Right: iPhone mockup ── */}
          <div className="flex justify-center lg:justify-end">
            {/*
              Outer wrapper applies the 3-D tilt.
              The phone itself is pure CSS — no images.
            */}
            <div
              style={{
                transform: 'perspective(1400px) rotateY(-18deg) rotateX(6deg) rotateZ(2deg)',
                filter: 'drop-shadow(40px 40px 80px rgba(0,0,0,0.35))',
              }}
            >
              {/* ── iPhone frame ── */}
              <div
                className="relative"
                style={{
                  width: 280,
                  height: 580,
                  borderRadius: 48,
                  background: 'linear-gradient(145deg, #3a3a3c 0%, #1c1c1e 60%, #2a2a2c 100%)',
                  padding: 3,
                  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.12), 0 0 0 1px rgba(0,0,0,0.8)',
                }}
              >

                {/* Volume buttons — left side */}
                {[52, 96, 128].map((top, i) => (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      left: -4,
                      top,
                      width: 4,
                      height: i === 0 ? 28 : 44,
                      borderRadius: '3px 0 0 3px',
                      background: 'linear-gradient(to right, #2a2a2c, #3a3a3c)',
                      boxShadow: '-1px 0 0 rgba(255,255,255,0.08)',
                    }}
                  />
                ))}

                {/* Power button — right side */}
                <div
                  style={{
                    position: 'absolute',
                    right: -4,
                    top: 108,
                    width: 4,
                    height: 60,
                    borderRadius: '0 3px 3px 0',
                    background: 'linear-gradient(to left, #2a2a2c, #3a3a3c)',
                    boxShadow: '1px 0 0 rgba(255,255,255,0.08)',
                  }}
                />

                {/* ── Screen ── */}
                <div
                  className="overflow-hidden relative"
                  style={{
                    borderRadius: 46,
                    width: '100%',
                    height: '100%',
                    background: '#fff',
                  }}
                >
                  {/* Screen gloss */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.14) 0%, transparent 45%)',
                      zIndex: 20,
                      pointerEvents: 'none',
                      borderRadius: 46,
                    }}
                  />

                  {/* Status bar */}
                  <div className="flex items-center justify-between px-6 pt-4 pb-1 bg-green-900">
                    <span className="text-white text-xs font-semibold">9:41</span>
                    {/* Dynamic Island */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 12,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 90,
                        height: 26,
                        background: '#000',
                        borderRadius: 20,
                        zIndex: 10,
                      }}
                    />
                    <div className="flex items-center gap-1">
                      <Signal className="w-3 h-3 text-white" />
                      <Wifi className="w-3 h-3 text-white" />
                      <Battery className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>

                  {/* WhatsApp header */}
                  <div className="bg-green-900 px-4 py-3 flex items-center gap-3">
                    <div className="w-9 h-9 bg-green-700 rounded-full flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold leading-tight">Accra Academy</p>
                      <p className="text-green-300 text-xs">School notifications · online</p>
                    </div>
                  </div>

                  {/* Chat body */}
                  <div
                    className="p-3 space-y-3 flex-1"
                    style={{ background: '#e5ddd5', minHeight: 400 }}
                  >
                    {messages.map(({ time, tag, tagBg, text, link }) => (
                      <div key={tag} className="flex flex-col items-start">
                        <div
                          className="bg-white rounded-2xl rounded-tl-sm p-3 shadow-sm"
                          style={{ maxWidth: '92%' }}
                        >
                          <p className="text-xs font-bold text-green-700 mb-1">Accra Academy</p>
                          <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-semibold mb-1.5 ${tagBg}`}>
                            {tag}
                          </span>
                          <p className="text-xs text-gray-700 leading-relaxed">{text}</p>
                          <p className="text-xs text-blue-600 underline mt-1 break-all">{link}</p>
                          <div className="flex items-center justify-end gap-1 mt-1.5">
                            <span className="text-xs text-gray-400">{time}</span>
                            <span style={{ color: '#53bdeb', fontSize: 11 }}>✓✓</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Input bar */}
                  <div
                    className="flex items-center gap-2 px-3 py-2 border-t border-gray-200"
                    style={{ background: '#f0f0f0' }}
                  >
                    <div className="flex-1 bg-white rounded-full px-3 py-1.5">
                      <p className="text-xs text-gray-400">Reply...</p>
                    </div>
                    <div className="w-7 h-7 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span style={{ color: '#fff', fontSize: 12 }}>➤</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
