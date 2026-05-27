export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-dawn-white px-4 py-12">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(232,145,58,0.08) 0%, transparent 70%), ' +
            'radial-gradient(ellipse 60% 40% at 50% 100%, rgba(212,168,71,0.06) 0%, transparent 60%)',
        }}
      />
      <div className="relative w-full max-w-md">
        {children}
      </div>
    </div>
  )
}
