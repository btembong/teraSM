import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Solutions — Tera SM',
  description: 'Tera SM for universities, colleges, secondary schools, and vocational institutes. Tailored for every institution type and role.',
  keywords: [
    'school management for universities', 'college management software', 'secondary school ERP',
    'school software for administrators', 'school software for teachers', 'edtech Africa solutions',
  ],
  openGraph: {
    title: 'Solutions — Tera SM',
    description: 'Purpose-built school management for every institution type — from secondary schools to universities.',
    url: 'https://terasms.com/solutions',
  },
  twitter: {
    title: 'Solutions — Tera SM',
    description: 'Purpose-built school management for every institution type — from secondary schools to universities.',
  },
  alternates: { canonical: 'https://terasms.com/solutions' },
}

export default function SolutionsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
