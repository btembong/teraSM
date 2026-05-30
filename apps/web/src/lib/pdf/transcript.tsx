import {
  Document, Page, Text, View, StyleSheet, Image,
} from '@react-pdf/renderer'

// ─── Styles ──────────────────────────────────────────────────────────────────

const BLUE  = '#1e3a8a'
const MID   = '#2563eb'
const LIGHT = '#eff6ff'

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    paddingTop: 44,
    paddingBottom: 56,
    paddingHorizontal: 48,
    color: '#1a1a2e',
    backgroundColor: '#ffffff',
  },

  // Watermark (diagonal text — rendered as absolute positioned view)
  watermarkWrap: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  watermark: {
    fontSize: 72,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a8a',
    opacity: 0.04,
    transform: 'rotate(-35deg)',
    letterSpacing: 6,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 2.5,
    borderBottomColor: MID,
    paddingBottom: 12,
    marginBottom: 16,
  },
  logoPlaceholder: {
    width: 46, height: 46,
    backgroundColor: MID,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoPlaceholderText: { color: '#fff', fontSize: 18, fontFamily: 'Helvetica-Bold' },
  schoolLogo: { width: 46, height: 46, objectFit: 'contain' },
  schoolInfo:  { flex: 1, marginLeft: 10 },
  schoolName:  { fontSize: 14, fontFamily: 'Helvetica-Bold', color: BLUE },
  schoolMeta:  { fontSize: 7.5, color: '#64748b', marginTop: 1.5, lineHeight: 1.4 },
  docTitle:    { alignItems: 'flex-end' },
  docTitleText: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#111' },
  docBadge: {
    backgroundColor: MID, borderRadius: 99,
    paddingHorizontal: 7, paddingVertical: 2, marginTop: 4,
  },
  docBadgeText: { color: '#fff', fontSize: 7, fontFamily: 'Helvetica-Bold', letterSpacing: 0.4 },

  // Student info grid
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#f8fafc',
    borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 5,
    padding: 12,
    marginBottom: 14,
    gap: 6,
  },
  infoCell: { width: '48%' },
  infoLabel: { fontSize: 7, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 1 },
  infoValue: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#1e293b' },

  // Summary bar
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: LIGHT,
    borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 5,
    padding: 10, marginBottom: 14, gap: 20,
  },
  statLabel: { fontSize: 7, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: 0.4 },
  statValue: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: BLUE, marginTop: 1 },

  // Section heading
  sectionHeading: {
    fontSize: 8, fontFamily: 'Helvetica-Bold', color: MID,
    textTransform: 'uppercase', letterSpacing: 0.6,
    marginTop: 14, marginBottom: 6,
  },

  // Table
  table: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 4, overflow: 'hidden' },
  thead: { flexDirection: 'row', backgroundColor: BLUE },
  th: { padding: '6 8', fontSize: 7.5, color: '#fff', fontFamily: 'Helvetica-Bold' },
  tbody: {},
  tr: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  trAlt: { backgroundColor: '#f8fafc' },
  trYear: { backgroundColor: '#e0f2fe' },
  tdYear: { flex: 1, padding: '5 8', fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#0369a1' },
  td: { padding: '5 8', fontSize: 8, color: '#334155' },
  tdGrade: { padding: '5 8', fontSize: 8.5, fontFamily: 'Helvetica-Bold', textAlign: 'center' },
  tdCenter: { padding: '5 8', fontSize: 8, color: '#334155', textAlign: 'center' },
  tdRight: { padding: '5 8', fontSize: 8, color: '#334155', textAlign: 'right' },
  trGpaRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e0f2fe', backgroundColor: '#f0f9ff' },
  tdGpaLabel: { flex: 1, padding: '4 8', fontSize: 7.5, color: '#64748b', textAlign: 'right', fontFamily: 'Helvetica-Bold' },
  tdGpaValue: { width: 48, padding: '4 8', fontSize: 8, fontFamily: 'Helvetica-Bold', color: MID, textAlign: 'center' },

  // Footer area
  footer: {
    position: 'absolute',
    bottom: 32, left: 48, right: 48,
    borderTopWidth: 1, borderTopColor: '#e2e8f0',
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  footerLeft: { flex: 1 },
  sigLine: { width: 130, height: 1, backgroundColor: '#cbd5e1', marginBottom: 4 },
  sigName: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#1e293b' },
  sigTitle: { fontSize: 7.5, color: '#64748b', marginTop: 1 },
  footerMeta: { fontSize: 7, color: '#94a3b8', marginTop: 8 },

  qrWrap: { alignItems: 'center', marginLeft: 16 },
  qrImage: { width: 56, height: 56 },
  qrLabel: { fontSize: 6.5, color: '#94a3b8', marginTop: 3, textAlign: 'center' },
})

// ─── Grade colour ─────────────────────────────────────────────────────────────

function gradeColor(letter: string | null): string {
  const g = letter?.charAt(0) ?? ''
  if (g === 'A') return '#16a34a'
  if (g === 'B') return '#2563eb'
  if (g === 'C') return '#d97706'
  if (g === 'D') return '#ea580c'
  return '#dc2626'
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TranscriptGrade {
  courseCode:   string
  courseTitle:  string
  department:   string
  creditHours:  number
  totalScore:   number | null
  letterGrade:  string | null
  gradePoint:   number | null
  semesterName: string
  yearName:     string
}

export interface TranscriptData {
  // School
  schoolName:    string
  schoolAddress: string
  schoolEmail:   string
  logoUrl?:      string
  signatoryName:  string
  signatoryTitle: string

  // Student
  firstName:   string
  lastName:    string
  email:       string
  studentNo?:  string
  programme?:  string
  level?:      string

  // Meta
  type:             'OFFICIAL' | 'UNOFFICIAL'
  docRef:           string
  issuedAt:         string
  verificationCode?: string
  verifyUrl?:       string

  // Grades
  grades: TranscriptGrade[]
  cgpa:   number
  totalCredits: number

  // QR data URL (for official only)
  qrDataUrl?: string
}

// ─── Document ─────────────────────────────────────────────────────────────────

export function TranscriptDocument({ data }: { data: TranscriptData }) {
  const isOfficial = data.type === 'OFFICIAL'

  // Group grades by year
  const byYear: Record<string, TranscriptGrade[]> = {}
  for (const g of data.grades) {
    if (!byYear[g.yearName]) byYear[g.yearName] = []
    byYear[g.yearName].push(g)
  }

  const colWidths = { code: 52, title: 130, dept: 80, credits: 40, score: 40, grade: 44 }

  return (
    <Document
      title={`${isOfficial ? 'Official' : 'Unofficial'} Transcript — ${data.firstName} ${data.lastName}`}
      author={data.schoolName}
      subject="Academic Transcript"
      creator="Tera SM"
    >
      <Page size="A4" style={s.page}>

        {/* Watermark layer */}
        <View style={s.watermarkWrap} fixed>
          <Text style={s.watermark}>{isOfficial ? 'OFFICIAL' : 'UNOFFICIAL'}</Text>
        </View>

        {/* ── Header ── */}
        <View style={s.header} fixed>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            {data.logoUrl
              ? <Image src={data.logoUrl} style={s.schoolLogo} />
              : <View style={s.logoPlaceholder}><Text style={s.logoPlaceholderText}>{data.schoolName.charAt(0)}</Text></View>
            }
            <View style={s.schoolInfo}>
              <Text style={s.schoolName}>{data.schoolName}</Text>
              {data.schoolAddress && <Text style={s.schoolMeta}>{data.schoolAddress}</Text>}
              <Text style={s.schoolMeta}>{data.schoolEmail}</Text>
            </View>
          </View>
          <View style={s.docTitle}>
            <Text style={s.docTitleText}>Academic Transcript</Text>
            <View style={s.docBadge}>
              <Text style={s.docBadgeText}>{isOfficial ? 'OFFICIAL COPY' : 'UNOFFICIAL — NOT FOR SUBMISSION'}</Text>
            </View>
          </View>
        </View>

        {/* ── Student info ── */}
        <View style={s.infoGrid}>
          {[
            ['Student Name', `${data.firstName} ${data.lastName}`],
            ['Email Address', data.email],
            ['Document Reference', data.docRef],
            ['Date Issued', data.issuedAt],
            ...(data.studentNo  ? [['Student Number', data.studentNo]]  : []),
            ...(data.programme  ? [['Programme',       data.programme]]  : []),
            ...(data.level      ? [['Level',           data.level]]      : []),
          ].map(([label, value]) => (
            <View key={label} style={s.infoCell}>
              <Text style={s.infoLabel}>{label}</Text>
              <Text style={s.infoValue}>{value}</Text>
            </View>
          ))}
        </View>

        {/* ── Summary bar ── */}
        <View style={s.summaryBar}>
          <View>
            <Text style={s.statLabel}>Cumulative GPA</Text>
            <Text style={s.statValue}>{data.cgpa.toFixed(2)}</Text>
          </View>
          <View>
            <Text style={s.statLabel}>Credits Earned</Text>
            <Text style={s.statValue}>{data.totalCredits}</Text>
          </View>
          <View>
            <Text style={s.statLabel}>Courses</Text>
            <Text style={s.statValue}>{data.grades.length}</Text>
          </View>
        </View>

        {/* ── Academic Record ── */}
        <Text style={s.sectionHeading}>Academic Record</Text>

        <View style={s.table}>
          {/* thead */}
          <View style={s.thead}>
            <Text style={[s.th, { width: colWidths.code }]}>Code</Text>
            <Text style={[s.th, { flex: 1 }]}>Course Title</Text>
            <Text style={[s.th, { width: colWidths.dept }]}>Department</Text>
            <Text style={[s.th, { width: colWidths.credits, textAlign: 'center' }]}>Cr.</Text>
            <Text style={[s.th, { width: colWidths.score,   textAlign: 'center' }]}>Score</Text>
            <Text style={[s.th, { width: colWidths.grade,   textAlign: 'center' }]}>Grade</Text>
          </View>

          {/* tbody — grouped by year */}
          {Object.entries(byYear).map(([yearName, yearGrades], yi) => {
            const yPoints  = yearGrades.reduce((sum, g) => sum + (g.gradePoint ?? 0) * g.creditHours, 0)
            const yCredits = yearGrades.reduce((sum, g) => sum + g.creditHours, 0)
            const yGPA     = yCredits > 0 ? (yPoints / yCredits).toFixed(2) : '—'
            return (
              <View key={yearName}>
                {/* Year header row */}
                <View style={s.trYear}>
                  <Text style={s.tdYear}>{yearName}</Text>
                </View>
                {/* Grade rows */}
                {yearGrades.map((g, ri) => (
                  <View key={ri} style={[s.tr, ri % 2 === 1 ? s.trAlt : {}]}>
                    <Text style={[s.td, { width: colWidths.code, fontFamily: 'Helvetica-Bold' }]}>{g.courseCode}</Text>
                    <Text style={[s.td, { flex: 1 }]}>{g.courseTitle}</Text>
                    <Text style={[s.td, { width: colWidths.dept }]}>{g.department}</Text>
                    <Text style={[s.tdCenter, { width: colWidths.credits }]}>{g.creditHours}</Text>
                    <Text style={[s.tdCenter, { width: colWidths.score }]}>{g.totalScore ?? '—'}</Text>
                    <Text style={[s.tdGrade, { width: colWidths.grade, color: gradeColor(g.letterGrade) }]}>
                      {g.letterGrade ?? '—'}{g.gradePoint != null ? ` (${g.gradePoint.toFixed(1)})` : ''}
                    </Text>
                  </View>
                ))}
                {/* Year GPA row */}
                <View style={s.trGpaRow}>
                  <Text style={s.tdGpaLabel}>Year GPA · {yCredits} credits</Text>
                  <Text style={[s.tdGpaValue, { width: colWidths.grade }]}>{yGPA}</Text>
                </View>
              </View>
            )
          })}

          {data.grades.length === 0 && (
            <View style={s.tr}>
              <Text style={[s.td, { flex: 1, textAlign: 'center', color: '#94a3b8', padding: 16 }]}>
                No published grades on record.
              </Text>
            </View>
          )}
        </View>

        {/* ── Footer ── */}
        <View style={s.footer} fixed>
          <View style={s.footerLeft}>
            {isOfficial && (
              <>
                <View style={s.sigLine} />
                <Text style={s.sigName}>{data.signatoryName}</Text>
                <Text style={s.sigTitle}>{data.signatoryTitle}</Text>
              </>
            )}
            <Text style={s.footerMeta}>
              {data.schoolName} · {isOfficial ? 'Official Transcript' : 'Unofficial Transcript'} · {data.docRef}
              {isOfficial && `\nVerify at: ${data.verifyUrl ?? ''}`}
            </Text>
            {!isOfficial && (
              <Text style={[s.footerMeta, { color: '#ef4444', marginTop: 2 }]}>
                UNOFFICIAL — This document is for reference only and is not valid for official submission.
              </Text>
            )}
          </View>

          {/* QR Code (official only) */}
          {isOfficial && data.qrDataUrl && (
            <View style={s.qrWrap}>
              <Image src={data.qrDataUrl} style={s.qrImage} />
              <Text style={s.qrLabel}>Scan to verify</Text>
            </View>
          )}
        </View>

      </Page>
    </Document>
  )
}
