'use client'

import { useEffect, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Download, GraduationCap, Shield, User } from 'lucide-react'

type CardData = {
  id: string
  firstName: string
  lastName: string
  email: string
  avatarUrl: string | null
  phone: string | null
  tenantName: string
  tenantLogoUrl: string | null
  department: string | null
  program: string | null
  year: number | null
  studentNumber: string
  validUntil: string
}

export default function StudentIdCardPage() {
  const [card, setCard] = useState<CardData | null>(null)
  const [loading, setLoading] = useState(true)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/student/id-card')
      .then(r => r.json())
      .then(data => { setCard(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function handleDownload() {
    if (!cardRef.current) return
    // Open print dialog focused on the card
    window.print()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!card) {
    return (
      <div className="text-center py-20 text-gray-400">
        <GraduationCap className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p>Could not load your student ID.</p>
      </div>
    )
  }

  const qrValue = `https://verify.terasms.com/id/${card.studentNumber}`

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Student ID Card</h1>
        <p className="text-sm text-gray-500 mt-1">Your digital student identification card</p>
      </div>

      {/* Card */}
      <div ref={cardRef} className="print:shadow-none">
        <div
          className="relative rounded-3xl overflow-hidden shadow-2xl"
          style={{
            width: '100%',
            maxWidth: 480,
            background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #2563eb 100%)',
          }}
        >
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
          </div>

          {/* Header bar */}
          <div className="relative flex items-center gap-3 px-6 pt-6 pb-4 border-b border-white/10">
            {card.tenantLogoUrl ? (
              <img src={card.tenantLogoUrl} alt={card.tenantName} className="w-10 h-10 rounded-xl object-contain bg-white/20 p-1.5 flex-shrink-0" />
            ) : (
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
            )}
            <div>
              <p className="text-white font-bold text-sm leading-tight">{card.tenantName}</p>
              <p className="text-blue-200 text-xs">Student Identification Card</p>
            </div>
            <div className="ml-auto flex items-center gap-1 bg-white/10 rounded-full px-2.5 py-1">
              <Shield className="w-3 h-3 text-blue-200" />
              <span className="text-xs text-blue-200 font-medium">Verified</span>
            </div>
          </div>

          {/* Body */}
          <div className="relative flex items-start gap-5 px-6 py-5">
            {/* Photo */}
            <div className="flex-shrink-0">
              {card.avatarUrl ? (
                <img
                  src={card.avatarUrl}
                  alt={card.firstName}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-white/30"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center">
                  <User className="w-9 h-9 text-white/60" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-white text-xl font-bold leading-tight">
                {card.firstName} {card.lastName}
              </p>
              {card.program && (
                <p className="text-blue-200 text-sm mt-0.5">{card.program}</p>
              )}
              {card.department && (
                <p className="text-blue-300 text-xs">{card.department}</p>
              )}

              <div className="mt-3 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-blue-300 text-xs w-24 flex-shrink-0">Student No.</span>
                  <span className="text-white text-xs font-mono font-bold tracking-widest">{card.studentNumber}</span>
                </div>
                {card.year && (
                  <div className="flex items-center gap-2">
                    <span className="text-blue-300 text-xs w-24 flex-shrink-0">Year</span>
                    <span className="text-white text-xs font-medium">Year {card.year}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-blue-300 text-xs w-24 flex-shrink-0">Valid until</span>
                  <span className="text-white text-xs font-medium">{card.validUntil}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer with QR */}
          <div className="relative flex items-center justify-between px-6 pb-6 gap-4">
            <div className="flex-1">
              <p className="text-blue-200 text-xs mb-1.5">Scan to verify authenticity</p>
              <p className="text-blue-300 text-xs font-mono break-all opacity-60">{card.email}</p>
            </div>
            <div className="flex-shrink-0 bg-white rounded-xl p-2">
              <QRCodeSVG
                value={qrValue}
                size={72}
                level="M"
                fgColor="#1e3a8a"
              />
            </div>
          </div>

          {/* Bottom stripe */}
          <div className="h-2 bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-600" />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleDownload}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <Download className="w-4 h-4" />
          Download / Print
        </button>
        <p className="text-xs text-gray-400">
          This card is valid for the current academic year only
        </p>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print\\:shadow-none, .print\\:shadow-none * { visibility: visible; }
          .print\\:shadow-none { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); }
        }
      `}</style>
    </div>
  )
}
