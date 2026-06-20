export const metadata = {
  title: 'E-Statement',
  description: 'View account statements and transaction history'
}

export default function EStatementLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_50%_0%,_#1e1035_0%,_#0b0713_72%)] text-[#f3f0f7]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(157,78,221,0.12),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(255,0,127,0.08),_transparent_24%)] opacity-80" />
      <div className="relative z-10">{children}</div>
    </div>
  )
}