// src/commands/list-campaigns.ts
import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
} from "discord.js";
import { getDbConnection } from "../database";

export const data = new SlashCommandBuilder()
  .setName("miles-list-campaigns")
  .setDescription("Lists all campaigns in this server.");

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
    const campaigns = await db.all(
      `SELECT campaign_name, description FROM campaigns WHERE guild_id = ?`,
      [guildId]
    );

    if (campaigns.length === 0) {
      const embed = new EmbedBuilder()
        .setTitle("No Campaigns Found ❌")
        .setDescription("There are no campaigns in this server.")
        .setColor(0xffa500)
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    const embed = new EmbedBuilder()
      .setTitle("Campaigns 📜")
      .setColor(0x00ae86)
      .setTimestamp();

    campaigns.forEach((campaign) => {
      embed.addFields({
        name: campaign.campaign_name,
        value: campaign.description,
        inline: false,
      });
    });

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error(error);
    const embed = new EmbedBuilder()
      .setTitle("Error ❌")
      .setDescription("There was an error retrieving the campaigns.")
      .setColor(0xff0000)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
}
