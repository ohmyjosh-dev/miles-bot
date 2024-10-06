// src/database.ts
import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";

let db: Database<sqlite3.Database, sqlite3.Statement> | null = null;

export async function getDbConnection(): Promise<
  Database<sqlite3.Database, sqlite3.Statement>
> {
  if (db) {
    return db;
  }

  const databaseFile = process.env.DATABASE_FILE || "./database/milesbot.db";

  db = await open({
    filename: databaseFile,
    driver: sqlite3.Database,
  });

  // Create the campaigns table if it doesn't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      campaign_name TEXT NOT NULL,
      description TEXT NOT NULL,
      UNIQUE(guild_id, campaign_name)
    );
  `);

  // Create the milesbot_recaps table if it doesn't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS milesbot_recaps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      campaign_id INTEGER NOT NULL,
      recap_title TEXT NOT NULL,
      recap_link TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
    );
  `);

  return db;
}
