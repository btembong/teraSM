'use client'

import { useState, useRef, useEffect } from 'react'
import type { ChangeEvent, KeyboardEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Building2, User, Mail, Eye, EyeOff, ChevronRight, ChevronLeft,
  Upload, Palette, BookOpen, MapPin, Award, Check, ShieldCheck,
  Loader2, X, CheckCircle2
} from 'lucide-react'

/* ─── Step definitions ─────────────────────────────────── */
const STEPS = [
  { id: 1, title: 'Your account',       desc: 'Admin credentials + PIN',          icon: User },
  { id: 2, title: 'Verify email',        desc: 'Confirm your email address',       icon: Mail },
  { id: 3, title: 'School identity',     desc: 'About your institution',           icon: Building2 },
  { id: 4, title: 'Location & contact',  desc: 'Address and contact details',      icon: MapPin },
  { id: 5, title: 'Academic setup',      desc: 'Structure, grading & calendar',    icon: BookOpen },
  { id: 6, title: 'Branding',            desc: 'Logo, colours & subdomain',        icon: Palette },
  { id: 7, title: 'Choose plan',         desc: 'Pick your subscription',           icon: Award },
]

/* ─── Static option lists ───────────────────────────────── */
const COUNTRIES = [
  'Nigeria','Ghana','Kenya','South Africa','Uganda','Tanzania','Rwanda',
  "Côte d'Ivoire",'Senegal','Cameroon','Ethiopia','Egypt','Morocco',
  'United Kingdom','United States','Canada','Australia','India','Other',
]
const INSTITUTION_TYPES = [
  'Primary School','Secondary School','Primary & Secondary (K-12)',
  'College of Education','Polytechnic / Technical College',
  'University','Vocational & Training Institute','Multi-campus Group','Other',
]
const STUDENT_COUNTS = ['Under 100','100–500','500–1,000','1,000–3,000','3,000–10,000','Over 10,000']
const STAFF_COUNTS   = ['1–10','11–50','51–200','201–500','Over 500']
const ACADEMIC_CALS  = [
  'Semester (2 per year)',
  'Trimester (3 per year)',
  'Quarter (4 per year)',
  'Term-based (3 terms)',
  'Custom',
]
const GRADING = [
  'GPA 4.0 Scale','GPA 5.0 Scale','GPA 7.0 Scale',
  'Percentage (0–100)','Letter Grade (A–F)','Custom',
]
const LANGUAGES  = ['English','French','Arabic','Portuguese','Swahili','Spanish','Other']
const CURRENCIES = [
  { code: 'USD', label: 'USD — US Dollar' },
  { code: 'GHS', label: 'GHS — Ghanaian Cedi' },
  { code: 'NGN', label: 'NGN — Nigerian Naira' },
  { code: 'KES', label: 'KES — Kenyan Shilling' },
  { code: 'ZAR', label: 'ZAR — South African Rand' },
  { code: 'XOF', label: 'XOF — CFA Franc' },
  { code: 'GBP', label: 'GBP — British Pound' },
  { code: 'EUR', label: 'EUR — Euro' },
]
const TIMEZONES = [
  { value: 'Africa/Accra',         label: 'Africa/Accra (GMT+0)' },
  { value: 'Africa/Lagos',         label: 'Africa/Lagos (GMT+1)' },
  { value: 'Africa/Nairobi',       label: 'Africa/Nairobi (GMT+3)' },
  { value: 'Africa/Johannesburg',  label: 'Africa/Johannesburg (GMT+2)' },
  { value: 'Africa/Cairo',         label: 'Africa/Cairo (GMT+2)' },
  { value: 'Europe/London',        label: 'Europe/London (GMT+0/+1)' },
  { value: 'America/New_York',     label: 'America/New_York (GMT-5/-4)' },
  { value: 'Asia/Kolkata',         label: 'Asia/Kolkata (GMT+5:30)' },
]

const PLANS = [
  {
    id: 'starter', name: 'Starter', monthly: 49, annual: 42, cap: '500 students',
    highlight: false,
    features: ['Core academics','Basic finance','Student portal','Email alerts','10 GB storage'],
  },
  {
    id: 'pro', name: 'Pro', monthly: 149, annual: 127, cap: '3,000 students',
    highlight: true, badge: 'Most popular',
    features: ['Full LMS + live classes','HR & payroll','Parent portal','Custom domain','100 GB'],
  },
  {
    id: 'enterprise', name: 'Enterprise', monthly: 399, annual: 339, cap: '10,000 students',
    highlight: false,
    features: ['AI features','Advanced analytics','Career & alumni','White-label','500 GB'],
  },
  {
    id: 'university', name: 'University', monthly: 0, annual: 0, cap: 'Unlimited',
    highlight: false, badge: 'Custom pricing',
    features: ['Thesis portal','Research repo','Multi-campus','On-premise option','Custom SLA'],
  },
]

/* ─── Form state ────────────────────────────────────────── */
interface FormState {
  firstName: string; lastName: string; email: string
  password: string; confirmPassword: string
  pinDigits: string[]; pin: string
  schoolName: string; shortName: string; institutionType: string
  yearEstablished: string; registrationNumber: string; accreditationBody: string
  motto: string; description: string; studentCount: string; staffCount: string
  country: string; state: string; city: string; address: string
  postalCode: string; phone: string; schoolEmail: string; website: string
  academicCalendar: string; gradingSystem: string
  language: string; timezone: string; currency: string
  logoPreview: string; primaryColor: string; accentColor: string
  subdomain: string; subdomainStatus: 'idle' | 'checking' | 'available' | 'taken'
  plan: string; billing: 'monthly' | 'annual'
}

const initialForm: FormState = {
  firstName:'', lastName:'', email:'', password:'', confirmPassword:'',
  pinDigits:['','','',''], pin:'',
  schoolName:'', shortName:'', institutionType:'', yearEstablished:'',
  registrationNumber:'', accreditationBody:'', motto:'', description:'',
  studentCount:'', staffCount:'',
  country:'', state:'', city:'', address:'', postalCode:'',
  phone:'', schoolEmail:'', website:'',
  academicCalendar:'', gradingSystem:'',
  language:'English', timezone:'Africa/Lagos', currency:'USD',
  logoPreview:'', primaryColor:'#2563EB', accentColor:'#7C3AED',
  subdomain:'', subdomainStatus:'idle',
  plan:'pro', billing:'monthly',
}

const slide = {
  enter: (d: number) => ({ opacity: 0, x: d > 0 ? 32 : -32 }),
  center: { opacity: 1, x: 0 },
  exit:  (d: number) => ({ opacity: 0, x: d > 0 ? -32 : 32 }),
}

const baseInput = 'w-full h-11 px-3.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all'

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}
function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(baseInput, className)} {...props} />
}
function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return (
    <select className={cn(baseInput, 'cursor-pointer appearance-none', className)} {...props}>
      {children}
    </select>
  )
}
function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn('w-full px-3.5 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all resize-none', className)}
      {...props}
    />
  )
}

/* ═══════════════════════════════════════════════════════ */
export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep]       = useState(1)
  const [dir, setDir]         = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [otp, setOtp]         = useState(['','','','','',''])
  const otpRefs  = useRef<(HTMLInputElement | null)[]>([])
  const pinRefs  = useRef<(HTMLInputElement | null)[]>([])
  const sdTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [form, setForm] = useState<FormState>(initialForm)
  const set = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm(prev => ({ ...prev, [key]: val }))
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoUploadErr, setLogoUploadErr] = useState('')

  useEffect(() => {
    if (step === 6 && form.schoolName && !form.subdomain) {
      set('subdomain', form.schoolName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20))
    }
  }, [step]) // eslint-disable-line react-hooks/exhaustive-deps

  const checkSubdomain = (val: string) => {
    const slug = val.toLowerCase().replace(/[^a-z0-9-]/g, '')
    set('subdomain', slug)
    set('subdomainStatus', 'checking')
    if (sdTimer.current) clearTimeout(sdTimer.current)
    sdTimer.current = setTimeout(() => {
      const reserved = ['school','demo','test','admin','app','api','www','terasms']
      set('subdomainStatus', reserved.includes(slug) ? 'taken' : 'available')
    }, 700)
  }

  const handleOtp = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return
    const n = [...otp]; n[i] = val; setOtp(n)
    if (val && i < 5) otpRefs.current[i + 1]?.focus()
  }
  const handleOtpKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus()
  }

  const handlePin = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return
    const n = [...form.pinDigits]; n[i] = val
    set('pinDigits', n)
    set('pin', n.join(''))
    if (val && i < 3) pinRefs.current[i + 1]?.focus()
  }
  const handlePinKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !form.pinDigits[i] && i > 0) pinRefs.current[i - 1]?.focus()
  }

  const handleLogo = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoUploadErr('')
    // Show local preview immediately
    const reader = new FileReader()
    reader.onload = ev => set('logoPreview', ev.target?.result as string)
    reader.readAsDataURL(file)
    // Upload to R2
    setLogoUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'logos')
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Upload failed')
      set('logoPreview', data.url)
    } catch (err: any) {
      setLogoUploadErr(err.message ?? 'Upload failed — logo will be saved as preview only')
    } finally {
      setLogoUploading(false)
    }
  }

  const goNext = async () => {
    setError('')

    // ── Step 1: send OTP ──────────────────────────────────
    if (step === 1) {
      if (!form.email) { setError('Please enter your email address.'); return }
      if (!form.password || form.password.length < 8) { setError('Password must be at least 8 characters.'); return }
      if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return }
      if (form.pin.length < 4) { setError('Please set your 4-digit PIN.'); return }

      setLoading(true)
      try {
        const res = await fetch('/api/auth/send-otp', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ email: form.email }),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error ?? 'Failed to send code. Try again.'); setLoading(false); return }
        if (data.dev) setError('No email key set — check your terminal for the OTP code.')
      } catch {
        setError('Network error. Please try again.')
        setLoading(false)
        return
      }
      setLoading(false)
      setDir(1)
      setStep(2)
      return
    }

    // ── Step 2: verify OTP ────────────────────────────────
    if (step === 2) {
      const code = otp.join('')
      if (code.length < 6) { setError('Please enter the full 6-digit code.'); return }

      setLoading(true)
      try {
        const res = await fetch('/api/auth/verify-otp', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ email: form.email, code }),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error ?? 'Incorrect code.'); setLoading(false); return }
      } catch {
        setError('Network error. Please try again.')
        setLoading(false)
        return
      }
      setLoading(false)
      setDir(1)
      setStep(3)
      return
    }

    // ── Step 7: deploy ────────────────────────────────────
    if (step === 7) {
      if (!form.plan) { setError('Please select a plan.'); return }

      // Pass ALL form data to the deploy page via sessionStorage (avoids 431)
      sessionStorage.setItem('tera_deploy', JSON.stringify({
        // Visual (for deploy animation)
        name:         form.schoolName,
        subdomain:    form.subdomain,
        color:        form.primaryColor,
        logo:         form.logoPreview,
        // Admin credentials
        firstName:    form.firstName,
        lastName:     form.lastName,
        email:        form.email,
        password:     form.password,
        pin:          form.pin,
        // School identity
        schoolName:         form.schoolName,
        shortName:          form.shortName,
        institutionType:    form.institutionType,
        yearEstablished:    form.yearEstablished,
        registrationNumber: form.registrationNumber,
        accreditationBody:  form.accreditationBody,
        motto:              form.motto,
        description:        form.description,
        studentCount:       form.studentCount,
        staffCount:         form.staffCount,
        // Location
        country:     form.country,
        state:       form.state,
        city:        form.city,
        address:     form.address,
        postalCode:  form.postalCode,
        phone:       form.phone,
        schoolEmail: form.schoolEmail,
        website:     form.website,
        // Academic
        academicCalendar: form.academicCalendar,
        gradingSystem:    form.gradingSystem,
        language:         form.language,
        timezone:         form.timezone,
        currency:         form.currency,
        // Branding
        primaryColor: form.primaryColor,
        accentColor:  form.accentColor,
        logoUrl:      form.logoPreview,
        // Plan
        plan:    form.plan.toUpperCase(),
        billing: form.billing,
      }))
      router.push('/deploy')
      return
    }

    setDir(1)
    setStep(s => s + 1)
  }
  const goBack = () => { setError(''); setDir(-1); setStep(s => s - 1) }

  /* ── Step content ─────────────────────────────────── */
  const step1 = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="First name" required>
          <Input placeholder="John" value={form.firstName} onChange={e => set('firstName', e.target.value)} />
        </Field>
        <Field label="Last name" required>
          <Input placeholder="Doe" value={form.lastName} onChange={e => set('lastName', e.target.value)} />
        </Field>
      </div>
      <Field label="Work email" required>
        <Input type="email" placeholder="you@school.edu" value={form.email} onChange={e => set('email', e.target.value)} />
      </Field>
      <Field label="Password" required>
        <div className="relative">
          <Input
            type={showPwd ? 'text' : 'password'}
            placeholder="Min. 8 characters"
            value={form.password}
            onChange={e => set('password', e.target.value)}
            className="pr-10"
          />
          <button type="button" onClick={() => setShowPwd(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </Field>
      <Field label="Confirm password" required>
        <Input type="password" placeholder="Repeat password"
          value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} />
      </Field>

      <div className="pt-3 border-t border-gray-100">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Set up your 4-digit PIN</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
              Used to confirm sensitive actions — approving payments, releasing results, authorising changes.
            </p>
          </div>
        </div>
        <div className="flex gap-3 justify-center">
          {form.pinDigits.map((d, i) => (
            <input
              key={i}
              ref={el => { pinRefs.current[i] = el }}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={e => handlePin(i, e.target.value)}
              onKeyDown={e => handlePinKey(i, e)}
              className="w-14 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all bg-white"
            />
          ))}
        </div>
        {form.pinDigits.every(d => d) && (
          <motion.p
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            className="text-xs text-emerald-600 text-center mt-2 flex items-center justify-center gap-1"
          >
            <Check className="w-3 h-3" /> PIN set
          </motion.p>
        )}
      </div>

      <p className="text-xs text-gray-500 text-center pt-1">
        By continuing, you agree to our{' '}
        <Link href="/terms" className="text-blue-600 hover:underline">Terms</Link> and{' '}
        <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
      </p>
    </div>
  )

  const step2 = (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Mail className="w-7 h-7 text-blue-600" />
        </div>
        <p className="text-sm text-gray-600 max-w-xs mx-auto leading-relaxed">
          We sent a 6-digit code to{' '}
          <span className="font-semibold text-gray-900">{form.email || 'your email'}</span>.
          Check your inbox.
        </p>
      </div>
      <div className="flex gap-2 justify-center">
        {otp.map((d, i) => (
          <input
            key={i}
            ref={el => { otpRefs.current[i] = el }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={e => handleOtp(i, e.target.value)}
            onKeyDown={e => handleOtpKey(i, e)}
            className="w-12 h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all bg-white"
          />
        ))}
      </div>
      <p className="text-center text-sm text-gray-500">
        Didn&apos;t receive it?{' '}
        <button className="text-blue-600 hover:underline font-medium">Resend code</button>
      </p>
    </div>
  )

  const step3 = (
    <div className="space-y-4">
      <Field label="Legal school name" required>
        <Input placeholder="e.g. Green Hills Academy"
          value={form.schoolName} onChange={e => set('schoolName', e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Short name / abbreviation">
          <Input placeholder="e.g. GHA"
            value={form.shortName} onChange={e => set('shortName', e.target.value)} />
        </Field>
        <Field label="Year established">
          <Input type="number" placeholder="e.g. 1995" min={1800} max={new Date().getFullYear()}
            value={form.yearEstablished} onChange={e => set('yearEstablished', e.target.value)} />
        </Field>
      </div>
      <Field label="Institution type" required>
        <Select value={form.institutionType} onChange={e => set('institutionType', e.target.value)}>
          <option value="">Select type...</option>
          {INSTITUTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Registration / licence number">
          <Input placeholder="Govt. reg. number"
            value={form.registrationNumber} onChange={e => set('registrationNumber', e.target.value)} />
        </Field>
        <Field label="Accreditation body">
          <Input placeholder="e.g. NUC, WAEC Board"
            value={form.accreditationBody} onChange={e => set('accreditationBody', e.target.value)} />
        </Field>
      </div>
      <Field label="School motto">
        <Input placeholder="e.g. Knowledge, Character, Service"
          value={form.motto} onChange={e => set('motto', e.target.value)} />
      </Field>
      <Field label="About your school">
        <Textarea rows={3} placeholder="Brief description of your institution..."
          value={form.description} onChange={e => set('description', e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Approx. student count">
          <Select value={form.studentCount} onChange={e => set('studentCount', e.target.value)}>
            <option value="">Select range...</option>
            {STUDENT_COUNTS.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
        </Field>
        <Field label="Approx. staff count">
          <Select value={form.staffCount} onChange={e => set('staffCount', e.target.value)}>
            <option value="">Select range...</option>
            {STAFF_COUNTS.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
        </Field>
      </div>
    </div>
  )

  const step4 = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Country" required>
          <Select value={form.country} onChange={e => set('country', e.target.value)}>
            <option value="">Select country...</option>
            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
        </Field>
        <Field label="State / Province">
          <Input placeholder="e.g. Greater Accra"
            value={form.state} onChange={e => set('state', e.target.value)} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="City" required>
          <Input placeholder="e.g. Accra"
            value={form.city} onChange={e => set('city', e.target.value)} />
        </Field>
        <Field label="Postal code">
          <Input placeholder="e.g. 00233"
            value={form.postalCode} onChange={e => set('postalCode', e.target.value)} />
        </Field>
      </div>
      <Field label="Street address" required>
        <Input placeholder="Building number, street name"
          value={form.address} onChange={e => set('address', e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="School phone" required>
          <Input type="tel" placeholder="+233 XX XXX XXXX"
            value={form.phone} onChange={e => set('phone', e.target.value)} />
        </Field>
        <Field label="Official school email">
          <Input type="email" placeholder="info@school.edu"
            value={form.schoolEmail} onChange={e => set('schoolEmail', e.target.value)} />
        </Field>
      </div>
      <Field label="School website">
        <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10 bg-white">
          <span className="pl-3.5 text-sm text-gray-400 select-none">https://</span>
          <input
            placeholder="yourschool.edu"
            value={form.website}
            onChange={e => set('website', e.target.value)}
            className="flex-1 h-11 pr-3.5 pl-1 text-sm outline-none bg-transparent"
          />
        </div>
      </Field>
    </div>
  )

  const step5 = (
    <div className="space-y-4">
      <Field label="Academic calendar structure" required>
        <div className="space-y-2">
          {ACADEMIC_CALS.map(cal => (
            <label key={cal} className={cn(
              'flex items-center gap-3 px-4 py-3 border rounded-xl cursor-pointer transition-all',
              form.academicCalendar === cal ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300',
            )}>
              <input type="radio" name="academicCalendar" value={cal}
                checked={form.academicCalendar === cal}
                onChange={() => set('academicCalendar', cal)}
                className="accent-blue-600" />
              <span className="text-sm font-medium text-gray-800">{cal}</span>
            </label>
          ))}
        </div>
      </Field>
      <Field label="Grading system" required>
        <Select value={form.gradingSystem} onChange={e => set('gradingSystem', e.target.value)}>
          <option value="">Select grading system...</option>
          {GRADING.map(g => <option key={g} value={g}>{g}</option>)}
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Language of instruction">
          <Select value={form.language} onChange={e => set('language', e.target.value)}>
            {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
          </Select>
        </Field>
        <Field label="Default currency">
          <Select value={form.currency} onChange={e => set('currency', e.target.value)}>
            {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
          </Select>
        </Field>
      </div>
      <Field label="Time zone">
        <Select value={form.timezone} onChange={e => set('timezone', e.target.value)}>
          {TIMEZONES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </Select>
      </Field>
    </div>
  )

  const step6 = (
    <div className="space-y-5">
      <Field label="School logo" required>
        <label className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-2xl transition-all group ${logoUploading ? 'border-blue-300 bg-blue-50/30 cursor-wait' : 'border-gray-200 cursor-pointer hover:border-blue-400 hover:bg-blue-50/20'}`}>
          {logoUploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-blue-600 font-medium">Uploading…</span>
            </div>
          ) : form.logoPreview ? (
            <div className="flex flex-col items-center gap-2">
              <img src={form.logoPreview} alt="Logo" className="max-h-20 max-w-[180px] object-contain" />
              <span className="text-xs text-gray-400">Click to change</span>
            </div>
          ) : (
            <>
              <Upload className="w-8 h-8 text-gray-300 group-hover:text-blue-400 transition-colors mb-2" />
              <span className="text-sm font-medium text-gray-600">Upload your logo</span>
              <span className="text-xs text-gray-400 mt-0.5">PNG, SVG, JPG — max 5 MB</span>
            </>
          )}
          <input type="file" accept="image/*" className="hidden" disabled={logoUploading} onChange={handleLogo} />
        </label>
        {logoUploadErr && <p className="text-xs text-amber-600 mt-1.5">{logoUploadErr}</p>}
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Primary colour">
          <div className="flex items-center gap-2">
            <input type="color" value={form.primaryColor}
              onChange={e => set('primaryColor', e.target.value)}
              className="w-11 h-11 rounded-xl border border-gray-200 cursor-pointer p-1" />
            <Input value={form.primaryColor} onChange={e => set('primaryColor', e.target.value)} placeholder="#2563EB" />
          </div>
        </Field>
        <Field label="Accent colour">
          <div className="flex items-center gap-2">
            <input type="color" value={form.accentColor}
              onChange={e => set('accentColor', e.target.value)}
              className="w-11 h-11 rounded-xl border border-gray-200 cursor-pointer p-1" />
            <Input value={form.accentColor} onChange={e => set('accentColor', e.target.value)} placeholder="#7C3AED" />
          </div>
        </Field>
      </div>

      <div className="rounded-2xl p-4 flex items-center gap-3 border"
        style={{ backgroundColor: form.primaryColor + '12', borderColor: form.primaryColor + '35' }}>
        {form.logoPreview ? (
          <img src={form.logoPreview} alt="logo" className="w-10 h-10 object-contain rounded-xl" />
        ) : (
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
            style={{ backgroundColor: form.primaryColor }}>
            {(form.shortName || form.schoolName).slice(0, 2).toUpperCase() || 'SM'}
          </div>
        )}
        <div>
          <p className="text-sm font-semibold text-gray-900">{form.schoolName || 'Your School Name'}</p>
          <p className="text-xs font-medium" style={{ color: form.primaryColor }}>School Management Portal</p>
        </div>
      </div>

      <Field label="Your school URL">
        <div>
          <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10 bg-white">
            <input type="text" value={form.subdomain}
              onChange={e => checkSubdomain(e.target.value)}
              placeholder="schoolname"
              className="flex-1 h-11 pl-3.5 text-sm outline-none" />
            <span className="pr-3.5 text-sm text-gray-400 font-medium whitespace-nowrap">.terasms.com</span>
          </div>
          <div className="mt-1.5 h-4 flex items-center">
            {form.subdomainStatus === 'checking' && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Checking availability...
              </span>
            )}
            {form.subdomainStatus === 'available' && (
              <span className="text-xs text-emerald-600 flex items-center gap-1">
                <Check className="w-3 h-3" /> {form.subdomain}.terasms.com is available
              </span>
            )}
            {form.subdomainStatus === 'taken' && (
              <span className="text-xs text-red-500 flex items-center gap-1">
                <X className="w-3 h-3" /> That name is taken. Try another.
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">Custom domain available on Pro+ plans. You can change this later.</p>
        </div>
      </Field>
    </div>
  )

  const step7 = (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-3">
        <span className={cn('text-sm font-medium', form.billing === 'monthly' ? 'text-gray-900' : 'text-gray-400')}>Monthly</span>
        <button
          onClick={() => set('billing', form.billing === 'monthly' ? 'annual' : 'monthly')}
          className={cn('relative w-11 h-6 rounded-full transition-colors', form.billing === 'annual' ? 'bg-blue-600' : 'bg-gray-200')}
        >
          <span className={cn('absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform', form.billing === 'annual' ? 'translate-x-5' : 'translate-x-0')} />
        </button>
        <span className={cn('text-sm font-medium', form.billing === 'annual' ? 'text-gray-900' : 'text-gray-400')}>
          Annual <span className="text-emerald-600 text-xs font-semibold">Save 15%</span>
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {PLANS.map(plan => (
          <button key={plan.id} onClick={() => set('plan', plan.id)}
            className={cn(
              'relative text-left p-4 rounded-2xl border-2 transition-all',
              form.plan === plan.id ? 'border-blue-600 bg-blue-50' : 'border-gray-100 hover:border-gray-200 bg-white',
            )}>
            {form.plan === plan.id && (
              <div className="absolute top-2.5 right-2.5 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
            {'badge' in plan && plan.badge && (
              <span className={cn('inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-2',
                plan.id === 'pro' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600')}>
                {plan.badge}
              </span>
            )}
            <p className="font-bold text-gray-900 text-sm">{plan.name}</p>
            <p className="text-xs text-gray-500 mb-2">{plan.cap}</p>
            {plan.monthly === 0
              ? <p className="text-base font-bold text-gray-900">Custom</p>
              : <p className="text-base font-bold text-gray-900">
                  ${form.billing === 'annual' ? plan.annual : plan.monthly}
                  <span className="text-xs font-normal text-gray-400">/mo</span>
                </p>
            }
            <ul className="mt-2.5 space-y-1">
              {plan.features.map(f => (
                <li key={f} className="flex items-center gap-1.5 text-xs text-gray-600">
                  <Check className="w-3 h-3 text-emerald-500 flex-shrink-0" />{f}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
        <p className="text-xs text-emerald-700 font-medium">14-day free trial on Starter & Pro. No credit card required.</p>
      </div>
    </div>
  )

  const stepContent = [step1, step2, step3, step4, step5, step6, step7]

  /* ─── Render ──────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* Left sidebar */}
      <aside className="hidden lg:flex w-72 bg-white border-r border-gray-100 flex-col p-8 flex-shrink-0">
        <Link href="/" className="flex items-center gap-2 mb-10">
          <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <span className="font-bold text-gray-900 text-lg">Tera SM</span>
        </Link>

        <nav className="flex-1 space-y-1">
          {STEPS.map(s => {
            const Icon = s.icon
            const done   = step > s.id
            const active = step === s.id
            return (
              <div key={s.id} className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl', active && 'bg-blue-50')}>
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all',
                  done ? 'bg-emerald-500' : active ? 'bg-blue-600' : 'bg-gray-100')}>
                  {done
                    ? <Check className="w-4 h-4 text-white" />
                    : <Icon className={cn('w-4 h-4', active ? 'text-white' : 'text-gray-400')} />
                  }
                </div>
                <div>
                  <p className={cn('text-sm font-medium', active ? 'text-blue-700' : done ? 'text-gray-600' : 'text-gray-400')}>
                    {s.title}
                  </p>
                  <p className={cn('text-xs', active ? 'text-blue-500' : 'text-gray-400')}>{s.desc}</p>
                </div>
              </div>
            )
          })}
        </nav>

        <div className="pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen">
        <div className="lg:hidden flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">T</span>
            </div>
            <span className="font-bold text-gray-900">Tera SM</span>
          </Link>
          <span className="text-sm text-gray-500 font-medium">Step {step} of {STEPS.length}</span>
        </div>

        <div className="flex-1 flex items-start justify-center py-10 px-6">
          <div className="w-full max-w-lg">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-gray-500">Step {step} of {STEPS.length}</span>
                <span className="text-xs text-gray-400">{Math.round((step / STEPS.length) * 100)}% complete</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-1.5 bg-blue-600 rounded-full"
                  animate={{ width: `${(step / STEPS.length) * 100}%` }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7 overflow-hidden">
              <AnimatePresence mode="wait" custom={dir}>
                <motion.div key={step} custom={dir} variants={slide}
                  initial="enter" animate="center" exit="exit"
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}>
                  <div className="mb-6">
                    <h1 className="text-xl font-bold text-gray-900">{STEPS[step - 1].title}</h1>
                    <p className="text-sm text-gray-500 mt-0.5">{STEPS[step - 1].desc}</p>
                  </div>
                  {stepContent[step - 1]}
                </motion.div>
              </AnimatePresence>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  className="mt-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 flex items-start gap-2"
                >
                  <span className="flex-shrink-0 mt-0.5">⚠</span>
                  <span>{error}</span>
                </motion.div>
              )}

              <div className="flex items-center justify-between mt-7 pt-5 border-t border-gray-50">
                {step > 1 ? (
                  <button onClick={goBack}
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 font-medium transition-colors">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                ) : <div />}
                <button onClick={goNext} disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-all">
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {step === 7 ? 'Deploy school' : step === 1 ? 'Send verification code' : 'Continue'}
                  {!loading && <ChevronRight className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
