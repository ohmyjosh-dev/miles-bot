// src/commands/list-campaigns.ts
import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { getDbConnection } from "../database";
import { CommandName, OptionName } from "../defs";
import { sendCampaignDetails, sendCampaigns } from "../utils/campaign-helpers";
import { createErrorEmbed } from "../utils/utils";

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
      await sendCampaigns(guildId, showIdsOption, interaction);

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
