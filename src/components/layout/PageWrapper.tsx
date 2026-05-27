interface PageWrapperProps {
  children: React.ReactNode
}

export function PageWrapper({ children }: PageWrapperProps) {
  return <main className="flex-1 overflow-y-auto bg-amber-50/30 p-6">{children}</main>
}
