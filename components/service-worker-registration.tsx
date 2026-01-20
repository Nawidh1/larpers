"use client"

import { useEffect } from "react"

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return
    }

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        })

        console.log("Service Worker registered:", registration.scope)

        // Check for updates periodically (every hour)
        setInterval(() => {
          registration.update()
        }, 60 * 60 * 1000)

        // Handle updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                // New service worker available, prompt user to refresh
                console.log("New service worker available. Refresh to update.")
                // Optionally show a notification to the user
              }
            })
          }
        })

        // Handle controller change (page refresh after update)
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          window.location.reload()
        })
      } catch (error) {
        console.error("Service Worker registration failed:", error)
      }
    }

    // Register after page load to not block initial render
    if (document.readyState === "complete") {
      registerServiceWorker()
    } else {
      window.addEventListener("load", registerServiceWorker)
    }
  }, [])

  return null
}
