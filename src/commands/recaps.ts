import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
} from "discord.js";
import { getDbConnection } from "../database";
import { createSuccessEmbed } from "../utils";

export const data = new SlashCommandBuilder()
  .setName("miles-recaps")
  .setDescription("Retrieves the latest 10 recap entries.")
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

    // Get the latest 10 recaps
    const recaps = await db.all(
      `SELECT * FROM milesbot_recaps WHERE guild_id = ? AND campaign_id = ? ORDER BY created_at DESC LIMIT 10`,
      [guildId, campaignId]
    );

    if (recaps.length === 0) {
      return interaction.reply(
        `No recaps found for campaign **${campaignName}**.`
      );
    }

    const embed = createSuccessEmbed(`Latest Recaps for ${campaignName}`);
    embed.setTitle(`Latest Recaps for ${campaignName}`);
    embed.setColor(0x00ae86);
    embed.setTimestamp();

    recaps.forEach((recap) => {
      embed.addFields({
        name: recap.recap_title,
        value: `[Open Recap](${recap.recap_link})\n` + `\`id: ${recap.id}\``,
      });
    });

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error(error);
    await interaction.reply("There was an error retrieving the recaps.");
  }
}
