// src/commands/delete-campaign.ts
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  CacheType,
  ChatInputCommandInteraction,
  GuildMember,
  SlashCommandBuilder,
} from "discord.js";
import {
  CANCEL_BUTTON_ID,
  CONFIRM_DELETE_CAMPAIGN,
  DM_ROLE_NAME,
} from "../consts";
import { getDbConnection } from "../database";
import {
  createErrorEmbed,
  ensureGuild,
  getErrorString,
  handleError,
  isValidUUID,
} from "../utils";

export const data = new SlashCommandBuilder()
  .setName("miles-delete-campaign")
  .setDescription(
    "Deletes a specific campaign by its ID along with all associated Information Blocks.",
  )
  .addStringOption((option) =>
    option
      .setName("campaign_id")
      .setDescription("The unique ID of the campaign to delete.")
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

  // Extract and validate the campaign_id option
  const campaignIdInput = interaction.options
    .getString("campaign_id", true)
    .trim();

  if (!isValidUUID(campaignIdInput)) {
    const embed = createErrorEmbed(
      getErrorString("Invalid Campaign ID"),
      "The provided Campaign ID is not a valid number.",
    );
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  try {
    const db = await getDbConnection();

    // Check if the campaign exists and belongs to the guild
    const campaign = await db.get(
      `SELECT * FROM campaigns WHERE id = ? AND guild_id = ?`,
      [campaignIdInput, guildId],
    );

    if (!campaign) {
      const embed = createErrorEmbed(
        getErrorString("Campaign Not Found"),
        `No campaign found with ID **${campaignIdInput}** in this server.`,
      );
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Optional: Confirm deletion with the user using buttons
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`${CONFIRM_DELETE_CAMPAIGN}${campaignIdInput}`)
        .setLabel("Confirm Deletion")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(CANCEL_BUTTON_ID)
        .setLabel("Cancel")
        .setStyle(ButtonStyle.Secondary),
    );

    const embed = createErrorEmbed(
      "Confirm Deletion ❓",
      `Are you sure you want to delete the campaign **${campaign.campaign_name}** (ID: ${campaign.id})? This will also delete all associated Information Blocks. This action cannot be undone.`,
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
      "There was an error initiating the campaign deletion.",
    );
  }
}

export async function handleDeleteConfirmation(
  interaction: ButtonInteraction<CacheType>,
) {
  const guildId = interaction.guildId;
  if (!guildId) return;

  const campaignId = interaction.customId.split("_").pop() as string;

  try {
    const db = await getDbConnection();

    const campaign = await db.get(
      `SELECT campaign_name FROM campaigns WHERE id = $campaign_id AND guild_id = $guild_id`,
      { $campaign_id: campaignId, $guild_id: guildId },
    );

    if (!campaign?.campaign_name) {
      const embed = createErrorEmbed(
        getErrorString("Campaign Not Found"),
        `No campaign found with ID **${campaignId}** in this server.`,
      );
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Delete the campaign and associated Information Blocks
    await db.run(
      `DELETE FROM campaigns WHERE id = $campaign_id AND guild_id = $guild_id`,
      {
        $campaign_id: campaignId,
        $guild_id: guildId,
      },
    );
    await db.run(`DELETE FROM campaign_info WHERE campaign_id = $campaign_id`, {
      $campaign_id: campaignId,
    });

    const embed = createErrorEmbed(
      `✅ Campaign with \`name: ${campaign.campaign_name}\` has been deleted along with all associated Info`,
    );

    await interaction.reply({
      embeds: [embed],
      ephemeral: false,
    });
  } catch (error) {
    const embed = createErrorEmbed(getErrorString("An error has occurred"));

    await interaction.reply({ embeds: [embed] });
  }
}
