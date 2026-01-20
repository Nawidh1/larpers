"use client"

import { Leaf } from "lucide-react"

export function Logo({ size = "default" }: { size?: "small" | "default" | "large" }) {
  const sizes = {
    small: { icon: 20, text: "text-lg" },
    default: { icon: 28, text: "text-2xl" },
    large: { icon: 40, text: "text-4xl" },
  }

  const { icon, text } = sizes[size]

  return (
    <div className="flex items-center gap-2" suppressHydrationWarning>
      <div className="flex items-center justify-center" style={{ width: icon, height: icon }} suppressHydrationWarning>
        <Leaf className="text-agri-green" size={icon} strokeWidth={2.5} />
      </div>
      <span className={`font-bold text-agri-green ${text}`}>Agritech</span>
    </div>
  )
}
