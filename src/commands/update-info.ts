// src/commands/update-info.ts
import { randomUUID } from "crypto";
import {
  ChatInputCommandInteraction,
  GuildMember,
  SlashCommandBuilder,
} from "discord.js";
import { DM_ROLE_NAME } from "../consts";
import { getDbConnection } from "../database";
import { CommandName, OptionName } from "../defs";
import {
  createErrorEmbed,
  createSuccessEmbed,
  ensureGuild,
  getCampaignId,
  getErrorString,
  getSuccessString,
  handleError,
  isValidURL,
} from "../utils";

export const data = new SlashCommandBuilder()
  .setName(CommandName.milesUpdateInfo)
  .setDescription("Adds or Edits information for a specific campaign.")
  .addStringOption((option) =>
    option
      .setName(OptionName.campaignName)
      .setDescription("The name of the campaign.")
      .setRequired(true)
      .setAutocomplete(true),
  )
  .addStringOption((option) =>
    option
      .setName(OptionName.infoTitle)
      .setDescription(
        "The title of the information block. Provide the existing title to edit it if it already exists.",
      )
      .setRequired(true)
      .setAutocomplete(true),
  )
  .addStringOption((option) =>
    option
      .setName(OptionName.infoDescription)
      .setDescription("OPTIONAL: The description of the information block")
      .setRequired(false),
  )
  .addStringOption((option) =>
    option
      .setName(OptionName.infoLink)
      .setDescription(
        "OPTIONAL: A valid URL link for the information block. https://example.com",
      )
      .setRequired(false),
  )
  .addNumberOption((option) =>
    option
      .setName(OptionName.sortOrder)
      .setDescription(
        "OPTIONAL: If you care about the order of the information blocks, you can specify a number here.",
      )
      .setRequired(false),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  // Ensure the command is executed within a guild
  const guildId = await ensureGuild(interaction);
  if (!guildId) return;

  // Check if the user has the "DM" role
  const member = interaction.member as GuildMember;
  const hasDmRole = member.roles.cache.some(
    (role) => role.name === DM_ROLE_NAME,
  );
  if (!hasDmRole) {
    const embed = createErrorEmbed(
      getErrorString("Insufficient Permissions"),
      "You need the **DM** role to use this command.",
    );
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  // Extract and trim command options
  const campaignName = interaction.options
    .getString("campaign_name", true)
    .trim();

  const infoTitle = interaction.options.getString("info_title", true).trim();
  const infoDescription = interaction.options
    .getString("info_description", false)
    ?.trim();
  const infoLink = interaction.options.getString("info_link", false)?.trim();
  const sortOrder = interaction.options.getNumber("sort_order", false);

  // Validate the recap link URL
  if (infoLink && !isValidURL(infoLink)) {
    const embed = createErrorEmbed(
      getErrorString("Invalid URL"),
      "Please provide a valid URL for the recap link.",
    );
    return interaction.reply({ embeds: [embed] });
  }

  try {
    const db = await getDbConnection();

    // Retrieve the campaign ID using the utility function
    const campaignId = await getCampaignId(guildId, campaignName, interaction);
    if (!campaignId) return;

    const existingRecord = await db.get(
      `SELECT id FROM campaign_info WHERE guild_id = $guild_id AND title = $title`,
      { $guild_id: guildId, $title: infoTitle },
    );

    const isUpdate = Boolean(existingRecord);

    const infoId = existingRecord?.id ?? randomUUID();

    // Insert the new recap into the database
    await db.run(
      `INSERT INTO campaign_info (id, guild_id, campaign_id, title, description, link, sort_order)
      VALUES ($id, $guild_id, $campaign_id, $title, coalesce($description, ''), coalesce($link, ''), coalesce($sort_order, -1))
      ON CONFLICT(guild_id, title) DO UPDATE SET
        description = CASE WHEN $description IS NULL THEN campaign_info.description ELSE $description END,
        link = CASE WHEN $link IS NULL THEN campaign_info.link ELSE $link END,
        sort_order = CASE WHEN $sort_order IS NULL THEN campaign_info.sort_order ELSE $sort_order END`,
      {
        $id: infoId,
        $guild_id: guildId,
        $campaign_id: campaignId,
        $title: infoTitle,
        $description: infoDescription ?? null,
        $link: infoLink ?? null,
        $sort_order: sortOrder ?? null,
      },
    );

    const successTitle = isUpdate
      ? `${infoTitle} Updated`
      : `${infoTitle} Created`;

    const successsMessage = isUpdate
      ? `Information block for **${infoTitle}** updated in campaign **${campaignName}**.`
      : `Information block for **${infoTitle}** added to campaign **${campaignName}**.`;

    // Create a success embed and reply to the interaction
    const embed = createSuccessEmbed(
      getSuccessString(successTitle, { partyPopper: true }),
      successsMessage,
    );
    await interaction.reply({ embeds: [embed] });
  } catch (error: any) {
    if (error.message.includes("UNIQUE constraint failed")) {
      const embed = createErrorEmbed(
        getErrorString("Duplicate Info Title"),
        `An information block with the name **${infoTitle}** already exists.`,
      );
      await interaction.reply({ embeds: [embed] });
    } else {
      await handleError(
        interaction,
        error,
        getErrorString("There was an error creating the information block."),
      );
    }
  }
}
