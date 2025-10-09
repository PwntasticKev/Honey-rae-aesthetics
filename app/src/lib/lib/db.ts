import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../../db/schema";

declare global {
  // eslint-disable-next-line no-var
  var db: ReturnType<typeof drizzle> | undefined;
}

let db: ReturnType<typeof drizzle>;

if (process.env.NODE_ENV === "production") {
  db = drizzle(
    mysql.createPool({
      uri: process.env.DATABASE_URL!,
    }),
    { schema, mode: "default" }
  );
} else {
  if (!global.db) {
    global.db = drizzle(
      mysql.createPool({
        uri: process.env.DATABASE_URL!,
      }),
      { schema, mode: "default" }
    );
  }
  db = global.db;
}

export { db };
