// src/commands/list-campaigns.ts
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import { VIEW_CAMPAIGN_BUTTON_ID_PREFIX } from "../consts";
import { getDbConnection } from "../database";
import { CommandName, OptionName } from "../defs";
import { sendCampaignDetails } from "../utils/campaign-helpers";
import { createErrorEmbed, createSuccessEmbed } from "../utils/utils";

export const data = new SlashCommandBuilder()
  .setName(CommandName.milesCampaigns)
  .setDescription("Lists campaigns")
  .addStringOption((option) =>
    option
      .setName(OptionName.campaignName)
      .setDescription(
        "OPTIONAL: Include the name of the campaign to return additional campaign details.",
      )
      .setRequired(false)
      .setAutocomplete(true),
  )
  .addBooleanOption((option) =>
    option
      .setName(OptionName.showIds)
      .setDescription(
        "OPTIONAL: Show the ids of the campaigns and info blocks.",
      )
      .setRequired(false),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId;

  if (!guildId) {
    return interaction.reply({
      content: "This command can only be used within a server.",
      ephemeral: true,
    });
  }

  try {
    const db = await getDbConnection();

    const campaignNameOption = interaction.options
      .getString(OptionName.campaignName, false)
      ?.trim();

    const showIdsOption =
      interaction.options.getBoolean(OptionName.showIds, false) ?? false;

    if (campaignNameOption) {
      await sendCampaignDetails(
        campaignNameOption,
        guildId,
        showIdsOption,
        interaction,
      );
    } else {
      const campaigns = await db.all(
        `SELECT id, campaign_name, description FROM campaigns WHERE guild_id = $guild_id`,
        { $guild_id: guildId },
      );

      if (campaigns.length === 0) {
        const embed = createErrorEmbed(
          "No Campaigns Found ❌",
          "There are no campaigns in this server.",
        );

        return interaction.reply({ embeds: [embed] });
      }

      for (const campaign of campaigns) {
        // Create embed for each campaign:
        const embed = createSuccessEmbed(campaign.campaign_name);
        embed.setDescription(
          `${campaign.description}` +
            (showIdsOption ? `\n\`id: ${campaign.id}\`` : ""),
        );

        // Create a button for the campaign:
        const button = new ButtonBuilder()
          .setLabel(`View ${campaign.campaign_name}`)
          .setStyle(ButtonStyle.Primary)
          .setCustomId(
            `${VIEW_CAMPAIGN_BUTTON_ID_PREFIX}${campaign.campaign_name}`,
          );

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

        // Send a separate message for each campaign
        if (
          interaction.channel &&
          "send" in interaction.channel &&
          typeof interaction.channel.send === "function"
        ) {
          await interaction.channel?.send({
            embeds: [embed],
            components: [row],
          });
        }
      }

      return interaction.reply({ content: "Getting Campaigns..." });
    }
  } catch (error) {
    const embed = createErrorEmbed(
      "Error ❌",
      "There was an error retrieving the campaigns.",
    );

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
}
