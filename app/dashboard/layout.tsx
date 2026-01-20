import type React from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { MobileNav } from "@/components/dashboard/mobile-nav"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-muted" suppressHydrationWarning>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block">
        <Sidebar />
      </aside>
      
      {/* Mobile Navigation */}
      <MobileNav />
      
      <main className="flex-1 overflow-auto w-full md:w-auto">{children}</main>
    </div>
  )
}
