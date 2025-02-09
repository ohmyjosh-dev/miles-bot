import { SlashCommandBuilder } from "@discordjs/builders";
import { ChatInputCommandInteraction, GuildMember } from "discord.js";
import { DM_ROLE_NAME, ErrorCode } from "../consts";
import { getDbConnection } from "../database";
import { CommandName } from "../defs";
import { getErrorString, getSuccessString } from "../utils/utils";

export const command = {
  data: new SlashCommandBuilder()
    .setName(CommandName.milesDeleteReminder)
    .setDescription("Delete an existing reminder")
    .addStringOption(
      (option) =>
        option
          .setName("name")
          .setDescription("Name of the reminder to delete")
          .setRequired(true)
          .setAutocomplete(true), // updated to enable autocomplete
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
    const guildId = interaction.guild?.id;
    if (!guildId) {
      await interaction.reply(
        getErrorString("This command can only be used in a guild."),
      );
      return;
    }
    try {
      const db = await getDbConnection();
      const result = await db.run(
        `DELETE FROM reminders WHERE guild_id = $guildId AND name = $name`,
        {
          $guildId: guildId,
          $name: name,
        },
      );
      // Check if any rows were affected (sqlite returns changes property)
      if (result.changes && result.changes > 0) {
        await interaction.reply(
          getSuccessString(`Reminder "${name}" successfully deleted.`),
        );
      } else {
        await interaction.reply(
          getErrorString(`No reminder found with the name "${name}".`),
        );
      }
    } catch (error: any) {
      console.error(error);
      await interaction.reply(
        getErrorString(
          `Failed to delete reminder. Error Code: ${ErrorCode.AddReminderFailed}`,
        ),
      );
    }
  },
};
