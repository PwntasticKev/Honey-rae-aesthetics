import { migrate } from "drizzle-orm/mysql2/migrator";
import { db } from ".";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Running migrations...");

  // This is a workaround for a current Drizzle ORM bug
  // https://github.com/drizzle-team/drizzle-orm/issues/1411
  await db.execute(sql`SET SESSION sql_require_primary_key = 0`);

  await migrate(db, { migrationsFolder: "src/db/migrations" });

  await db.execute(sql`SET SESSION sql_require_primary_key = 1`);

  console.log("Migrations finished.");

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
