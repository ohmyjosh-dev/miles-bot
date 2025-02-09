import { getDbConnection } from "../src/database";

(async () => {
  const db = await getDbConnection();

  try {
    await db.exec(
      `ALTER TABLE reminders ADD COLUMN reactions TEXT NOT NULL DEFAULT '[]';`,
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn("Column 'reactions' might already exist:", errorMessage);
  }

  try {
    await db.exec(
      `ALTER TABLE reminders ADD COLUMN show_reactions BOOLEAN NOT NULL DEFAULT 1;`,
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn("Column 'show_reactions' might already exist:", errorMessage);
  }

  console.log("Migration complete.");
  process.exit(0);
})().catch((error) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error("Migration failed:", errorMessage);
  process.exit(1);
});
