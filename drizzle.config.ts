import type { Config } from "drizzle-kit";

export default {
  schema: "./app/src/db/schema.ts",
  out: "./app/src/db/migrations",
  dialect: "mysql",
  dbCredentials: {
    host: "127.0.0.1",
    port: 3306,
    user: "honeyrae",
    password: "honeyrae",
    database: "honey_rae",
  },
} satisfies Config;
