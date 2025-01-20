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
import {
  createErrorEmbed,
  createSuccessEmbed,
  getErrorString,
} from "../utils/utils";

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
      // Query to get one campaign by name and guild_id
      const campaign = await db.get(
        `SELECT id, campaign_name, description 
         FROM campaigns 
         WHERE guild_id = $guild_id AND campaign_name = $campaign_name`,
        { $guild_id: guildId, $campaign_name: campaignNameOption },
      );

      if (!campaign) {
        const embed = createErrorEmbed(
          getErrorString("Campaign Not Found"),
          `No campaign with the name **${campaignNameOption}** was found in this server.`,
        );

        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      // Retrieve additional info for this campaign from the campaign_info table.
      // Sort order logic (note to self because i don't know sql)
      // -1 show last. 0 show first. 1 show second. 2 show third. etc.
      const campaignInfo = await db.all(
        `SELECT id, title, description, link, sort_order 
         FROM campaign_info 
         WHERE campaign_id = $campaign_id 
         ORDER BY CASE WHEN sort_order = -1 THEN 1 ELSE 0 END, sort_order ASC`,
        { $campaign_id: campaign.id },
      );

      // Build the embed with campaign and its details
      const embed = createSuccessEmbed(`${campaign.campaign_name}`);
      embed.setDescription(
        `${campaign.description}` +
          (showIdsOption ? `\n\`Campaign id: ${campaign.id}\`` : ""),
      );

      if (campaignInfo.length > 0) {
        // Add each info block as a field in the embed.
        campaignInfo.forEach((info) => {
          const value =
            (info.description ? `${info.description}` : "") +
            (info.link ? `\n${info.link}` : "") +
            (showIdsOption ? `\n\`info id: ${info.id}\`` : "");

          embed.addFields({
            name: info.title,
            value: value || "No additional information.",
            inline: false,
          });
        });
      } else {
        embed.addFields({
          name: "No Information",
          value: "This campaign does not have additional information.",
        });
      }

      return interaction.reply({ embeds: [embed] });
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
