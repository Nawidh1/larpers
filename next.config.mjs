/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Image optimization for slow connections - use WebP format and responsive sizes
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 days cache
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Performance optimizations for low-connectivity areas (Belize)
  compress: true,
  poweredByHeader: false,
  // Enable static optimization where possible
  experimental: {
    optimizePackageImports: [
      'lucide-react', 
      '@radix-ui/react-dialog', 
      '@radix-ui/react-select',
      'recharts',
      'leaflet',
      'react-leaflet',
    ],
  },
  // Output configuration for better caching
  generateEtags: true,
  // Reduce JavaScript bundle size
  swcMinify: true,
  // Optimize for production
  productionBrowserSourceMaps: false,
}

export default nextConfig
