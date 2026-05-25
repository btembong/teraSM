import type { Metadata } from 'next'
import { Exo_2 } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/layout/providers'

const exo2 = Exo_2({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://terasms.com'

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),

  title: {
    default: 'Tera SM — School Management System',
    template: '%s | Tera SM',
  },

  description:
    'The complete operating system for educational institutions. Academics, finance, LMS, HR, live classes, and AI — all in one platform built for Africa.',

  keywords: [
    'school management system', 'school management software', 'student information system',
    'SIS Africa', 'LMS Africa', 'university management system', 'college management software',
    'school ERP', 'edtech Africa', 'student portal', 'academic management', 'fee management school',
    'online school software Nigeria', 'school software Ghana', 'Kenya school management',
    'Tera SM', 'TeraMS',
  ],

  authors: [{ name: 'Tera SM', url: APP_URL }],

  creator: 'Tera SM',
  publisher: 'Tera SM',

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: APP_URL,
    siteName: 'Tera SM',
    title: 'Tera SM — School Management System',
    description:
      'The complete operating system for educational institutions. Academics, finance, LMS, HR, live classes, and AI — all in one platform built for Africa.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Tera SM — School Management System',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    site: '@terasms',
    creator: '@terasms',
    title: 'Tera SM — School Management System',
    description:
      'The complete operating system for educational institutions. Built for Africa.',
    images: ['/og-image.png'],
  },

  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg',    type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon-32x32.png',
  },

  manifest: '/site.webmanifest',

  alternates: {
    canonical: APP_URL,
  },

  category: 'education',
}

// ── JSON-LD structured data (Organisation) ─────────────────────────────────────
const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Tera SM',
  url: APP_URL,
  logo: `${APP_URL}/logo.png`,
  sameAs: [
    'https://twitter.com/terasms',
    'https://linkedin.com/company/terasms',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'sales',
    email: 'hello@terasms.com',
    areaServed: 'AF',
    availableLanguage: ['English', 'French'],
  },
  description: 'The complete school management platform for African educational institutions.',
}

const softwareJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Tera SM',
  applicationCategory: 'EducationApplication',
  operatingSystem: 'Web, iOS, Android',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    description: '14-day free trial, no credit card required',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '127',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={exo2.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
        />
      </head>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
