import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Resume uploads (PDF/Word up to 5 MB) go through a server action; the default limit is 1 MB.
    serverActions: { bodySizeLimit: '6mb' },
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
