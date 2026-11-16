import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
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
