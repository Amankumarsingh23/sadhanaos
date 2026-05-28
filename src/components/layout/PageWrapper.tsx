'use client'

import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'

interface PageWrapperProps {
  children:   React.ReactNode
  className?: string
}

const pageVariants = {
  hidden:  { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.32,
      ease: [0.22, 1, 0.36, 1] as const,
      staggerChildren: 0.06,
    },
  },
}

export function PageWrapper({ children, className }: PageWrapperProps) {
  const pathname = usePathname()
  return (
    <motion.div
      key={pathname}
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Named export for staggered child cards — add to motion.div inside pages
export const childVariant = {
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const } },
}
