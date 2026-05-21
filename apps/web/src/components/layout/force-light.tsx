'use client'

import { ThemeProvider } from 'next-themes'

/**
 * Wrap portal layouts with this to force light mode.
 * Marketing pages use the root ThemeProvider which respects system/user preference.
 */
export function ForceLight({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" forcedTheme="light">
      {children}
    </ThemeProvider>
  )
}
