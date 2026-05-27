'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NAV_ITEMS, APP_NAME } from '@/lib/constants'
import { cn } from '@/lib/utils'

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-60 shrink-0 border-r border-amber-100 bg-amber-50 min-h-screen flex flex-col">
      <div className="px-6 py-5 border-b border-amber-100">
        <span className="text-lg font-bold text-orange-700">{APP_NAME}</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
              pathname === item.href
                ? 'bg-orange-100 text-orange-700'
                : 'text-amber-800 hover:bg-amber-100'
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
