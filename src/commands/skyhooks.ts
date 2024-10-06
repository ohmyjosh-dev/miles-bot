// skyhooks.ts
import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
} from "discord.js";
import { getDbConnection } from "../database";
import { formatDateTime } from "../utils";
import { BOT_ENV } from "../config";
import { environment, testEnvWarning } from "../defs";

export const data = new SlashCommandBuilder()
  .setName("skyhooks")
  .setDescription("Shows upcoming Skyhook timers")
  .addIntegerOption((option) =>
    option
      .setName("limit")
      .setDescription("Number of upcoming Skyhook timers to display (1-50)")
      .setRequired(false)
      .setMinValue(1)
      .setMaxValue(50)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  // Check if the bot is in development mode
  const isDevelopment = BOT_ENV === environment.dev;

  const guildId = interaction.guildId;

  if (!guildId) {
    return interaction.reply("This command can only be used within a server.");
  }

  // Retrieve the 'limit' option; default to 10 if not provided
  const limit = interaction.options.getInteger("limit") ?? 10;

  try {
    const db = await getDbConnection();

    const rows = await db.all(
      `SELECT id, system, moonType, dateISO FROM skyhook_logs WHERE guildId = ? AND datetime(dateISO) >= datetime('now') ORDER BY datetime(dateISO) ASC LIMIT ?`,
      guildId,
      limit
    );

    if (rows.length === 0) {
      const reply = `${
        isDevelopment ? testEnvWarning + ": " : ""
      }There are no upcoming Skyhook timers.`;
      return interaction.reply(reply);
    }

    // Create an embed message
    const embed = new EmbedBuilder()
      .setTitle(
        `${isDevelopment ? testEnvWarning + ": " : ""}Upcoming Skyhook Timers`
      )
      .setColor(0xfe42bb);

    for (const row of rows) {
      const { id, system, moonType, dateISO } = row;
      const date = new Date(dateISO);
      const timestamp = Math.floor(date.getTime() / 1000);

      // Use formatDateTime to format UTC date and time
      const { formattedDate, formattedTime } = formatDateTime(date);
      const utcTimeString = `${formattedDate}, ${formattedTime}`;

      // Add a field for each timer with UTC and local times
      embed.addFields({
        name: `${system} (${moonType})`,
        value:
          `**UTC:** ${utcTimeString}\n` +
          `**Your Local Time:** <t:${timestamp}:F>\n` +
          `**Time Remaining:** <t:${timestamp}:R>\n` +
          `\`id: ${id}\``,
      });
    }

    // If in development mode, add a warning to the embed
    if (isDevelopment) {
      embed.setFooter({
        text: testEnvWarning,
      });
    }

    return interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error("Database error:", error);
    return interaction.reply(
      "An error occurred while fetching data from the database."
    );
  }
}
