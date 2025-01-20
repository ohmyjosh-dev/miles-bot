// src/utils/campaign-helpers.ts
import { ButtonInteraction, ChatInputCommandInteraction } from "discord.js";
import { getDbConnection } from "../database";
import { createErrorEmbed, createSuccessEmbed, getErrorString } from "./utils";

export async function sendCampaignDetails(
  campaignName: string,
  guildId: string,
  showIds: boolean,
  interaction: ChatInputCommandInteraction | ButtonInteraction,
): Promise<void> {
  try {
    const db = await getDbConnection();
    // Query to get the campaign by name and guild ID
    const campaign = await db.get(
      `SELECT id, campaign_name, description 
       FROM campaigns 
       WHERE guild_id = $guild_id AND campaign_name = $campaign_name`,
      { $guild_id: guildId, $campaign_name: campaignName },
    );

    if (!campaign) {
      const embed = createErrorEmbed(
        getErrorString("Campaign Not Found"),
        `No campaign with the name **${campaignName}** was found in this server.`,
      );
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    // Retrieve additional info for this campaign from the campaign_info table.
    const campaignInfo = await db.all(
      `SELECT id, title, description, link, sort_order 
       FROM campaign_info 
       WHERE campaign_id = $campaign_id 
       ORDER BY CASE WHEN sort_order = -1 THEN 1 ELSE 0 END, sort_order ASC`,
      { $campaign_id: campaign.id },
    );

    // Build the embed with campaign details
    const embed = createSuccessEmbed(`${campaign.campaign_name}`);
    embed.setDescription(
      `${campaign.description}` +
        (showIds ? `\n\`Campaign id: ${campaign.id}\`` : ""),
    );

    if (campaignInfo.length > 0) {
      campaignInfo.forEach((info: any) => {
        const value =
          (info.description ? `${info.description}` : "") +
          (info.link ? `\n${info.link}` : "") +
          (showIds ? `\n\`info id: ${info.id}\`` : "");
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

    // Reply with the embed
    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    const embed = createErrorEmbed(
      "Error ❌",
      "There was an error retrieving the campaign details.",
    );
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
}
