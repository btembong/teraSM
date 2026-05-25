'use client'

import { motion } from 'framer-motion'

export function AnimatedHeroIcon({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      className="hidden md:flex w-20 h-20 rounded-3xl bg-white/15 border border-white/20 items-center justify-center flex-shrink-0"
    >
      {children}
    </motion.div>
  )
}
