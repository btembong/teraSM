import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Careers — Tera SM',
  description: 'Join the team building the operating system for African education. Remote-first, mission-driven, and growing fast.',
  openGraph: {
    title: 'Careers at Tera SM',
    description: 'Join the team building the operating system for African education.',
    url: 'https://terasms.com/careers',
  },
  alternates: { canonical: 'https://terasms.com/careers' },
}

export default function CareersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
