import { OwnerNav } from '@/components/OwnerNav'

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas">
      <OwnerNav />
      <main>{children}</main>
    </div>
  )
}
