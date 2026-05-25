'use client'

import { useRef, useState } from 'react'
import { Upload, X, Check } from 'lucide-react'

export default function CsvImportButton({ offeringId }: { offeringId: string }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<{ updated: number; skipped: number } | null>(null)

  async function handleFile(file: File) {
    setStatus('uploading')
    const text = await file.text()
    const res = await fetch(`/api/staff/grades-import?courseOfferingId=${offeringId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/csv' },
      body: text,
    })
    if (res.ok) {
      const data = await res.json()
      setResult(data)
      setStatus('done')
    } else {
      setStatus('error')
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <button
        onClick={() => { setStatus('idle'); setResult(null); fileRef.current?.click() }}
        disabled={status === 'uploading'}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
      >
        <Upload className="w-3.5 h-3.5" />
        {status === 'uploading' ? 'Importing…' : 'Import CSV'}
      </button>
      {status === 'done' && result && (
        <span className="text-xs text-green-600 flex items-center gap-1">
          <Check className="w-3.5 h-3.5" /> {result.updated} updated, {result.skipped} skipped
        </span>
      )}
      {status === 'error' && (
        <span className="text-xs text-red-500 flex items-center gap-1">
          <X className="w-3.5 h-3.5" /> Import failed
        </span>
      )}
    </div>
  )
}
