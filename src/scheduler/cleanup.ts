// cleanup.ts
import { getDbConnection } from "../database";

export async function cleanupExpiredTimers() {
  try {
    const db = await getDbConnection();

    // Calculate the cutoff time: current time minus 5 hours
    const cutoffTime = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString();

    // Delete timers that expired more than 5 hours ago
    const result = await db.run(
      `DELETE FROM skyhook_logs WHERE dateISO <= ?`,
      cutoffTime,
    );

    console.log(
      `Cleanup complete: ${result.changes} expired timers removed from the database.`,
    );
  } catch (error) {
    console.error("Error during cleanup of expired timers:", error);
  }
}
