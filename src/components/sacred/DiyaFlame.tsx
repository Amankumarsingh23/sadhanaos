'use client'

import { motion } from 'framer-motion'

export function DiyaFlame() {
  return (
    <div className="flex flex-col items-center">
      <motion.div
        className="w-6 h-10 bg-gradient-to-t from-orange-500 via-amber-400 to-yellow-200 rounded-full rounded-b-none origin-bottom"
        animate={{ scaleX: [1, 0.85, 1.1, 0.9, 1], scaleY: [1, 1.05, 0.95, 1.08, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="w-12 h-4 bg-amber-800 rounded-full mt-1" />
    </div>
  )
}
