// src/utils.ts
import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  InteractionReplyOptions,
} from "discord.js";
import { Database } from "sqlite";
import { getDbConnection } from "./database";

/**
 * Ensures that the interaction is within a guild and returns the guild ID.
 * @param interaction The command interaction.
 * @returns The guild ID if present, otherwise null.
 */
export async function ensureGuild(
  interaction: ChatInputCommandInteraction
): Promise<string | null> {
  const guildId = interaction.guildId;
  if (!guildId) {
    await interaction.reply({
      content: "This command can only be used within a server.",
      ephemeral: true,
    });
    return null;
  }
  return guildId;
}

/**
 * Retrieves the campaign ID by name within a guild.
 * @param guildId The ID of the guild.
 * @param campaignName The name of the campaign.
 * @param interaction The command interaction for error replies.
 * @returns The campaign ID if found, otherwise null.
 */
export async function getCampaignId(
  guildId: string,
  campaignName: string,
  interaction: ChatInputCommandInteraction
): Promise<number | null> {
  try {
    const db: Database = await getDbConnection();
    const campaign = await db.get<{ id: number }>(
      `SELECT id FROM campaigns WHERE guild_id = ? AND campaign_name = ?`,
      [guildId, campaignName]
    );

    if (!campaign) {
      await interaction.reply(`Campaign **${campaignName}** does not exist.`);
      return null;
    }

    return campaign.id;
  } catch (error) {
    console.error(error);
    await interaction.reply("There was an error retrieving the campaign.");
    return null;
  }
}

/**
 * Validates whether a string is a valid URL.
 * @param urlString The URL string to validate.
 * @returns Boolean indicating if the URL is valid.
 */
export function isValidURL(urlString: string): boolean {
  try {
    new URL(urlString);
    return true;
  } catch {
    return false;
  }
}

/**
 * Handles errors by logging and replying to the interaction.
 * @param interaction The command interaction.
 * @param error The error object.
 * @param customMessage Optional custom message for the user.
 */
export async function handleError(
  interaction: ChatInputCommandInteraction,
  error: any,
  customMessage: string = "There was an error processing your request."
) {
  console.error(error);
  if (interaction.replied || interaction.deferred) {
    await interaction.followUp({
      content: customMessage,
      ephemeral: true,
    });
  } else {
    await interaction.reply({
      content: customMessage,
      ephemeral: true,
    });
  }
}

/**
 * Creates a standardized error embed.
 * @param title The title of the embed.
 * @param description The description/content of the embed.
 * @returns An EmbedBuilder instance.
 */
export function createErrorEmbed(
  title: string,
  description: string
): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(0xff0000) // Red color
    .setTimestamp();
}

/**
 * Creates a standardized success embed.
 * @param title The title of the embed.
 * @param description The description/content of the embed.
 * @returns An EmbedBuilder instance.
 */
export function createSuccessEmbed(
  title: string,
  description?: string
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setColor(0x00ae86) // Green color
    .setTimestamp();

  if (description) {
    embed.setDescription(description);
  }

  return embed;
}
