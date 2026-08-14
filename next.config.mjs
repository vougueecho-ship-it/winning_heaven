/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  poweredByHeader: false,
  reactStrictMode: false,
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      // 1. Optimized caching for static images, audio, and font files
      {
        source: '/:path*.(ico|png|jpg|jpeg|svg|webp|mp3|wav|ogg|woff|woff2|ttf)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          { key: 'Content-Type', value: 'application/manifest+json' },
          { key: 'Cache-Control', value: 'public, max-age=3600' },
        ],
      },
      {
        source: '/downloads/:path*',
        headers: [
          { key: 'Content-Disposition', value: 'attachment' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Cache-Control', value: 'public, max-age=3600' },
        ],
      },
      // 3. Prevent Hostinger CDN / Cloudflare edge from serving stale dynamic HTML pages
      {
        source: '/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, max-age=0, must-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      // Legacy landing path only — all other routes use real App Router pages
      {
        source: '/agent-player-login',
        destination: '/',
      },
    ];
  }
};

export default nextConfig;
