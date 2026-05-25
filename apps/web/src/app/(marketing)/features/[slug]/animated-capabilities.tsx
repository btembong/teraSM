'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'

interface Group {
  heading: string
  items: string[]
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}

const groupVariant = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

const itemVariant = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' } },
}

export function AnimatedCapabilities({ groups }: { groups: Group[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-8% 0px' })

  return (
    <motion.div
      ref={ref}
      variants={container}
      initial="hidden"
      animate={inView ? 'show' : 'hidden'}
      className="grid md:grid-cols-2 gap-8"
    >
      {groups.map(group => (
        <motion.div key={group.heading} variants={groupVariant}>
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-4">
            {group.heading}
          </h3>
          <motion.ul variants={container} className="space-y-3">
            {group.items.map(cap => (
              <motion.li key={cap} variants={itemVariant} className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{cap}</span>
              </motion.li>
            ))}
          </motion.ul>
        </motion.div>
      ))}
    </motion.div>
  )
}
