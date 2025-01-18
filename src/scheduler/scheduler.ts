// scheduler.ts
import cron from "node-cron";
import { cleanupExpiredTimers } from "./cleanup";

export function startSchedulers() {
  // Schedule the cleanup task to run every 6 hours
  cron.schedule(
    "0 */6 * * *",
    async () => {
      try {
        console.log("Running scheduled cleanup task...");
        await cleanupExpiredTimers();
      } catch (error) {
        console.error("Error in scheduled cleanup task:", error);
      }
    },
    {
      timezone: "Etc/UTC", // Use 'Etc/UTC' for Coordinated Universal Time
    },
  );

  console.log("Schedulers started.");
}
