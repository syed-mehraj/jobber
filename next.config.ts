import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Resume uploads (PDF/Word up to 5 MB) go through a server action; the default limit is 1 MB.
    serverActions: { bodySizeLimit: '6mb' },
  },
  // No framing (clickjacking), no MIME sniffing, and no full URLs (invite links) in Referer headers.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },
  // PGlite ships WebAssembly and data files; load it from node_modules instead of bundling it.
  serverExternalPackages: ['@electric-sql/pglite'],
  // The SQL migrations are read from disk on first connection, so ship them with the server.
  outputFileTracingIncludes: { '/**': ['./drizzle/**/*'] },
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
}

export default nextConfig
