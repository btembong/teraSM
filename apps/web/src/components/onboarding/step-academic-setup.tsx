'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AcademicSetupSchema, type AcademicSetupDto } from '@tera-sm/types'
import { cn } from '@tera-sm/utils'
import { GraduationCap, ChevronRight, ChevronLeft } from 'lucide-react'

interface Props {
  onNext: (data: AcademicSetupDto) => void
  onBack: () => void
}

const currentYear = new Date().getFullYear()
const ACADEMIC_YEARS = [
  `${currentYear - 1}/${currentYear}`,
  `${currentYear}/${currentYear + 1}`,
  `${currentYear + 1}/${currentYear + 2}`,
]

export function StepAcademicSetup({ onNext, onBack }: Props) {
  const form = useForm<AcademicSetupDto>({
    resolver: zodResolver(AcademicSetupSchema),
    defaultValues: {
      academicYear: ACADEMIC_YEARS[1],
      termType: 'SEMESTER',
      currentTerm: 'FIRST',
      gradingScale: 'PERCENTAGE',
      passMark: 50,
    },
  })

  const termType = form.watch('termType')

  const termLabels: Record<string, string[]> = {
    SEMESTER: ['First Semester', 'Second Semester'],
    TRIMESTER: ['First Trimester', 'Second Trimester', 'Third Trimester'],
    TERM: ['First Term', 'Second Term', 'Third Term'],
  }

  return (
    <div className="rounded-2xl border bg-white p-8 shadow-sm space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Academic Setup</h2>
          <p className="text-sm text-gray-400">Configure your academic calendar and grading</p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onNext)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Academic Year</label>
            <select {...form.register('academicYear')} className={field()}>
              {ACADEMIC_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Pass Mark (%)</label>
            <input
              {...form.register('passMark', { valueAsNumber: true })}
              type="number"
              min={0}
              max={100}
              className={field()}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Term Structure</label>
          <div className="grid grid-cols-3 gap-2">
            {(['SEMESTER', 'TRIMESTER', 'TERM'] as const).map((t) => (
              <label
                key={t}
                className={cn(
                  'flex cursor-pointer flex-col items-center rounded-xl border p-3 text-sm transition-all',
                  termType === t
                    ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500'
                    : 'hover:border-blue-200'
                )}
              >
                <input type="radio" {...form.register('termType')} value={t} className="sr-only" />
                <span className="font-medium">{t.charAt(0) + t.slice(1).toLowerCase()}</span>
                <span className="text-xs text-gray-400 mt-0.5">
                  {t === 'SEMESTER' ? '2 periods' : '3 periods'}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Current {termType.charAt(0) + termType.slice(1).toLowerCase()}</label>
          <div className="flex gap-2">
            {(['FIRST', 'SECOND', 'THIRD'] as const)
              .slice(0, termLabels[termType]?.length ?? 2)
              .map((term, i) => (
                <label
                  key={term}
                  className={cn(
                    'flex-1 cursor-pointer rounded-xl border p-2.5 text-center text-sm transition-all',
                    form.watch('currentTerm') === term
                      ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500'
                      : 'hover:border-blue-200'
                  )}
                >
                  <input type="radio" {...form.register('currentTerm')} value={term} className="sr-only" />
                  {termLabels[termType]?.[i]}
                </label>
              ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Grading Scale</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'PERCENTAGE', label: 'Percentage', desc: '0 – 100%' },
              { value: 'GPA_4', label: 'GPA 4.0', desc: 'US system' },
              { value: 'GPA_5', label: 'GPA 5.0', desc: 'Nigerian system' },
              { value: 'LETTER', label: 'Letter Grade', desc: 'A, B, C, D, F' },
            ].map((g) => (
              <label
                key={g.value}
                className={cn(
                  'flex cursor-pointer flex-col rounded-xl border p-3 transition-all',
                  form.watch('gradingScale') === g.value
                    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                    : 'hover:border-blue-200'
                )}
              >
                <input type="radio" {...form.register('gradingScale')} value={g.value} className="sr-only" />
                <span className="text-sm font-semibold">{g.label}</span>
                <span className="text-xs text-gray-400">{g.desc}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          <button
            type="submit"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Continue <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  )
}

function field() {
  return 'w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
}
