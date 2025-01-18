// src/commands/list-campaigns.ts
import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { getDbConnection } from "../database";
import { createErrorEmbed, createSuccessEmbed } from "../utils";

export const data = new SlashCommandBuilder()
  .setName("miles-campaigns")
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
      `SELECT id, campaign_name, description FROM campaigns WHERE guild_id = ?`,
      [guildId],
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
        value:
          `${campaign.description}\n` +
          `[See All Recaps](${campaign.recap_master_link})\n` +
          `\`id: ${campaign.id}\``,
        inline: false,
      });
    });

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    const embed = createErrorEmbed(
      "Error ❌",
      "There was an error retrieving the campaigns.",
    );

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
}
