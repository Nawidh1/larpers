import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ServiceWorkerRegistration } from "@/components/service-worker-registration"
import { NetworkProvider } from "@/components/network-aware"
import "./globals.css"

// Optimize font loading for slow connections - use display swap and preload
const geist = Geist({ 
  subsets: ["latin"],
  display: 'swap', // Show fallback font immediately, swap when loaded
  preload: true,
  fallback: ['system-ui', 'arial'], // Fast fallback fonts
})
const geistMono = Geist_Mono({ 
  subsets: ["latin"],
  display: 'swap',
  preload: false, // Only preload main font
  fallback: ['monospace'],
})

export const metadata: Metadata = {
  title: "Agritech Dashboard",
  description: "Smart agricultural management dashboard for crop monitoring, finance tracking, and climate insights",
  generator: "v0.app",
  manifest: "/manifest.json",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Agritech Dashboard",
  },
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#22c55e",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preload critical resources for faster loading on slow connections */}
        <link rel="preload" href="/manifest.json" as="fetch" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        {/* Preconnect to Supabase if configured */}
        {process.env.NEXT_PUBLIC_SUPABASE_URL && (
          <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} crossOrigin="anonymous" />
        )}
      </head>
      <body className={`${geist.className} antialiased`} suppressHydrationWarning>
        <NetworkProvider>
        {/* Remove browser extension attributes BEFORE React hydrates */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const removeExtensionAttributes = () => {
                  try {
                    const elements = document.querySelectorAll('[bis_skin_checked]');
                    elements.forEach(el => {
                      try {
                        el.removeAttribute('bis_skin_checked');
                      } catch(e) {}
                    });
                  } catch(e) {}
                };
                
                // Run immediately - before anything else
                if (document.documentElement) {
                  removeExtensionAttributes();
                }
                
                // Run as soon as body exists
                const checkBody = setInterval(() => {
                  if (document.body) {
                    removeExtensionAttributes();
                    clearInterval(checkBody);
                  }
                }, 0);
                
                // Use requestAnimationFrame to continuously remove attributes
                // This ensures we catch attributes added right before React hydrates
                let frameCount = 0;
                const maxFrames = 120; // Run for ~2 seconds at 60fps
                const continuousCleanup = () => {
                  removeExtensionAttributes();
                  frameCount++;
                  if (frameCount < maxFrames) {
                    requestAnimationFrame(continuousCleanup);
                  }
                };
                if (typeof requestAnimationFrame !== 'undefined') {
                  requestAnimationFrame(continuousCleanup);
                }
                
                // Also run when DOM is ready
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', removeExtensionAttributes);
                } else {
                  removeExtensionAttributes();
                }
                
                // Run on every page load/reload
                window.addEventListener('load', removeExtensionAttributes);
                
                // Use MutationObserver to continuously remove attributes added by extensions
                if (typeof MutationObserver !== 'undefined') {
                  const observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                      if (mutation.type === 'attributes' && mutation.attributeName === 'bis_skin_checked') {
                        try {
                          mutation.target.removeAttribute('bis_skin_checked');
                        } catch(e) {}
                      } else if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach((node) => {
                          if (node.nodeType === 1) {
                            try {
                              if (node.hasAttribute && node.hasAttribute('bis_skin_checked')) {
                                node.removeAttribute('bis_skin_checked');
                              }
                              const children = node.querySelectorAll && node.querySelectorAll('[bis_skin_checked]');
                              if (children) {
                                children.forEach(el => {
                                  try {
                                    el.removeAttribute('bis_skin_checked');
                                  } catch(e) {}
                                });
                              }
                            } catch(e) {}
                          }
                        });
                      }
                    });
                  });
                  
                  const startObserving = () => {
                    if (document.body) {
                      try {
                        observer.observe(document.body, {
                          attributes: true,
                          attributeFilter: ['bis_skin_checked'],
                          childList: true,
                          subtree: true
                        });
                      } catch(e) {}
                    }
                  };
                  
                  if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', startObserving);
                  } else {
                    startObserving();
                  }
                }
              })();
            `,
          }}
        />
        <div suppressHydrationWarning>
          {children}
        </div>
        <Analytics />
        <ServiceWorkerRegistration />
        </NetworkProvider>
      </body>
    </html>
  )
}
