'use client'

import { useState } from 'react'
import { Calculator, TrendingUp } from 'lucide-react'

type Course = {
  id: string
  code: string
  title: string
  creditHours: number
  gradePoint: number | null
  totalScore: number | null
}

function scoreToGradePoint(score: number): number {
  if (score >= 80) return 4.0
  if (score >= 75) return 3.7
  if (score >= 70) return 3.3
  if (score >= 65) return 3.0
  if (score >= 60) return 2.7
  if (score >= 55) return 2.3
  if (score >= 50) return 2.0
  if (score >= 45) return 1.7
  if (score >= 40) return 1.0
  return 0.0
}

function gradeLabel(gp: number): string {
  if (gp >= 4.0) return 'A'
  if (gp >= 3.7) return 'A-'
  if (gp >= 3.3) return 'B+'
  if (gp >= 3.0) return 'B'
  if (gp >= 2.7) return 'B-'
  if (gp >= 2.3) return 'C+'
  if (gp >= 2.0) return 'C'
  if (gp >= 1.7) return 'C-'
  if (gp >= 1.0) return 'D'
  return 'F'
}

function gpaColor(gpa: number): string {
  if (gpa >= 3.5) return 'text-blue-600'
  if (gpa >= 3.0) return 'text-blue-500'
  if (gpa >= 2.0) return 'text-yellow-600'
  return 'text-red-500'
}

export function WhatIfCalculator({ courses, currentGpa }: { courses: Course[]; currentGpa: number | null }) {
  const [open, setOpen] = useState(false)
  const [scores, setScores] = useState<Record<string, string>>({})

  // Compute projected GPA
  const projected = (() => {
    let totalPoints = 0
    let totalCredits = 0
    for (const c of courses) {
      const override = scores[c.id]
      let gp: number | null = null
      if (override !== undefined && override !== '') {
        const s = parseFloat(override)
        if (!isNaN(s) && s >= 0 && s <= 100) gp = scoreToGradePoint(s)
      } else if (c.gradePoint !== null) {
        gp = c.gradePoint
      }
      if (gp !== null) {
        totalPoints += gp * c.creditHours
        totalCredits += c.creditHours
      }
    }
    return totalCredits > 0 ? totalPoints / totalCredits : null
  })()

  const diff = projected !== null && currentGpa !== null ? projected - currentGpa : null

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-semibold rounded-xl transition-colors border border-blue-100"
      >
        <Calculator className="w-4 h-4" />
        What-if GPA Calculator
      </button>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-blue-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-blue-50 border-b border-blue-100">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-blue-600" />
          <span className="font-semibold text-blue-900 text-sm">What-if GPA Calculator</span>
        </div>
        <button onClick={() => setOpen(false)} className="text-xs text-blue-400 hover:text-blue-600">Close</button>
      </div>

      <div className="p-5">
        <p className="text-xs text-gray-500 mb-4">
          Enter hypothetical scores to see how they would affect your GPA. Leave blank to use your actual grade.
        </p>

        {/* Course inputs */}
        <div className="space-y-2 mb-5">
          {courses.map(c => {
            const override = scores[c.id] ?? ''
            const previewGp = override !== '' && !isNaN(parseFloat(override))
              ? scoreToGradePoint(parseFloat(override))
              : c.gradePoint
            return (
              <div key={c.id} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-blue-600 mr-1.5">{c.code}</span>
                  <span className="text-xs text-gray-600 truncate">{c.title}</span>
                  <span className="text-xs text-gray-400 ml-1">({c.creditHours} cr)</span>
                </div>
                <input
                  type="number"
                  min={0}
                  max={100}
                  placeholder={c.totalScore !== null ? String(c.totalScore) : 'Score'}
                  value={override}
                  onChange={e => setScores(s => ({ ...s, [c.id]: e.target.value }))}
                  className="w-20 px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {previewGp !== null && (
                  <span className="w-10 text-center text-xs font-bold text-blue-700 bg-blue-50 rounded-lg py-1">
                    {gradeLabel(previewGp)}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {/* Result */}
        {projected !== null && (
          <div className="bg-blue-600 rounded-2xl px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-blue-200 text-xs font-medium mb-0.5">Projected GPA</p>
              <p className={`text-3xl font-bold text-white`}>{projected.toFixed(2)}</p>
            </div>
            {diff !== null && (
              <div className="text-right">
                <TrendingUp className="w-5 h-5 text-blue-300 ml-auto mb-1" />
                <p className={`text-sm font-bold ${diff >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                  {diff >= 0 ? '+' : ''}{diff.toFixed(2)}
                </p>
                <p className="text-blue-300 text-xs">vs current</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
