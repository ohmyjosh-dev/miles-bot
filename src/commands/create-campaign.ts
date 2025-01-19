// src/commands/create-campaign.ts
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
  getErrorString,
  getSuccessString,
  handleError,
} from "../utils";

export const data = new SlashCommandBuilder()
  .setName(CommandName.milesManageCampaign)
  .setDescription("Creates a new campaign with a title and description.")
  .addStringOption((option) =>
    option
      .setName("campaign_name")
      .setDescription("The name of the campaign.")
      .setRequired(true)
      .setAutocomplete(true),
  )
  .addStringOption((option) =>
    option
      .setName(OptionName.campaignDescription)
      .setDescription("A description of the campaign.")
      .setRequired(true),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  // Ensure the command is executed within a guild
  const guildId = await ensureGuild(interaction);
  if (!guildId) return;

  // Check if the user has the "DM" role
  const member = interaction.member as GuildMember;
  const hasDmRole = member.roles.cache.some(
    (role) => role.name.toLowerCase() === DM_ROLE_NAME.toLowerCase(),
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
  const description = interaction.options
    .getString("description", true)
    .trim()
    .replace(/\\n/g, "\n");

  try {
    const db = await getDbConnection();

    const existingRecord = await db.get(
      `SELECT id FROM campaigns WHERE guild_id = $guild_id AND campaign_name = $campaign_name`,
      { $guild_id: guildId, $campaign_name: campaignName },
    );

    const isUpdate = Boolean(existingRecord);

    const campaignId = existingRecord?.id ?? randomUUID();

    // Insert the new campaign
    await db.run(
      `INSERT INTO campaigns (id, guild_id, campaign_name, description) 
      VALUES ($id, $guild_id, $campaign_name, $description)
      ON CONFLICT(guild_id, campaign_name) DO UPDATE SET
        description = excluded.description;`,
      {
        $id: campaignId,
        $guild_id: guildId,
        $campaign_name: campaignName,
        $description: description,
      },
    );

    const successTitle = isUpdate ? "Campaign Updated" : "Campaign Created";
    const action = isUpdate ? "updated" : "created";

    const embed = createSuccessEmbed(
      getSuccessString(successTitle, { partyPopper: true }),
      `Campaign **${campaignName}** ${action} successfully!\n` +
        `description: ${description}`,
    );
    await interaction.reply({ embeds: [embed] });
  } catch (error: any) {
    if (error.message.includes("UNIQUE constraint failed")) {
      const embed = createErrorEmbed(
        getErrorString("Duplicate Campaign"),
        `A campaign with the name **${campaignName}** already exists.`,
      );
      await interaction.reply({ embeds: [embed] });
    } else {
      await handleError(
        interaction,
        error,
        "There was an error creating or editing the campaign.",
      );
    }
  }
}
