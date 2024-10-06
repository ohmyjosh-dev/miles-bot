// src/commands/create-campaign.ts
import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  GuildMember,
} from "discord.js";
import { getDbConnection } from "../database";
import {
  handleError,
  ensureGuild,
  createSuccessEmbed,
  createErrorEmbed,
} from "../utils";
import { DM_ROLE_NAME } from "../defs";

export const data = new SlashCommandBuilder()
  .setName("miles-create-campaign")
  .setDescription("Creates a new campaign with a title and description.")
  .addStringOption((option) =>
    option
      .setName("campaign_name")
      .setDescription("The name of the campaign.")
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("description")
      .setDescription("A description of the campaign.")
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
  const description = interaction.options.getString("description", true).trim();

  try {
    const db = await getDbConnection();

    // Insert the new campaign
    await db.run(
      `INSERT INTO campaigns (guild_id, campaign_name, description) VALUES (?, ?, ?)`,
      [guildId, campaignName, description]
    );

    const embed = createSuccessEmbed(
      "Campaign Created 🎉",
      `Campaign **${campaignName}** created successfully!`
    );
    await interaction.reply({ embeds: [embed] });
  } catch (error: any) {
    if (error.message.includes("UNIQUE constraint failed")) {
      const embed = createErrorEmbed(
        "Duplicate Campaign ❌",
        `A campaign with the name **${campaignName}** already exists.`
      );
      await interaction.reply({ embeds: [embed] });
    } else {
      await handleError(
        interaction,
        error,
        "There was an error creating the campaign."
      );
    }
  }
}
