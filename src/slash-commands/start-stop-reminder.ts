import { SlashCommandBuilder } from "@discordjs/builders";
import { ChatInputCommandInteraction } from "discord.js";
import { setReminderStatus } from "../cron/reminders";
import { CommandName } from "../defs";
import { getErrorString, getSuccessString } from "../utils/utils";

export const command = {
  data: new SlashCommandBuilder()
    .setName(CommandName.milesStartStopReminder)
    .setDescription("Start or stop a reminder ==")
    .addStringOption(
      (option) =>
        option
          .setName("name")
          .setDescription("Name of the reminder")
          .setRequired(true)
          .setAutocomplete(true), // added autocomplete
    )
    .addBooleanOption((option) =>
      option
        .setName("start")
        .setDescription("Set to true to start, false to stop the reminder")
        .setRequired(true),
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    // ...existing role and guild checks if needed...
    const reminderName = interaction.options.getString("name", true);
    const startOption = interaction.options.getBoolean("start", true);
    const guildId = interaction.guild?.id;

    if (!guildId) {
      await interaction.reply(
        getErrorString("This command can only be used in a guild."),
      );
      return;
    }

    try {
      await setReminderStatus(reminderName, guildId, startOption);
      await interaction.reply(
        getSuccessString(
          `Reminder "${reminderName}" has been ${startOption ? "started" : "stopped"}.`,
        ),
      );
    } catch (error: any) {
      console.error(error);
      await interaction.reply(
        getErrorString("Failed to update reminder status."),
      );
    }
  },
};
