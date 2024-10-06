// delete-skyhook.ts
import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
} from "discord.js";
import { getDbConnection } from "../database";
import { BOT_ENV } from "../config";
import { environment, testEnvWarning } from "../defs";

export const data = new SlashCommandBuilder()
  .setName("delete-skyhook")
  .setDescription("Deletes a skyhook timer by ID")
  .addIntegerOption((option) =>
    option
      .setName("id")
      .setDescription("The ID of the skyhook to delete")
      .setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  // Check if the bot is in development mode
  const isDevelopment = BOT_ENV === environment.dev;

  const id = interaction.options.getInteger("id");
  const guildId = interaction.guildId;

  if (!guildId) {
    return interaction.reply("This command can only be used within a server.");
  }

  if (!id || id <= 0) {
    return interaction.reply("Please provide a valid skyhook ID.");
  }

  try {
    const db = await getDbConnection();

    // Check if the skyhook exists
    const row = await db.get(
      `SELECT system, moonType, dateISO FROM skyhook_logs WHERE id = ? AND guildId = ?`,
      id,
      guildId
    );

    if (!row) {
      return interaction.reply(`Skyhook with ID ${id} was not found.`);
    }

    // Delete the skyhook
    await db.run(
      `DELETE FROM skyhook_logs WHERE id = ? AND guildId = ?`,
      id,
      guildId
    );

    // Create an embed message
    const embed = new EmbedBuilder()
      .setTitle(`${isDevelopment ? testEnvWarning + ": " : ""}Skyhook Deleted`)
      .setColor(0xfe42bb)
      .addFields({
        name: `ID: ${id}`,
        value: `Skyhook in system **${row.system} (${row.moonType})** scheduled for **${row.dateISO}** has been deleted.`,
      });

    // Add footer if in development mode
    if (isDevelopment) {
      embed.setFooter({
        text: testEnvWarning,
      });
    }

    return interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error("Database error:", error);
    return interaction.reply(
      "An error occurred while deleting the skyhook from the database."
    );
  }
}
