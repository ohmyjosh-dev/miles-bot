// src/commands/delete-campaign.ts
import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  GuildMember,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ButtonInteraction,
  CacheType,
} from "discord.js";
import {
  handleError,
  ensureGuild,
  createErrorEmbed,
  createSuccessEmbed,
} from "../utils";
import { getDbConnection } from "../database";
import {
  CANCEL_BUTTON_ID,
  CONFIRM_DELETE_CAMPAIGN,
  DM_ROLE_NAME,
} from "../consts";

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
        .setCustomId(`${CONFIRM_DELETE_CAMPAIGN}${campaignId}`)
        .setLabel("Confirm Deletion")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(CANCEL_BUTTON_ID)
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

export async function handleDeleteConfirmation(
  interaction: ButtonInteraction<CacheType>
) {
  const guildId = interaction.guildId;
  if (!guildId) return;

  const campaignId = parseInt(
    interaction.customId.split("_").pop() as string,
    10
  );

  try {
    const db = await getDbConnection();

    const campaign = await db.get(
      `SELECT campaign_name FROM campaigns WHERE id = ? AND guild_id = ?`,
      [campaignId, guildId]
    );

    if (!campaign?.campaign_name) {
      const embed = createErrorEmbed(
        "Campaign Not Found ❌",
        `No campaign found with ID **${campaignId}** in this server.`
      );
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Delete the campaign and associated recaps
    await db.run(`DELETE FROM campaigns WHERE id = ? AND guild_id = ?`, [
      campaignId,
      guildId,
    ]);
    await db.run(`DELETE FROM milesbot_recaps WHERE campaign_id = ?`, [
      campaignId,
    ]);

    const embed = createErrorEmbed(
      `Campaign with \`name: ${campaign.campaign_name}\` has been deleted along with all associated recaps✅`
    );

    await interaction.reply({
      embeds: [embed],
      ephemeral: false,
    });
  } catch (error) {
    const embed = createErrorEmbed("An error has occurred ❌");

    await interaction.reply({ embeds: [embed] });
  }
}
