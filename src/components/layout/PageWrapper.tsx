interface PageWrapperProps {
  children: React.ReactNode
  className?: string
}

/**
 * Thin wrapper around individual page content.
 * The shell layout (sidebar + header) is provided by ShellClient in (dashboard)/layout.tsx.
 * Use this in pages that need extra container constraints or padding.
 */
export function PageWrapper({ children, className }: PageWrapperProps) {
  return (
    <div className={className}>
      {children}
    </div>
  )
}
