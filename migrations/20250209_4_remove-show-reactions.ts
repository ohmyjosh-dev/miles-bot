import { Database } from "sqlite";
import sqlite3 from "sqlite3";

export async function migrate(
  db: Database<sqlite3.Database, sqlite3.Statement>,
) {
  await db.exec(`
    PRAGMA foreign_keys = OFF;
    ALTER TABLE reminders RENAME TO _reminders_old;

    CREATE TABLE reminders (
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

    INSERT INTO reminders (
      id, guild_id, name, description, channel_id, cron_expression,
      started, created_at, reactions, ping_role
    )
    SELECT
      id, guild_id, name, description, channel_id, cron_expression,
      started, created_at, reactions, ping_role
    FROM _reminders_old;

    DROP TABLE _reminders_old;
    PRAGMA foreign_keys = ON;
  `);
}
