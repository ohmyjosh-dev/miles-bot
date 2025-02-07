// src/utils.ts
import {
  ChatInputCommandInteraction,
  ColorResolvable,
  EmbedBuilder,
  GuildMember,
} from "discord.js";
import { Database } from "sqlite";
import { BOT_ENV } from "../config";
import {
  DM_ROLE_NAME,
  ERROR_COLOR,
  MILES_RANDOM_RESPONSES,
  SUCCESS_COLOR,
  VALID_UUID_REGEX,
} from "../consts";
import { getDbConnection } from "../database";
import { environment } from "../defs";
import { ErrorCode } from "../hello-miles/hello-miles.constants";

export const isDevelopment = BOT_ENV === environment.dev;

/**
 * Ensures that the interaction is within a guild and returns the guild ID.
 * @param interaction The command interaction.
 * @returns The guild ID if present, otherwise null.
 */
export async function ensureGuild(
  interaction: ChatInputCommandInteraction,
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
  interaction: ChatInputCommandInteraction,
): Promise<number | null> {
  try {
    const db: Database = await getDbConnection();
    const campaign = await db.get<{ id: number }>(
      `SELECT id FROM campaigns WHERE guild_id = ? AND campaign_name = ?`,
      [guildId, campaignName],
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

export function isValidUUID(uuid: string): boolean {
  const uuidRegex = VALID_UUID_REGEX;

  return uuidRegex.test(uuid);
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
  customMessage: string = "There was an error processing your request.",
): Promise<void> {
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
  description?: string,
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(customizeText(title))
    .setColor(ERROR_COLOR)
    .setTimestamp();

  if (description) {
    embed.setDescription(description);
  }

  return embed;
}

/**
 * Creates a standardized success embed.
 * @param title The title of the embed.
 * @param description The description/content of the embed.
 * @returns An EmbedBuilder instance.
 */
export function createSuccessEmbed(
  title: string,
  description?: string,
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(customizeText(title))
    .setColor(SUCCESS_COLOR)
    .setTimestamp();

  if (description) {
    embed.setDescription(description);
  }

  return embed;
}

export function createEmbed(
  title: string,
  options?: {
    description?: string;
    color?: ColorResolvable;
    showTimeStamp?: boolean;
  },
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(customizeText(title))
    .setColor(options?.color ?? SUCCESS_COLOR);

  if (options?.description) {
    embed.setDescription(options.description);
  }

  if (options?.showTimeStamp) {
    embed.setTimestamp();
  }

  return embed;
}

export function customizeFooter(props: { text: string }): { text: string } {
  return { text: customizeText(props.text) };
}

/**
 * Does bot-side customization of text as needed
 *
 * @param text string
 * @returns string
 */
export function customizeText(
  text: string,
  options?: { append?: boolean },
): string {
  if (isDevelopment) {
    if (options?.append) {
      return `${text} Please be aware that I am in Developer Mode. Data will be incorrect and not all functions may work. | ⚠️ ${BOT_ENV}`;
    }

    return `⚠️ MAINTENANCE MODE: This data is from a test database and is not accurate \n\n${text} | ${BOT_ENV}`;
  }

  return text;
}

/**
 * gets a random string from an array
 *
 * @param arr string[]
 * @returns string
 */
export function getRandomString(arr: string[]): string {
  if (!arr.length) {
    return ""; // or handle the empty array case as needed
  }

  const randomIndex = Math.floor(Math.random() * arr.length);
  return arr[randomIndex];
}

export function getPingResponse(text: string): string {
  const response = getRandomString(MILES_RANDOM_RESPONSES);

  // This will mention the user who called the command
  return `${text} ${response}`;
}

export function getErrorString(text: string): string {
  return `❌ ${text}`;
}

export function getSuccessString(
  text: string,
  options?: { partyPopper?: boolean },
): string {
  return `${options?.partyPopper ? "🎉" : "✅"} ${text}`;
}

export function hasDmRole(member: GuildMember): boolean {
  return member.roles.cache.some(
    (role) => role.name.toLowerCase() === DM_ROLE_NAME.toLowerCase(),
  );
}

export function getErrorStringWithCode(
  errorCode: ErrorCode,
  text?: string,
): string {
  let errorText = "Something went wrong.";

  if (text?.trim().length) {
    errorText = text;
  }

  return getErrorString(`${errorText} - Error Code: ${errorCode}`);
}
