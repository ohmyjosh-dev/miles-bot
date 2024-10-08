// src/commands/create-recap.ts
import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  GuildMember,
} from "discord.js";
import {
  getCampaignId,
  handleError,
  ensureGuild,
  isValidURL,
  createSuccessEmbed,
  createErrorEmbed,
} from "../utils";
import { getDbConnection } from "../database";
import { DM_ROLE_NAME } from "../defs";

export const data = new SlashCommandBuilder()
  .setName("miles-create-recap")
  .setDescription("Creates a new recap tied to a specific campaign.")
  .addStringOption((option) =>
    option
      .setName("campaign_name")
      .setDescription("The name of the campaign.")
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("recap_title")
      .setDescription("The title of the recap.")
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("recap_link")
      .setDescription("A valid URL link for the recap. https://example.com")
      .setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  // Ensure the command is executed within a guild
  const guildId = await ensureGuild(interaction);
  if (!guildId) return;

  // Check if the user has the "DM" role
  const member = interaction.member as GuildMember;
  const hasDmRole = member.roles.cache.some(
    (role) => role.name === DM_ROLE_NAME
  );
  if (!hasDmRole) {
    const embed = createErrorEmbed(
      "Insufficient Permissions ❌",
      "You need the **DM** role to use this command."
    );
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  // Extract and trim command options
  const campaignName = interaction.options
    .getString("campaign_name", true)
    .trim();
  const recapTitle = interaction.options.getString("recap_title", true).trim();
  const recapLink = interaction.options.getString("recap_link", true).trim();

  // Validate the recap link URL
  if (!isValidURL(recapLink)) {
    const embed = createErrorEmbed(
      "Invalid URL ❌",
      "Please provide a valid URL for the recap link."
    );
    return interaction.reply({ embeds: [embed] });
  }

  try {
    const db = await getDbConnection();

    // Retrieve the campaign ID using the utility function
    const campaignId = await getCampaignId(guildId, campaignName, interaction);
    if (!campaignId) return;

    // Insert the new recap into the database
    await db.run(
      `INSERT INTO milesbot_recaps (guild_id, campaign_id, recap_title, recap_link) VALUES (?, ?, ?, ?)`,
      [guildId, campaignId, recapTitle, recapLink]
    );

    // Count the total number of recaps for the campaign
    const countResult = await db.get<{ count: number }>(
      `SELECT COUNT(*) as count FROM milesbot_recaps WHERE guild_id = ? AND campaign_id = ?`,
      [guildId, campaignId]
    );

    const count = countResult?.count ?? 0;

    // If there are more than 10 recaps, delete the oldest ones
    if (count > 10) {
      // Explicitly type recapsToDelete as an array
      const recapsToDelete: { id: number }[] = await db.all<{ id: number }[]>(
        `SELECT id FROM milesbot_recaps WHERE guild_id = ? AND campaign_id = ? ORDER BY created_at ASC LIMIT ?`,
        [guildId, campaignId, count - 10]
      );

      if (recapsToDelete.length > 0) {
        const deleteIds = recapsToDelete.map((recap) => recap.id);
        const placeholders = deleteIds.map(() => "?").join(",");

        await db.run(
          `DELETE FROM milesbot_recaps WHERE id IN (${placeholders})`,
          deleteIds
        );
      }
    }

    // Create a success embed and reply to the interaction
    const embed = createSuccessEmbed(
      "Recap Created 🎉",
      `Recap **${recapTitle}** added to campaign **${campaignName}**.`
    );
    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    // Handle any errors that occur during the process
    await handleError(
      interaction,
      error,
      "There was an error creating the recap."
    );
  }
}
