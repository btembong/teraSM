import Link from 'next/link'

const cols = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '/features' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Integrations', href: '/integrations' },
      { label: 'Changelog', href: '/docs#changelog' },
      { label: 'Status', href: '/status' },
    ],
  },
  {
    title: 'Solutions',
    links: [
      { label: 'Universities', href: '/solutions#universities' },
      { label: 'Colleges', href: '/solutions#colleges' },
      { label: 'Secondary Schools', href: '/solutions#secondary' },
      { label: 'For Administrators', href: '/solutions#admins' },
      { label: 'For Teachers', href: '/solutions#teachers' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Documentation', href: '/docs' },
      { label: 'API Reference', href: '/docs#api' },
      { label: 'Blog', href: '/blog' },
      { label: 'Case Studies', href: '/blog#case-studies' },
      { label: 'About', href: '/about' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Cookie Policy', href: '/cookies' },
      { label: 'DPA', href: '/dpa' },
    ],
  },
]

export function MarketingFooter() {
  return (
    <footer className="bg-gray-950 dark:bg-black text-gray-400 py-16">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-6 gap-10 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">T</span>
              </div>
              <span className="font-bold text-white">Tera<span className="text-blue-400">SM</span></span>
            </div>
            <p className="text-sm leading-relaxed mb-4">
              The complete operating system for educational institutions — from admissions to alumni.
            </p>
            <a href="mailto:hello@terasms.com" className="text-sm hover:text-white transition-colors">
              hello@terasms.com
            </a>
            <div className="flex items-center gap-4 mt-4">
              {[
                { label: 'Twitter/X', href: '#' },
                { label: 'LinkedIn', href: '#' },
                { label: 'YouTube', href: '#' },
              ].map((s) => (
                <a key={s.label} href={s.href} className="text-xs hover:text-white transition-colors">{s.label}</a>
              ))}
            </div>
          </div>

          {cols.map((col) => (
            <div key={col.title}>
              <p className="font-semibold text-white text-sm mb-4">{col.title}</p>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm hover:text-white transition-colors">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <p>© {new Date().getFullYear()} Tera SM. All rights reserved.</p>
          <p className="text-gray-500">Built for African education. Trusted globally.</p>
        </div>
      </div>
    </footer>
  )
}
