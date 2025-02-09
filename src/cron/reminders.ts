import { CronJob } from "cron";
import cronParser from "cron-parser";
import { Guild, GuildMember, Message } from "discord.js";
import { CELESTIAL_BLUE, ErrorCode, NO_DM_ROLE_MSG } from "../consts";
import { getDbConnection } from "../database";
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

export async function listReminders(msg: Message<boolean>): Promise<void> {
  if (!msg.guild) {
    msg.reply(getErrorString("This command can only be used in a server."));
    return;
  }
  try {
    const db = await getDbConnection();
    const guildId = msg.guild.id;
    const result = await db.all<{
      name: string;
      cron_expression: string;
      channel_id: string;
    }>(
      `SELECT name, cron_expression, channel_id FROM reminders WHERE guild_id = $guildId`,
      { $guildId: guildId },
    );
    const reminders = Array.isArray(result) ? result : [result];
    if (reminders.length === 0) {
      const embed = createEmbed("Reminders", {
        description: "No reminders found.",
      });
      msg.reply({ embeds: [embed] });
    } else {
      const reminderList = reminders
        .map((r) => {
          let nextRun = "Invalid cron";
          try {
            const interval = cronParser.parseExpression(r.cron_expression);
            nextRun = interval.next().toLocaleString();
          } catch (err) {
            // Keep default value if parsing fails.
          }
          return `• **${r.name}** – Cron: \`${r.cron_expression}\`, Next Run: \`${nextRun}\`, Channel: \`${r.channel_id}\``;
        })
        .join("\n");
      const embed = createEmbed("Reminders", { description: reminderList });
      msg.reply({ embeds: [embed] });
    }
  } catch (error: any) {
    console.error(error);
    msg.reply(
      getErrorStringWithCode(
        ErrorCode.ReminderRetrievalFailed,
        "Failed to retrieve reminders.",
      ),
    );
  }
}
