import type { MetadataRoute } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://terasms.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const marketingPages = [
    { path: '',            priority: 1.0,  freq: 'weekly'  },
    { path: '/pricing',    priority: 0.9,  freq: 'weekly'  },
    { path: '/features',   priority: 0.9,  freq: 'weekly'  },
    { path: '/solutions',  priority: 0.8,  freq: 'monthly' },
    { path: '/about',      priority: 0.7,  freq: 'monthly' },
    { path: '/blog',       priority: 0.8,  freq: 'daily'   },
    { path: '/careers',    priority: 0.7,  freq: 'weekly'  },
    { path: '/contact',    priority: 0.7,  freq: 'monthly' },
    { path: '/integrations', priority: 0.6, freq: 'monthly' },
    { path: '/security',   priority: 0.6,  freq: 'monthly' },
    { path: '/docs',       priority: 0.8,  freq: 'weekly'  },
    { path: '/status',     priority: 0.5,  freq: 'hourly'  },
  ] as const

  return marketingPages.map(p => ({
    url:              `${APP_URL}${p.path}`,
    lastModified:     now,
    changeFrequency:  p.freq as MetadataRoute.Sitemap[number]['changeFrequency'],
    priority:         p.priority,
  }))
}
