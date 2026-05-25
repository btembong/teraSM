import { MarketingNav } from '@/components/marketing/nav'
import { MarketingFooter } from '@/components/marketing/footer'
import { CookieBanner } from '@/components/marketing/cookie-banner'
import { CrispChat } from '@/components/marketing/crisp-chat'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <MarketingNav />
      <main>{children}</main>
      <MarketingFooter />
      <CookieBanner />
      <CrispChat />
    </div>
  )
}
