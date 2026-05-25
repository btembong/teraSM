/**
 * Grading helpers — score → letterGrade → gradePoint
 * Used by academic grade entry & CGPA recalculation.
 */

export interface GradeBoundary {
  letter: string
  min: number
}

// Standard GP mapping for letter grades (works for both 4.0 and 5.0 scales)
const GRADE_POINTS: Record<string, number> = {
  'A+': 5.0,
  'A':  4.0,
  'B+': 3.5,
  'B':  3.0,
  'C+': 2.5,
  'C':  2.0,
  'D+': 1.5,
  'D':  1.0,
  'E':  0.5,
  'F':  0.0,
}

const DEFAULT_BOUNDARIES: GradeBoundary[] = [
  { letter: 'A+', min: 95 },
  { letter: 'A',  min: 90 },
  { letter: 'B+', min: 85 },
  { letter: 'B',  min: 80 },
  { letter: 'C+', min: 75 },
  { letter: 'C',  min: 70 },
  { letter: 'D',  min: 60 },
  { letter: 'F',  min: 0  },
]

/**
 * Convert a percentage score to a letter grade using the given boundaries.
 * Falls back to default boundaries if none are provided.
 */
export function scoreToLetter(score: number, boundaries?: GradeBoundary[] | null): string {
  const bounds = boundaries?.length ? boundaries : DEFAULT_BOUNDARIES
  // Sort descending by min so we find the highest matching band
  const sorted = [...bounds].sort((a, b) => b.min - a.min)
  for (const b of sorted) {
    if (score >= b.min) return b.letter
  }
  return 'F'
}

/**
 * Get the grade point value for a letter grade.
 */
export function letterToGradePoint(letter: string): number {
  return GRADE_POINTS[letter] ?? 0
}

/**
 * Convert a score directly to a grade point.
 */
export function scoreToGradePoint(score: number, boundaries?: GradeBoundary[] | null): number {
  return letterToGradePoint(scoreToLetter(score, boundaries))
}

/**
 * Is the grade a passing grade? (gradePoint >= 1.0 = D or above)
 */
export function isPassing(gradePoint: number): boolean {
  return gradePoint >= 1.0
}

/**
 * Recalculate CGPA and total earned credits from a list of published grades.
 * Returns { cgpa, totalCredits }
 */
export function calculateCGPA(
  grades: Array<{ gradePoint: number | null; creditHours: number }>
): { cgpa: number; totalCredits: number } {
  const valid = grades.filter(g => g.gradePoint !== null)
  if (valid.length === 0) return { cgpa: 0, totalCredits: 0 }

  let qualityPoints = 0
  let attemptedHours = 0
  let earnedHours = 0

  for (const g of valid) {
    const gp = g.gradePoint!
    qualityPoints  += gp * g.creditHours
    attemptedHours += g.creditHours
    if (isPassing(gp)) earnedHours += g.creditHours
  }

  const cgpa = attemptedHours > 0 ? qualityPoints / attemptedHours : 0
  return {
    cgpa: Math.round(cgpa * 100) / 100,
    totalCredits: earnedHours,
  }
}
