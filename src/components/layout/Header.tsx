interface HeaderProps {
  title: string
  subtitle?: string
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="border-b border-amber-100 bg-white px-6 py-4">
      <h1 className="text-xl font-semibold text-amber-900">{title}</h1>
      {subtitle && <p className="text-sm text-amber-600 mt-0.5">{subtitle}</p>}
    </header>
  )
}
