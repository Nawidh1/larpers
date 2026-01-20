"use client"

import { useEffect, useState, createContext, useContext, ReactNode } from "react"

interface NetworkInfo {
  effectiveType: string
  downlink: number
  rtt: number
  saveData: boolean
  isSlowConnection: boolean
}

const NetworkContext = createContext<NetworkInfo>({
  effectiveType: "4g",
  downlink: 10,
  rtt: 50,
  saveData: false,
  isSlowConnection: false,
})

export function useNetwork() {
  return useContext(NetworkContext)
}

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({
    effectiveType: "4g",
    downlink: 10,
    rtt: 50,
    saveData: false,
    isSlowConnection: false,
  })

  useEffect(() => {
    if (typeof window === "undefined") return

    // Check if Network Information API is available
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection

    const updateNetworkInfo = () => {
      if (connection) {
        const effectiveType = connection.effectiveType || "4g"
        const downlink = connection.downlink || 10
        const rtt = connection.rtt || 50
        const saveData = connection.saveData || false

        // Consider connection slow if:
        // - effectiveType is 2g or slow-2g
        // - downlink is less than 1.5 Mbps
        // - rtt is greater than 500ms
        const isSlowConnection =
          effectiveType === "2g" ||
          effectiveType === "slow-2g" ||
          downlink < 1.5 ||
          rtt > 500 ||
          saveData

        setNetworkInfo({
          effectiveType,
          downlink,
          rtt,
          saveData,
          isSlowConnection,
        })
      } else {
        // Fallback: assume slow connection if API not available (older browsers)
        setNetworkInfo({
          effectiveType: "unknown",
          downlink: 1,
          rtt: 1000,
          saveData: false,
          isSlowConnection: true, // Conservative approach for remote areas
        })
      }
    }

    updateNetworkInfo()

    if (connection) {
      connection.addEventListener("change", updateNetworkInfo)
      return () => connection.removeEventListener("change", updateNetworkInfo)
    }
  }, [])

  return <NetworkContext.Provider value={networkInfo}>{children}</NetworkContext.Provider>
}
