'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { SchoolProfileSchema, type SchoolProfileDto } from '@tera-sm/types'
import { cn } from '@tera-sm/utils'
import { Building2, ChevronRight } from 'lucide-react'

const INSTITUTION_TYPES = [
  { value: 'PRIMARY', label: 'Primary School' },
  { value: 'SECONDARY', label: 'Secondary School' },
  { value: 'COLLEGE', label: 'College' },
  { value: 'POLYTECHNIC', label: 'Polytechnic' },
  { value: 'UNIVERSITY', label: 'University' },
  { value: 'VOCATIONAL', label: 'Vocational / Training' },
]

const TIMEZONES = [
  'Africa/Lagos', 'Africa/Accra', 'Africa/Nairobi', 'Africa/Johannesburg',
  'Africa/Cairo', 'Europe/London', 'America/New_York', 'America/Los_Angeles',
  'Asia/Dubai', 'UTC',
]

interface Props {
  onNext: (data: SchoolProfileDto) => void
}

export function StepSchoolProfile({ onNext }: Props) {
  const form = useForm<SchoolProfileDto>({
    resolver: zodResolver(SchoolProfileSchema),
    defaultValues: { tagline: '', address: '', phone: '', website: '', institutionType: 'SECONDARY', timezone: 'UTC' },
  })

  return (
    <div className="rounded-2xl border bg-white p-8 shadow-sm space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
          <Building2 className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold">School Profile</h2>
          <p className="text-sm text-gray-400">Tell us more about your institution</p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onNext)} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Institution Type <span className="text-red-500">*</span></label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {INSTITUTION_TYPES.map((t) => (
              <label
                key={t.value}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm transition-all',
                  form.watch('institutionType') === t.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500'
                    : 'hover:border-blue-200'
                )}
              >
                <input type="radio" {...form.register('institutionType')} value={t.value} className="sr-only" />
                {t.label}
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Tagline / Motto <span className="text-gray-400 text-xs">(optional)</span></label>
          <input
            {...form.register('tagline')}
            placeholder="e.g. Excellence in Education"
            className={field()}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Phone <span className="text-gray-400 text-xs">(optional)</span></label>
            <input {...form.register('phone')} placeholder="+234 800 000 0000" className={field()} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Website <span className="text-gray-400 text-xs">(optional)</span></label>
            <input {...form.register('website')} placeholder="https://yourschool.edu" className={field(!!form.formState.errors.website)} />
            {form.formState.errors.website && (
              <p className="text-xs text-red-500">{form.formState.errors.website.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Address <span className="text-gray-400 text-xs">(optional)</span></label>
          <textarea
            {...form.register('address')}
            placeholder="123 School Road, City, State"
            rows={2}
            className={cn(field(), 'resize-none')}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Timezone</label>
          <select {...form.register('timezone')} className={field()}>
            {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
          </select>
        </div>

        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          Continue <ChevronRight className="h-4 w-4" />
        </button>
      </form>
    </div>
  )
}

function field(hasError = false) {
  return cn(
    'w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition',
    'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
    hasError && 'border-red-400'
  )
}
