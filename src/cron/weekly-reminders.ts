import { CronJob } from "cron";
import { GuildMember } from "discord.js";
import { NO_DM_ROLE_MSG } from "../consts";
import { ErrorCode } from "../hello-miles/hello-miles.constants";
import {
  getErrorString,
  getErrorStringWithCode,
  hasDmRole,
} from "../utils/utils";

const sessionVoteReminderJob = CronJob.from({
  cronTime: "*/5 * * * * *", // Every Monday at 5:00 PM Eastern Time "0 0 17 * * 1"
  onTick: () => sessionVoteWeeklyReminder(),
  start: false,
  timeZone: "America/New_York",
});

/**
 * Initializes the weekly reminder jobs.
 */
export function sessionVoteReminderJobInit(): void {
  sessionVoteReminderJob.start();
}

/**
 * Starts the session vote reminder job.
 */
export function startSessionVoteReminderJob(
  member: GuildMember | null,
): string {
  if (!member) {
    return getErrorStringWithCode(ErrorCode.NoMemberStartSessionVoteReminder);
  }

  if (!hasDmRole(member)) {
    return getErrorString(NO_DM_ROLE_MSG);
  }

  sessionVoteReminderJob.start();

  return "Session vote reminder started.";
}

/**
 * Stops the session vote reminder job.
 */
export function stopSessionVoteReminderJob(member: GuildMember | null): string {
  if (!member) {
    return getErrorStringWithCode(ErrorCode.NoMemberStopSessionVoteReminder);
  }

  if (!hasDmRole(member)) {
    return getErrorString(NO_DM_ROLE_MSG);
  }

  sessionVoteReminderJob.stop();

  return "Session vote reminder stopped.";
}

/**
 * Sends a reminder to vote on availability for the
 * regularly scheduled session.
 */
function sessionVoteWeeklyReminder(): void {
  console.log("Sending session vote reminder.");
}
