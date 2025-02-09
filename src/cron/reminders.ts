import { CronJob } from "cron";
import cronParser from "cron-parser";
import { Message } from "discord.js";
import { client } from "..";
import { CELESTIAL_BLUE, ErrorCode } from "../consts";
import { getDbConnection } from "../database";
import {
  createEmbed,
  getErrorString,
  getErrorStringWithCode,
} from "../utils/utils";

// Global map to store running reminder jobs by name
const reminderJobs: Record<string, CronJob> = {};

export async function loadAndStartReminderJobs(): Promise<void> {
  try {
    const db = await getDbConnection();
    // Retrieve all reminders including description
    const reminders = await db.all<
      {
        name: string;
        cron_expression: string;
        channel_id: string;
        description: string;
        started: number;
      }[]
    >(
      `SELECT name, cron_expression, channel_id, description, started FROM reminders`,
    );

    for (const reminder of reminders) {
      const job = CronJob.from({
        cronTime: reminder.cron_expression,
        onTick: async () => {
          console.log(`Reminder triggered: ${reminder.name}`);
          // Create an embed with the reminder name and description.
          const embed = createEmbed(reminder.name, {
            description: reminder.description,
            color: CELESTIAL_BLUE,
          });
          try {
            const channel = await client.channels.fetch(reminder.channel_id);
            // Updated check to ensure channel supports send()
            if (
              channel &&
              "send" in channel &&
              typeof channel.send === "function"
            ) {
              await channel.send({ embeds: [embed] });
            } else {
              console.error(
                `Channel ${reminder.channel_id} does not support sending messages.`,
              );
            }
          } catch (error) {
            console.error("Error sending reminder embed:", error);
          }
        },
        // Set the job's start state based on the "started" field (1 = start, 0 = do not start)
        start: reminder.started === 1,
        timeZone: "America/New_York",
      });
      reminderJobs[reminder.name] = job;
      console.log(
        `Reminder "${reminder.name}" created with start set to ${reminder.started === 1}`,
      );
    }
  } catch (err) {
    console.error("Failed to load and start reminder jobs:", err);
  }
}

/**
 * Sets (starts or stops) a reminder by name for a given guild.
 * Updates the database and the in-memory job.
 */
export async function setReminderStatus(
  reminderName: string,
  guildId: string,
  start: boolean,
): Promise<void> {
  const db = await getDbConnection();

  await db.run(
    `UPDATE reminders SET started = $start WHERE name = $name AND guild_id = $guildId`,
    { $start: start ? 1 : 0, $name: reminderName, $guildId: guildId },
  );

  // Lookup the existing CronJob from the global reminderJobs map
  const job = reminderJobs[reminderName];
  if (job) {
    if (start) {
      job.start();
      console.log(`Started reminder "${reminderName}".`);
    } else {
      job.stop();
      console.log(`Stopped reminder "${reminderName}".`);
    }
  } else {
    console.log(`No job exists for reminder "${reminderName}".`);
  }
}

export async function deleteReminder(reminderName: string): Promise<void> {
  // If the job exists, stop it and remove from the reminderJobs object.
  const job = reminderJobs[reminderName];
  if (job) {
    job.stop();
    delete reminderJobs[reminderName];
    console.log(`Reminder "${reminderName}" deleted and stopped.`);
  } else {
    console.log(`No job found for reminder "${reminderName}".`);
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
    // Include the "started" column in the query
    const result = await db.all<{
      name: string;
      cron_expression: string;
      channel_id: string;
      started: number;
    }>(
      `SELECT name, cron_expression, channel_id, started FROM reminders WHERE guild_id = $guildId`,
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
          const started = r.started === 1;
          const status = started ? "Started" : "Stopped";
          if (!started) {
            nextRun = `**Stopped.** Next run would be ${nextRun}`;
          }
          return `• **${r.name}**\nCron: \`${r.cron_expression}\`\nNext Run: \`${nextRun}\`\nChannel: \`${r.channel_id}\`\nStatus: **${status}**`;
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

export function addReminderJob(reminder: {
  name: string;
  cron_expression: string;
  channel_id: string;
  description: string;
  started: number;
}): void {
  const job = CronJob.from({
    cronTime: reminder.cron_expression,
    onTick: async () => {
      console.log(`Reminder triggered: ${reminder.name}`);
      // Create an embed with the reminder name and description.
      const embed = createEmbed(reminder.name, {
        description: reminder.description,
        color: CELESTIAL_BLUE,
      });
      try {
        const channel = await client.channels.fetch(reminder.channel_id);
        if (
          channel &&
          "send" in channel &&
          typeof channel.send === "function"
        ) {
          await channel.send({ embeds: [embed] });
        } else {
          console.error(
            `Channel ${reminder.channel_id} does not support sending messages.`,
          );
        }
      } catch (error) {
        console.error("Error sending reminder embed:", error);
      }
    },
    start: reminder.started === 1,
    timeZone: "America/New_York",
  });
  reminderJobs[reminder.name] = job;
  console.log(
    `Reminder "${reminder.name}" created with start set to ${reminder.started === 1}`,
  );
}
