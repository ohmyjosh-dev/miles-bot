import { SlashCommandBuilder } from "@discordjs/builders";
import { ChatInputCommandInteraction, GuildMember } from "discord.js";
import { DM_ROLE_NAME, ErrorCode } from "../consts";
import { getDbConnection } from "../database";
import { getErrorString, getSuccessString } from "../utils/utils";

export const command = {
  data: new SlashCommandBuilder()
    .setName("miles-add-reminder")
    .setDescription("Add a new reminder")
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("Name of the reminder")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("description")
        .setDescription("Description for the reminder")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("cron")
        .setDescription("Cron expression for the reminder")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("channel")
        .setDescription("Channel ID to send the reminder")
        .setRequired(true),
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    // Ensure only a DM can run this command
    const member = interaction.member;
    if (!member || !("roles" in member)) {
      await interaction.reply(
        getErrorString("This command can only be used by a DM."),
      );
      return;
    }

    const guildMember = member as GuildMember;
    if (!guildMember.roles.cache.some((role) => role.name === DM_ROLE_NAME)) {
      await interaction.reply(
        getErrorString("This command can only be used by a DM."),
      );
      return;
    }

    const name = interaction.options.getString("name", true);
    const description = interaction.options.getString("description", true);
    const cron = interaction.options.getString("cron", true);
    const channel = interaction.options.getString("channel", true);
    const guildId = interaction.guild?.id;

    if (!guildId) {
      await interaction.reply(
        getErrorString("This command can only be used in a guild."),
      );
      return;
    }

    try {
      const db = await getDbConnection();
      await db.run(
        `INSERT INTO reminders (guild_id, name, channel_id, cron_expression, description)
         VALUES ($guildId, $name, $channel, $cron, $description)`,
        {
          $guildId: guildId,
          $name: name,
          $channel: channel,
          $cron: cron,
          $description: description,
        },
      );
      await interaction.reply(
        getSuccessString(`Reminder "${name}" successfully added.`),
      );
    } catch (error: any) {
      console.error(error);
      await interaction.reply(
        getErrorString(
          `Failed to add reminder. Error Code: ${ErrorCode.AddReminderFailed}`,
        ),
      );
    }
  },
};
