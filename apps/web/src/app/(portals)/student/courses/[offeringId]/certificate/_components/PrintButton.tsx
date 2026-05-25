'use client'

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="w-full py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors print:hidden"
    >
      Print / Save as PDF
    </button>
  )
}
