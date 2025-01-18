// src/commands/list-campaigns.ts
import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { getDbConnection } from "../database";
import { CommandName, OptionName } from "../defs";
import { createErrorEmbed, createSuccessEmbed, getErrorString } from "../utils";

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
      .getString("campaign_name", false)
      ?.trim();

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
      const campaignInfo = await db.all(
        `SELECT id, title, description, link, sort_order 
         FROM campaign_info 
         WHERE campaign_id = $campaign_id 
         ORDER BY sort_order ASC`,
        { $campaign_id: campaign.id },
      );

      // Build the embed with campaign and its details
      const embed = createSuccessEmbed(`Campaign: ${campaign.campaign_name}`);
      embed.setDescription(campaign.description);

      if (campaignInfo.length > 0) {
        // Add each info block as a field in the embed.
        campaignInfo.forEach((info) => {
          embed.addFields({
            name: info.title,
            value:
              (info.description ? `${info.description}\n` : "") +
              (info.link ? `${info.link}\n` : "") +
              `\`info id: ${info.id}\``,
            inline: false,
          });
        });
        embed.addFields({
          name: "Campaign Id",
          value: `\`${campaign.id}\``,
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

      const embed = createSuccessEmbed("Campaigns 📜");

      campaigns.forEach((campaign) => {
        embed.addFields({
          name: campaign.campaign_name,
          value: `${campaign.description}\n` + `\`id: ${campaign.id}\``,
          inline: false,
        });
      });

      return interaction.reply({ embeds: [embed] });
    }
  } catch (error) {
    const embed = createErrorEmbed(
      "Error ❌",
      "There was an error retrieving the campaigns.",
    );

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
}
