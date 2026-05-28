import { ShellClient } from '@/components/layout/ShellClient'

export const dynamic = 'force-dynamic'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <ShellClient>{children}</ShellClient>
}
