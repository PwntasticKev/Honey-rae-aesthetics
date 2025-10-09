import type { Config } from "drizzle-kit";

export default {
  schema: "./app/src/db/schema.ts",
  out: "./app/src/db/migrations",
  dialect: "mysql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
