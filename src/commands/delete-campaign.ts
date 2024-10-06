// src/commands/delete-campaign.ts
import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  GuildMember,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} from "discord.js";
import { handleError, ensureGuild, createErrorEmbed } from "../utils";
import { getDbConnection } from "../database";
import { DM_ROLE_NAME } from "../defs";

export const data = new SlashCommandBuilder()
  .setName("miles-delete-campaign")
  .setDescription(
    "Deletes a specific campaign by its ID along with all associated recaps."
  )
  .addStringOption((option) =>
    option
      .setName("campaign_id")
      .setDescription("The unique ID of the campaign to delete.")
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

  // Extract and validate the campaign_id option
  const campaignIdInput = interaction.options
    .getString("campaign_id", true)
    .trim();

  // Validate that campaign_id is a number
  const campaignId = parseInt(campaignIdInput, 10);
  if (isNaN(campaignId)) {
    const embed = createErrorEmbed(
      "Invalid Campaign ID ❌",
      "The provided Campaign ID is not a valid number."
    );
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  try {
    const db = await getDbConnection();

    // Check if the campaign exists and belongs to the guild
    const campaign = await db.get(
      `SELECT * FROM campaigns WHERE id = ? AND guild_id = ?`,
      [campaignId, guildId]
    );

    if (!campaign) {
      const embed = createErrorEmbed(
        "Campaign Not Found ❌",
        `No campaign found with ID **${campaignId}** in this server.`
      );
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Optional: Confirm deletion with the user using buttons
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`confirm_delete_campaign_${campaignId}`)
        .setLabel("Confirm Deletion")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("cancel_delete_campaign")
        .setLabel("Cancel")
        .setStyle(ButtonStyle.Secondary)
    );

    const embed = createErrorEmbed(
      "Confirm Deletion ❓",
      `Are you sure you want to delete the campaign **${campaign.campaign_name}** (ID: ${campaign.id})? This will also delete all associated recaps. This action cannot be undone.`
    );

    await interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: true,
    });
  } catch (error) {
    await handleError(
      interaction,
      error,
      "There was an error initiating the campaign deletion."
    );
  }
}
