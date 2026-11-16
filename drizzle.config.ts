import { defineConfig } from 'drizzle-kit'

// Generates SQL migrations from src/db/schema.ts into ./drizzle.
// The app applies them itself on first connection (src/db/index.ts).
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
})
