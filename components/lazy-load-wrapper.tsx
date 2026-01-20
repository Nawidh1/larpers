"use client"

import { ReactNode, Suspense } from "react"
import { useNetwork } from "./network-aware"

interface LazyLoadWrapperProps {
  children: ReactNode
  fallback?: ReactNode
  forceLoad?: boolean
}

export function LazyLoadWrapper({ children, fallback, forceLoad = false }: LazyLoadWrapperProps) {
  const { isSlowConnection, saveData } = useNetwork()

  // On slow connections or data saver mode, show loading state longer
  const defaultFallback = (
    <div className="flex items-center justify-center p-8">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-agri-green border-t-transparent" />
        <p className="text-sm text-muted-foreground">
          {isSlowConnection ? "Laden op trage verbinding..." : "Laden..."}
        </p>
      </div>
    </div>
  )

  // If forceLoad is true or connection is fast, load immediately
  if (forceLoad || (!isSlowConnection && !saveData)) {
    return <Suspense fallback={fallback || defaultFallback}>{children}</Suspense>
  }

  // On slow connections, delay loading slightly to prioritize critical content
  return (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  )
}
