import { CronJob } from "cron";

const sessionVoteReminderJob = CronJob.from({
  cronTime: "*/5 * * * * *", // Every Monday at 5:00 PM Eastern Time "0 0 17 * * 1"
  onTick: () => sessionVoteWeeklyReminder(),
  start: false,
  timeZone: "America/New_York",
});

/**
 * Starts the session vote reminder job.
 */
export function startSessionVoteReminderJob(): void {
  sessionVoteReminderJob.start();
}

/**
 * Stops the session vote reminder job.
 */
export function stopSessionVoteReminderJob(): void {
  sessionVoteReminderJob.stop();
}

/**
 * Sends a reminder to vote on availability for the
 * regularly scheduled session.
 */
function sessionVoteWeeklyReminder(): void {
  console.log("This runs every Monday at 9:00 AM Eastern Time!");
}
