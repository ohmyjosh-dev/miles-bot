import { CronJob } from "cron";
import cronParser from "cron-parser";
import { Message } from "discord.js";
import { CELESTIAL_BLUE, ErrorCode } from "../consts";
import { getDbConnection } from "../database";
import {
  createEmbed,
  getErrorString,
  getErrorStringWithCode,
} from "../utils/utils";

export async function loadAndStartReminderJobs(): Promise<void> {
  try {
    const db = await getDbConnection();
    // Retrieve all reminders regardless of start status
    const reminders = await db.all<
      {
        name: string;
        cron_expression: string;
        channel_id: string;
        started: number;
      }[]
    >(`SELECT name, cron_expression, channel_id, started FROM reminders`);

    for (const reminder of reminders) {
      const job = CronJob.from({
        cronTime: reminder.cron_expression,
        onTick: async () => {
          console.log(`Reminder triggered: ${reminder.name}`);
          // ...existing code...
        },
        // Set the job's start state based on the "started" field (1 = start, 0 = do not start)
        start: reminder.started === 1,
        timeZone: "America/New_York",
      });
      console.log(
        `Reminder "${reminder.name}" created with start set to ${reminder.started === 1}`,
      );
    }
  } catch (err) {
    console.error("Failed to load and start reminder jobs:", err);
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
        color: CELESTIAL_BLUE,
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
          return `• **${r.name}**\nCron: \`${r.cron_expression}\`\nNext Run: \`${nextRun}\`\nChannel: \`${r.channel_id}\``;
        })
        .join("\n\n");
      const embed = createEmbed("Reminders", {
        description: reminderList,
        color: CELESTIAL_BLUE,
      });
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
