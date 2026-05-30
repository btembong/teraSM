import {
  Document, Page, Text, View, StyleSheet, Font, Image,
} from '@react-pdf/renderer'

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 48,
    paddingBottom: 60,
    paddingHorizontal: 52,
    color: '#1a1a2e',
    backgroundColor: '#ffffff',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 28,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#2563EB',
  },
  schoolLogo: { width: 56, height: 56, objectFit: 'contain' },
  logoPlaceholder: {
    width: 56, height: 56,
    backgroundColor: '#2563EB',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoPlaceholderText: { color: '#fff', fontSize: 20, fontFamily: 'Helvetica-Bold' },
  schoolInfo: { flex: 1, marginLeft: 14 },
  schoolName: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#1e3a8a' },
  schoolMeta: { fontSize: 8.5, color: '#64748b', marginTop: 2, lineHeight: 1.5 },
  referenceBox: { alignItems: 'flex-end' },
  referenceLabel: { fontSize: 7.5, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8 },
  referenceValue: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: '#1e3a8a', marginTop: 2 },
  dateText: { fontSize: 8.5, color: '#64748b', marginTop: 4 },

  // Confidential stamp
  confidentialBadge: {
    alignSelf: 'flex-end',
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 16,
  },
  confidentialText: { fontSize: 7.5, color: '#92400e', fontFamily: 'Helvetica-Bold', letterSpacing: 0.5 },

  // Title
  offerTitle: {
    fontSize: 17,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a8a',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  titleUnderline: {
    width: 60,
    height: 2.5,
    backgroundColor: '#2563EB',
    alignSelf: 'center',
    marginBottom: 22,
    borderRadius: 2,
  },

  // Recipient
  recipientSection: {
    backgroundColor: '#f0f7ff',
    borderLeftWidth: 3,
    borderLeftColor: '#2563EB',
    padding: 12,
    marginBottom: 20,
    borderRadius: 2,
  },
  salutation: { fontSize: 10.5, fontFamily: 'Helvetica-Bold', color: '#1e3a8a', marginBottom: 2 },
  recipientMeta: { fontSize: 8.5, color: '#475569', lineHeight: 1.5 },

  // Body text
  bodyParagraph: { fontSize: 10, lineHeight: 1.7, color: '#334155', marginBottom: 10 },
  bold: { fontFamily: 'Helvetica-Bold' },

  // Offer details table
  detailsSection: {
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  detailsHeader: {
    backgroundColor: '#1e3a8a',
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  detailsHeaderText: { color: '#fff', fontSize: 9, fontFamily: 'Helvetica-Bold', letterSpacing: 0.5 },
  detailRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  detailRowAlt: { backgroundColor: '#f8fafc' },
  detailLabel: {
    width: '38%',
    padding: 8,
    fontSize: 9,
    color: '#64748b',
    fontFamily: 'Helvetica-Bold',
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
  },
  detailValue: { flex: 1, padding: 8, fontSize: 9.5, color: '#1e293b' },

  // Conditions
  conditionsSection: { marginBottom: 16 },
  conditionsTitle: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: '#1e3a8a', marginBottom: 6 },
  conditionItem: { flexDirection: 'row', marginBottom: 4 },
  bullet: { width: 14, fontSize: 9, color: '#2563EB' },
  conditionText: { flex: 1, fontSize: 9, color: '#475569', lineHeight: 1.6 },

  // Signature
  signatureSection: {
    marginTop: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  signatureBlock: { alignItems: 'flex-start' },
  signatureLine: { width: 140, height: 1, backgroundColor: '#cbd5e1', marginBottom: 4 },
  signatoryName: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: '#1e293b' },
  signatoryTitle: { fontSize: 8.5, color: '#64748b', marginTop: 1 },
  schoolSeal: { width: 70, height: 70, opacity: 0.15 },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 28,
    left: 52,
    right: 52,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: { fontSize: 7.5, color: '#94a3b8' },
  poweredBy: { fontSize: 7, color: '#cbd5e1' },
})

// ─── Types ───────────────────────────────────────────────────────────────────

export interface OfferLetterData {
  // School
  schoolName:    string
  schoolAddress: string
  schoolEmail:   string
  schoolPhone?:  string
  schoolLogoUrl?: string
  signatoryName:  string
  signatoryTitle: string

  // Applicant
  firstName:      string
  lastName:       string
  email:          string
  address?:       string

  // Offer details
  referenceNumber:   string
  programOfInterest: string
  entryLevel?:       string
  academicYear:      string
  reportingDate?:    string
  offerExpiry?:      string
  conditions?:       string[]
}

// ─── PDF Document ─────────────────────────────────────────────────────────────

export function OfferLetterDocument({ data }: { data: OfferLetterData }) {
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  const defaultConditions = [
    'Payment of the required tuition and acceptance fees by the specified deadline.',
    'Submission of all original academic certificates for verification.',
    'Completion of the student registration and onboarding process.',
    'Compliance with all institutional policies and code of conduct.',
  ]
  const conditions = data.conditions?.length ? data.conditions : defaultConditions

  return (
    <Document
      title={`Offer Letter — ${data.firstName} ${data.lastName}`}
      author={data.schoolName}
      subject="Admission Offer Letter"
      creator="Tera SM"
    >
      <Page size="A4" style={styles.page}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            {data.schoolLogoUrl ? (
              <Image src={data.schoolLogoUrl} style={styles.schoolLogo} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Text style={styles.logoPlaceholderText}>{data.schoolName.charAt(0)}</Text>
              </View>
            )}
            <View style={styles.schoolInfo}>
              <Text style={styles.schoolName}>{data.schoolName}</Text>
              <Text style={styles.schoolMeta}>{data.schoolAddress}</Text>
              {data.schoolPhone && <Text style={styles.schoolMeta}>{data.schoolPhone} · {data.schoolEmail}</Text>}
            </View>
          </View>
          <View style={styles.referenceBox}>
            <Text style={styles.referenceLabel}>Ref No.</Text>
            <Text style={styles.referenceValue}>{data.referenceNumber}</Text>
            <Text style={styles.dateText}>{today}</Text>
          </View>
        </View>

        {/* ── Confidential badge ── */}
        <View style={styles.confidentialBadge}>
          <Text style={styles.confidentialText}>CONFIDENTIAL</Text>
        </View>

        {/* ── Title ── */}
        <Text style={styles.offerTitle}>OFFER OF ADMISSION</Text>
        <View style={styles.titleUnderline} />

        {/* ── Recipient ── */}
        <View style={styles.recipientSection}>
          <Text style={styles.salutation}>{data.firstName} {data.lastName}</Text>
          {data.address && <Text style={styles.recipientMeta}>{data.address}</Text>}
          <Text style={styles.recipientMeta}>{data.email}</Text>
        </View>

        {/* ── Opening paragraph ── */}
        <Text style={styles.bodyParagraph}>
          On behalf of <Text style={styles.bold}>{data.schoolName}</Text>, we are pleased to inform you that following a careful review of your application, the Admissions Committee has approved your admission to the institution. We congratulate you on this achievement and warmly welcome you to our academic community.
        </Text>

        {/* ── Offer details ── */}
        <View style={styles.detailsSection}>
          <View style={styles.detailsHeader}>
            <Text style={styles.detailsHeaderText}>ADMISSION DETAILS</Text>
          </View>
          {[
            ['Programme', data.programOfInterest],
            ['Level of Entry', data.entryLevel ?? 'Undergraduate'],
            ['Academic Year', data.academicYear],
            data.reportingDate ? ['Reporting Date', data.reportingDate] : null,
            data.offerExpiry ? ['Offer Valid Until', data.offerExpiry] : null,
            ['Reference Number', data.referenceNumber],
          ].filter(Boolean).map((row, i) => (
            <View key={i} style={[styles.detailRow, i % 2 === 1 ? styles.detailRowAlt : {}]}>
              <Text style={styles.detailLabel}>{row![0]}</Text>
              <Text style={styles.detailValue}>{row![1]}</Text>
            </View>
          ))}
        </View>

        {/* ── Conditions ── */}
        <View style={styles.conditionsSection}>
          <Text style={styles.conditionsTitle}>CONDITIONS OF OFFER</Text>
          <Text style={[styles.bodyParagraph, { marginBottom: 8 }]}>
            This offer is conditional upon the fulfilment of the following requirements:
          </Text>
          {conditions.map((c, i) => (
            <View key={i} style={styles.conditionItem}>
              <Text style={styles.bullet}>{i + 1}.</Text>
              <Text style={styles.conditionText}>{c}</Text>
            </View>
          ))}
        </View>

        {/* ── Closing paragraph ── */}
        <Text style={styles.bodyParagraph}>
          Please confirm your acceptance of this offer by the date indicated above. Failure to do so may result in the offer being withdrawn. Should you have any questions, do not hesitate to contact the Admissions Office at <Text style={styles.bold}>{data.schoolEmail}</Text>.
        </Text>

        <Text style={styles.bodyParagraph}>
          We look forward to welcoming you and wish you a fulfilling academic journey at <Text style={styles.bold}>{data.schoolName}</Text>.
        </Text>

        {/* ── Signature ── */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatoryName}>{data.signatoryName}</Text>
            <Text style={styles.signatoryTitle}>{data.signatoryTitle}</Text>
            <Text style={styles.signatoryTitle}>{data.schoolName}</Text>
          </View>
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{data.schoolName} · Official Offer Letter · {data.referenceNumber}</Text>
          <Text style={styles.poweredBy}>Powered by Tera SM</Text>
        </View>

      </Page>
    </Document>
  )
}
