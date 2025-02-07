import { CronJob } from "cron";
import { Guild, GuildMember } from "discord.js";
import { CELESTIAL_BLUE, NO_DM_ROLE_MSG } from "../consts";
import { ErrorCode } from "../hello-miles/hello-miles.constants";
import {
  createEmbed,
  getErrorString,
  getErrorStringWithCode,
  hasDmRole,
  isDevelopment,
} from "../utils/utils";

let biggerBetterInn: Guild | undefined = undefined;

const sessionVoteReminderJob = CronJob.from({
  cronTime: "0 0 17 * * 1", // Every Monday at 5:00 PM Eastern Time "0 0 17 * * 1"
  onTick: () => sessionVoteWeeklyReminder(),
  start: false,
  timeZone: "America/New_York",
});

/**
 * Initializes the weekly reminder jobs.
 */
export function sessionVoteReminderJobInit(guild: Guild | undefined): void {
  biggerBetterInn = guild;
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
  if (!biggerBetterInn) {
    return;
  }

  const scheduleChannelId = "1324872162259107931";
  const botTestingChannel = "1330192482813874217";
  const dndRoleId = "<@&1324871007814549597>";
  const dmRole = "<@&1214647154044313600>";

  const channelId = isDevelopment ? botTestingChannel : scheduleChannelId;
  const roleId = isDevelopment ? dmRole : dndRoleId;

  const channel = biggerBetterInn.channels.cache.get(channelId);

  const embed = createEmbed("D&D Thursday Reminder", {
    description:
      "Will you make it? Or will you disappear into the void like me? 🌌" +
      "\n\nReact with a 👍 if you can make it, or a 👎 if you can't.",
    color: CELESTIAL_BLUE,
  });

  if (channel && "send" in channel && typeof channel.send === "function") {
    channel
      ?.send({
        content: `${roleId}`,
        embeds: [embed],
      })
      .then((embedMessage) => {
        embedMessage.react("👍");
        embedMessage.react("👎");
      });
  }
}
