import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
} from "discord.js";
import { getDbConnection } from "../database";

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
  const campaignName = interaction.options
    .getString("campaign_name", true)
    .trim();
  const guildId = interaction.guildId;

  if (!guildId) {
    return interaction.reply("This command can only be used within a server.");
  }

  try {
    const db = await getDbConnection();

    // Get the campaign ID
    const campaign = await db.get(
      `SELECT id FROM campaigns WHERE guild_id = ? AND campaign_name = ?`,
      [guildId, campaignName]
    );

    if (!campaign) {
      return interaction.reply(`Campaign **${campaignName}** does not exist.`);
    }

    const campaignId = campaign.id;

    // Get the latest recap
    const recap = await db.get(
      `SELECT * FROM milesbot_recaps WHERE guild_id = ? AND campaign_id = ? ORDER BY created_at DESC LIMIT 1`,
      [guildId, campaignId]
    );

    if (!recap) {
      return interaction.reply(
        `No recaps found for campaign **${campaignName}**.`
      );
    }

    const embed = new EmbedBuilder()
      .setTitle(recap.recap_title)
      .setURL(recap.recap_link)
      .setTimestamp(new Date(recap.created_at))
      .setFooter({ text: `Campaign: ${campaignName}` });

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error(error);
    await interaction.reply("There was an error retrieving the recap.");
  }
}
