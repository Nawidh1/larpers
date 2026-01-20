"use client"

import { useEffect, useState } from "react"
import { Leaf } from "lucide-react"

export function Logo({ size = "default" }: { size?: "small" | "default" | "large" }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const sizes = {
    small: { icon: 20, text: "text-lg" },
    default: { icon: 28, text: "text-2xl" },
    large: { icon: 40, text: "text-4xl" },
  }

  const { icon, text } = sizes[size]

  // Render placeholder during SSR to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center">
          <div className="w-7 h-7" />
        </div>
        <span className={`font-bold text-agri-green ${text}`}>Agritech</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center justify-center">
        <Leaf className="text-agri-green" size={icon} strokeWidth={2.5} />
      </div>
      <span className={`font-bold text-agri-green ${text}`}>Agritech</span>
    </div>
  )
}
