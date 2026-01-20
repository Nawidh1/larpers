"use client"

import type React from "react"
import { useEffect, useState } from "react"

import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { NotificationsDropdown } from "@/components/dashboard/notifications-dropdown"

interface HeaderProps {
  title: string
  children?: React.ReactNode
}

export function Header({ title, children }: HeaderProps) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [userName, setUserName] = useState<string>("User")
  const [userEmail, setUserEmail] = useState<string>("")

  useEffect(() => {
    setMounted(true)
    loadUserData()
  }, [])

  async function loadUserData() {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        setUserEmail(user.email || "")

        // Get profile name
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single()

        if (profile?.full_name) {
          setUserName(profile.full_name)
        } else {
          // Fallback to email username
          const emailName = user.email?.split("@")[0] || "User"
          setUserName(emailName.charAt(0).toUpperCase() + emailName.slice(1))
        }
      }
    } catch (err) {
      console.error("Error loading user data:", err)
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <header className="h-20 md:h-24 min-h-[80px] border-b border-border bg-card flex items-center justify-between px-4 md:px-6 shadow-sm">
      <h1 className="text-xl md:text-2xl font-semibold text-foreground">{title}</h1>

      <div className="flex items-center gap-3">
        {children}

        <div className="flex items-center gap-2 ml-2 pl-2 md:pl-4 border-l border-border">
          <NotificationsDropdown />

          {mounted ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-1 md:gap-2 px-1 md:px-2">
                  <Avatar className="h-7 w-7 md:h-8 md:w-8">
                    <AvatarImage src="/farmer-avatar.png" />
                    <AvatarFallback className="bg-agri-green text-white text-xs md:text-sm">
                      {userName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs md:text-sm font-medium hidden md:inline">{userName}</span>
                  <ChevronDown size={14} className="hidden md:block md:w-4 md:h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>Profile</DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" className="flex items-center gap-1 md:gap-2 px-1 md:px-2" disabled>
              <Avatar className="h-7 w-7 md:h-8 md:w-8">
                <AvatarImage src="/farmer-avatar.png" />
                <AvatarFallback className="bg-agri-green text-white text-xs md:text-sm">U</AvatarFallback>
              </Avatar>
              <span className="text-xs md:text-sm font-medium hidden md:inline">User</span>
              <ChevronDown size={14} className="hidden md:block md:w-4 md:h-4" />
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
