// src/commands/create-recap.ts
import { randomUUID } from "crypto";
import {
  ChatInputCommandInteraction,
  GuildMember,
  SlashCommandBuilder,
} from "discord.js";
import { DM_ROLE_NAME } from "../consts";
import { getDbConnection } from "../database";
import {
  createErrorEmbed,
  createSuccessEmbed,
  ensureGuild,
  getCampaignId,
  getErrorString,
  handleError,
  isValidURL,
} from "../utils";

export const data = new SlashCommandBuilder()
  .setName("miles-update-info")
  .setDescription("Adds or Edits information for a specific campaign.")
  .addStringOption((option) =>
    option
      .setName("campaign_name")
      .setDescription("The name of the campaign.")
      .setRequired(true),
  )
  .addStringOption((option) =>
    option
      .setName("info_title")
      .setDescription("The title of the information block")
      .setRequired(true),
  )
  .addStringOption((option) =>
    option
      .setName("info_desc")
      .setDescription("OPTIONAL: The description of the information block")
      .setRequired(false),
  )
  .addStringOption((option) =>
    option
      .setName("info_link")
      .setDescription(
        "OPTIONAL: A valid URL link for the information block. https://example.com",
      )
      .setRequired(false),
  )
  .addNumberOption((option) =>
    option
      .setName("sort_order")
      .setDescription(
        "OPTIONAL: If you care about the order of the information blocks, you can specify a number here.",
      )
      .setRequired(false),
  )
  .addStringOption((option) =>
    option
      .setName("existing_info_title")
      .setDescription(
        "OPTIONAL: Only include this to update an existing information block",
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
  const infoDesc = interaction.options.getString("recap_desc", false)?.trim();
  const infoLink = interaction.options.getString("info_link", false)?.trim();
  const sortOrder = interaction.options.getNumber("sort_order", false);
  const existingInfoTitle = interaction.options
    .getString("existing_info_title", false)
    ?.trim();

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

    const newInfoId = randomUUID();

    // Retrieve the campaign ID using the utility function
    const campaignId = await getCampaignId(guildId, campaignName, interaction);
    if (!campaignId) return;

    // Insert the new recap into the database
    await db.run(
      `INSERT INTO milesbot_recaps (id, guild_id, campaign_id, title, desc, link) VALUES (?, ?, ?, ?, ?, ?)`,
      [newInfoId, guildId, campaignId, infoTitle, infoDesc, infoLink],
    );

    // Create a success embed and reply to the interaction
    const embed = createSuccessEmbed(
      "Recap Created 🎉",
      `Recap **${infoTitle}** added to campaign **${campaignName}**.`,
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
        "There was an error creating the campaign.",
      );
    }
  }
}
