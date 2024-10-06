// database.ts
import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";

let db: Database | null = null;

export async function getDbConnection(): Promise<Database> {
  if (db) {
    return db;
  }

  const databaseFile = process.env.DATABASE_FILE || "./database/milesbot.db";

  db = await open({
    filename: databaseFile,
    driver: sqlite3.Database,
  });

  // Create the table if it doesn't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS milesbot_recaps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaignName TEXT NOT NULL,
      title TEXT NOT NULL,
      recap TEXT NOT NULL,
    );
  `);

  return db;
}
