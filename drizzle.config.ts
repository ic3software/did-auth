import type { Config } from "drizzle-kit";

export default {
  schema: "./src/lib/server/db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: "./drizzle/svelte-ucan.db",
  },
} satisfies Config;