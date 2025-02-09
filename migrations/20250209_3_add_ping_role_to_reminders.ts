import { getDbConnection } from "../src/database";

(async () => {
  const db = await getDbConnection();

  // Check if 'ping_role' column exists
  const tableInfo = await db.all(`PRAGMA table_info(reminders)`);
  const columnExists = tableInfo.some((col: any) => col.name === "ping_role");

  if (!columnExists) {
    await db.exec(`ALTER TABLE reminders ADD COLUMN ping_role TEXT`);
    console.log(
      "Migration applied: 'ping_role' column added to reminders table.",
    );
  } else {
    console.log("Migration skipped: 'ping_role' column already exists.");
  }
})();
