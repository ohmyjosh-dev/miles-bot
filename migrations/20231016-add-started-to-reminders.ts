import { getDbConnection } from "../src/database";

async function migrate() {
  const db = await getDbConnection();

  // Explicitly type columns as an array
  const columns: { name: string }[] = await db.all(
    `PRAGMA table_info(reminders)`,
  );
  const startedExists = columns.some((col) => col.name === "started");

  if (!startedExists) {
    console.log("Adding 'started' column to reminders table...");
    await db.exec(`
      ALTER TABLE reminders
      ADD COLUMN started BOOLEAN NOT NULL DEFAULT 0;
    `);
    console.log("Migration applied.");
  } else {
    console.log("'started' column already exists, migration skipped.");
  }
}

migrate().catch((error) => {
  console.error("Migration failed:", error);
});
