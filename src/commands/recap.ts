// src/commands/recap.ts
import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import {
  getCampaignId,
  handleError,
  ensureGuild,
  createErrorEmbed,
} from "../utils";
import { getDbConnection } from "../database";
import { EmbedBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("miles-recap")
  .setDescription("Retrieves the latest recap entry.")
  .addStringOption((option) =>
    option
      .setName("campaign_name")
      .setDescription("The name of the campaign.")
      .setRequired(true)
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
      [guildId, campaignId]
    );

    if (!recap) {
      const embed = createErrorEmbed(
        "No Recaps Found ❌",
        `No recaps found for campaign **${campaignName}**.`
      );
      return interaction.reply({ embeds: [embed] });
    }

    const embed = new EmbedBuilder()
      .setTitle(recap.recap_title)
      .setURL(recap.recap_link)
      .setTimestamp(new Date(recap.created_at))
      .setFooter({ text: `Campaign: ${campaignName}` })
      .setColor(0x00ae86);

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    await handleError(
      interaction,
      error,
      "There was an error retrieving the recap."
    );
  }
}
