// src/commands/delete-recap.ts
import {
  ChatInputCommandInteraction,
  GuildMember,
  SlashCommandBuilder,
} from "discord.js";
import {
  handleError,
  ensureGuild,
  createErrorEmbed,
  createSuccessEmbed,
} from "../utils";
import { getDbConnection } from "../database";
import { config } from "../config"; // Ensure config includes DM_ROLE_ID
import { DM_ROLE_NAME } from "../defs";

export const data = new SlashCommandBuilder()
  .setName("miles-delete-recap")
  .setDescription("Deletes a specific recap entry by its ID.")
  .addStringOption((option) =>
    option
      .setName("recap_id")
      .setDescription("The unique ID of the recap to delete.")
      .setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  // Ensure the command is executed within a guild
  const guildId = await ensureGuild(interaction);
  if (!guildId) return;

  // Check if the user has the "DM" role
  const member = interaction.member as GuildMember;
  const hasDmRole = member.roles.cache.some(
    (role) => role.name === DM_ROLE_NAME
  );
  if (!hasDmRole) {
    const embed = createErrorEmbed(
      "Insufficient Permissions ❌",
      "You need the **DM** role to use this command."
    );
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
  // Extract and validate the recap_id option
  const recapIdInput = interaction.options.getString("recap_id", true).trim();

  // Validate that recap_id is a number
  const recapId = parseInt(recapIdInput, 10);
  if (isNaN(recapId)) {
    const embed = createErrorEmbed(
      "Invalid Recap ID ❌",
      "The provided Recap ID is not a valid number."
    );
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  try {
    const db = await getDbConnection();

    // Check if the recap exists and belongs to the guild
    const recap = await db.get(
      `SELECT * FROM milesbot_recaps WHERE id = ? AND guild_id = ?`,
      [recapId, guildId]
    );

    if (!recap) {
      const embed = createErrorEmbed(
        "Recap Not Found ❌",
        `No recap found with ID **${recapId}** in this server.`
      );
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Optional: Confirm deletion with the user
    // For simplicity, we'll proceed with deletion without confirmation

    // Delete the recap
    await db.run(`DELETE FROM milesbot_recaps WHERE id = ?`, [recapId]);

    const embed = createSuccessEmbed("Recap Deleted 🎉");
    embed.setDescription(
      `Recap with ID **${recapId}** has been successfully deleted.`
    );
    embed.setColor(0xff0000); // Red color to indicate deletion

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    await handleError(
      interaction,
      error,
      "There was an error deleting the recap."
    );
  }
}
