import { Sidebar } from '@/components/layout/Sidebar'
import { PageWrapper } from '@/components/layout/PageWrapper'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <PageWrapper>{children}</PageWrapper>
    </div>
  )
}
