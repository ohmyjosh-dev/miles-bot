// src/commands/delete-info.ts
import {
  ChatInputCommandInteraction,
  GuildMember,
  SlashCommandBuilder,
} from "discord.js";
import { DM_ROLE_NAME } from "../consts";
import { getDbConnection } from "../database";
import { CommandName } from "../defs";
import {
  createErrorEmbed,
  ensureGuild,
  getErrorString,
  getSuccessString,
  handleError,
  isValidUUID,
} from "../utils/utils";

export const data = new SlashCommandBuilder()
  .setName(CommandName.milesDeleteInfo)
  .setDescription("Deletes a specific information block by its ID.")
  .addStringOption((option) =>
    option
      .setName("info_id")
      .setDescription("The unique ID of the information block to delete.")
      .setRequired(true),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  // Ensure the command is executed within a guild
  const guildId = await ensureGuild(interaction);
  if (!guildId) return;

  // Check if the user has the "DM" role
  const member = interaction.member as GuildMember;
  const hasDmRole = member.roles.cache.some(
    (role) => role.name === DM_ROLE_NAME,
  );
  if (!hasDmRole) {
    const embed = createErrorEmbed(
      getErrorString("Insufficient Permissions"),
      "You need the **DM** role to use this command.",
    );
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  // Extract and validate the info_id option
  const infoIdInput = interaction.options.getString("info_id", true).trim();

  // Validate that info_id is a number
  if (!isValidUUID(infoIdInput)) {
    const embed = createErrorEmbed(
      getErrorString("Invalid Info ID"),
      "The provided Info ID is not a valid number.",
    );
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  try {
    const db = await getDbConnection();

    // Check if the info exists and belongs to the guild
    const info = await db.get(
      `SELECT * FROM campaign_info WHERE id = $info_id AND guild_id = $guild_id`,
      { $info_id: infoIdInput, $guild_id: guildId },
    );

    if (!info) {
      const embed = createErrorEmbed(
        getErrorString("Info Block Not Found"),
        `No info found with ID **${infoIdInput}** in this server.`,
      );
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Optional: Confirm deletion with the user
    // For simplicity, we'll proceed with deletion without confirmation

    // Delete the Info
    await db.run(`DELETE FROM campaign_info WHERE id = $id`, {
      $id: infoIdInput,
    });

    const embed = createErrorEmbed(getSuccessString(`${info.title} Deleted`));
    embed.setDescription(
      `Info with ID **${infoIdInput}** has been successfully deleted.`,
    );

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    await handleError(
      interaction,
      error,
      "There was an error deleting the Info.",
    );
  }
}
