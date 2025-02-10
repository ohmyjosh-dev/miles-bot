// src/database.ts
import { Database, open } from "sqlite";
import sqlite3 from "sqlite3";

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
      id TEXT PRIMARY KEY,
      guild_id TEXT NOT NULL,
      campaign_name TEXT NOT NULL,
      description TEXT NOT NULL,
      UNIQUE(guild_id, campaign_name)
    );
  `);

  // Create the campaign_info table if it doesn't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS campaign_info (
      id TEXT PRIMARY KEY,
      guild_id TEXT NOT NULL,
      campaign_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      link TEXT NOT NULL,
      sort_order INTEGER DEFAULT -1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
      UNIQUE(guild_id, title)
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      name TEXT NOT NULL, 
      description TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      cron_expression TEXT NOT NULL,
      started BOOLEAN NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      reactions TEXT NOT NULL DEFAULT '[]',
      ping_role TEXT, 
      UNIQUE(guild_id, name) 
    );
  `);

  return db;
}
