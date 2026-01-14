"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Sprout, DollarSign, Cloud, FileText, Settings, ChevronRight } from "lucide-react"
import { Logo } from "@/components/logo"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/crops", label: "Crop Monitoring", icon: Sprout },
  { href: "/dashboard/finance", label: "Finance", icon: DollarSign },
  { href: "/dashboard/climate", label: "Climate Insights", icon: Cloud },
  { href: "/dashboard/reports", label: "Reports", icon: FileText },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-card border-r border-border h-screen flex flex-col">
      <div className="p-4 border-b border-border">
        <Logo />
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive ? "bg-agri-green text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon size={18} />
              <span>{item.label}</span>
              {isActive && <ChevronRight size={16} className="ml-auto" />}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Settings size={18} />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  )
}
