// skyhook.ts
import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
} from "discord.js";
import { getDbConnection } from "../database";
import {
  formatDateTime,
  parseDuration,
  parseMoonType,
  validateSystem,
} from "../utils";
import { BOT_ENV } from "../config";
import { environment, testEnvWarning } from "../defs";

export const data = new SlashCommandBuilder()
  .setName("skyhook")
  .setDescription(
    "Logs skyhook timer. Supports 'Secure (vulnerable in 2d 4h 33m)' or '1d23h45m'"
  )
  .addStringOption((option) =>
    option
      .setName("system")
      .setDescription("System that the skyhook is in")
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("moon_type")
      .setDescription("Lava or Ice? (accepts 'L', 'I')")
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("time_until")
      .setDescription(
        "Time until skyhook. Supports: 'Secure (vulnerable in 2d 4h 33m)' or '1d23h45m'"
      )
      .setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  // Check if the bot is in development mode
  const isDevelopment = BOT_ENV === environment.dev;
  const system = interaction.options.getString("system")?.trim();
  const moonTypeInput = interaction.options.getString("moon_type")?.trim();
  const timeUntil = interaction.options.getString("time_until")?.trim();
  const guildId = interaction.guildId;

  if (!guildId) {
    return interaction.reply("This command can only be used within a server.");
  }

  if (!system || !moonTypeInput || !timeUntil) {
    return interaction.reply(
      "Please provide a system, moon type, and time until skyhook."
    );
  }

  if (!validateSystem(system)) {
    return interaction.reply(
      "Please provide a valid system name (alphanumeric, spaces, and hyphens only, max 20 characters)."
    );
  }

  const moonType = parseMoonType(moonTypeInput);
  if (!moonType) {
    return interaction.reply(
      "Moon type must be either 'Lava' (or 'L') or 'Ice' (or 'I')."
    );
  }

  const duration = parseDuration(timeUntil);
  if (!duration) {
    return interaction.reply(
      "Please provide a valid duration. Example: 1d23h45m"
    );
  }

  const { days, hours, minutes } = duration;

  // Enforce maximum duration of 4 days
  const totalMinutes = days * 24 * 60 + hours * 60 + minutes;
  const maxMinutes = 4 * 24 * 60; // 4 days in minutes

  if (totalMinutes > maxMinutes) {
    return interaction.reply(
      "The timer cannot be more than 4 days in advance."
    );
  }

  const upperCaseSystem = system.toUpperCase();

  const now = new Date();

  now.setUTCDate(now.getUTCDate() + days);
  now.setUTCHours(now.getUTCHours() + hours);
  now.setUTCMinutes(now.getUTCMinutes() + minutes);

  const { formattedDate, formattedTime } = formatDateTime(now);
  const isoString = now.toISOString();
  const timestamp = Math.floor(now.getTime() / 1000);

  let insertedId: number;

  try {
    const db = await getDbConnection();

    const result = await db.run(
      `INSERT INTO skyhook_logs (guildId, system, moonType, dateISO) VALUES (?, ?, ?, ?)`,
      guildId,
      upperCaseSystem,
      moonType,
      isoString
    );

    if (!result || !result.lastID) {
      return interaction.reply(
        "An error occurred while saving to the database."
      );
    }

    insertedId = result.lastID;
  } catch (error) {
    console.error("Database error:", error);
    return interaction.reply("An error occurred while saving to the database.");
  }

  // Create an embed message
  const embed = new EmbedBuilder()
    .setTitle(`${isDevelopment ? testEnvWarning + ": " : ""}Skyhook Added`)
    .setColor(0xfe42bb)
    .addFields({
      name: `${upperCaseSystem} (${moonType})`,
      value:
        `**UTC:** ${formattedDate}, ${formattedTime}\n` +
        `**Your Local Time:** <t:${timestamp}:F>\n` +
        `**Time Remaining:** <t:${timestamp}:R>\n` +
        `\`id: ${insertedId}\``,
    });

  // If in development mode, add a warning to the embed
  if (isDevelopment) {
    embed.setFooter({
      text: testEnvWarning,
    });
  }

  return interaction.reply({ embeds: [embed] });
}
