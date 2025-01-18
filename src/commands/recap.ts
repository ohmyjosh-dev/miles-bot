// src/commands/recap.ts
import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import {
  getCampaignId,
  handleError,
  ensureGuild,
  createErrorEmbed,
  createSuccessEmbed,
  customizeFooter,
} from "../utils";
import { getDbConnection } from "../database";

export const data = new SlashCommandBuilder()
  .setName("miles-recap")
  .setDescription("Retrieves the latest recap entry.")
  .addStringOption((option) =>
    option
      .setName("campaign_name")
      .setDescription("The name of the campaign.")
      .setRequired(true),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const guildId = await ensureGuild(interaction);
  if (!guildId) return;

  const campaignName = interaction.options
    .getString("campaign_name", true)
    .trim();

  try {
    const db = await getDbConnection();

    // Get the campaign ID using utility function
    const campaignId = await getCampaignId(guildId, campaignName, interaction);
    if (!campaignId) return;

    // Get the latest recap
    const recap = await db.get(
      `SELECT * FROM milesbot_recaps WHERE guild_id = ? AND campaign_id = ? ORDER BY created_at DESC LIMIT 1`,
      [guildId, campaignId],
    );

    const campaign = await db.get(
      `SELECT * FROM campaigns WHERE guild_id = ? AND id = ?`,
      [guildId, campaignId],
    );

    if (!recap) {
      const embed = createErrorEmbed(
        "No Recaps Found ❌",
        `No recaps found for campaign **${campaignName}**.`,
      );
      return interaction.reply({ embeds: [embed] });
    }

    const embed = createSuccessEmbed(recap.recap_title);

    embed.setURL(recap.recap_link);
    embed.setTimestamp(new Date(recap.created_at));
    embed.setFooter(customizeFooter({ text: `Campaign: ${campaignName}` }));
    embed.addFields({
      name: "metadata:",
      value:
        `[See all recaps](${campaign.recap_master_link})\n` +
        `\`id: ${recap.id}\``,
      inline: true,
    });

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    await handleError(
      interaction,
      error,
      "There was an error retrieving the recap.",
    );
  }
}
