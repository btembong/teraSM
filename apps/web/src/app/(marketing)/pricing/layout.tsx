import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing — Tera SM',
  description: 'Simple, transparent pricing for every institution. Start free, scale as you grow. Starter, Pro, Enterprise and University plans.',
  keywords: [
    'school management software pricing', 'Tera SM pricing', 'school ERP cost',
    'student information system pricing Africa', 'LMS pricing',
  ],
  openGraph: {
    title: 'Pricing — Tera SM',
    description: 'Transparent pricing for every school size. 14-day free trial, no credit card required.',
    url: 'https://terasms.com/pricing',
  },
  twitter: {
    title: 'Pricing — Tera SM',
    description: 'Transparent pricing for every school size. 14-day free trial, no credit card required.',
  },
  alternates: { canonical: 'https://terasms.com/pricing' },
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
