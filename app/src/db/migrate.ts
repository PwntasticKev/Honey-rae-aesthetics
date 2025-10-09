import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../../.env.local") });

import { migrate } from "drizzle-orm/mysql2/migrator";
import { db } from "../lib/lib/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Running migrations...");

  try {
    await migrate(db, { migrationsFolder: "app/src/db/migrations" });
    console.log("Migrations finished successfully.");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
