import { SlashCommandBuilder } from "@discordjs/builders";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  GuildMember,
} from "discord.js";
import { DM_ROLE_NAME, ErrorCode } from "../consts";
import { addReminderJob } from "../cron/reminders";
import { getDbConnection } from "../database";
import { ButtonId, CommandName } from "../defs"; // Imported ButtonId
import { getErrorString, getSuccessString } from "../utils/utils";

export const command = {
  data: new SlashCommandBuilder()
    .setName(CommandName.milesAddReminder)
    .setDescription("Add a new reminder")
    // Moved "use-modal" option to be the first option
    .addBooleanOption((option) =>
      option
        .setName("use-modal")
        .setDescription("Use modal to add reminder")
        .setRequired(false),
    )
    .addStringOption(
      (option) =>
        option
          .setName("name")
          .setDescription("Name of the reminder")
          .setRequired(false), // Not required initially
    )
    .addStringOption(
      (option) =>
        option
          .setName("cron")
          .setDescription("Cron expression for the reminder")
          .setRequired(false), // Not required initially
    )
    .addStringOption(
      (option) =>
        option
          .setName("description")
          .setDescription("Description for the reminder")
          .setRequired(false), // Not required initially
    )
    .addStringOption(
      (option) =>
        option
          .setName("channel")
          .setDescription("Channel ID to send the reminder")
          .setRequired(false) // Not required initially
          .setAutocomplete(true), // enable autocomplete for channel names
    )
    .addStringOption(
      (
        option, // new reactions option
      ) =>
        option
          .setName("reactions")
          .setDescription("Comma-separated list of emoji reactions")
          .setRequired(false),
    )
    .addBooleanOption((option) =>
      option
        .setName("start-on-create")
        .setDescription("Start reminder on create")
        .setRequired(false),
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

    const useModal = interaction.options.getBoolean("use-modal") ?? false;

    if (useModal) {
      // Create a button that will trigger the modal using ButtonId enum
      const button = new ButtonBuilder()
        .setCustomId(ButtonId.openAddReminderModal)
        .setLabel("Add Reminder")
        .setStyle(ButtonStyle.Primary);

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

      await interaction.reply({
        content: "Click the button below to add a new reminder:",
        components: [row],
        ephemeral: true,
      });
    } else {
      const name = interaction.options.getString("name");
      const description = interaction.options.getString("description");
      const cron = interaction.options.getString("cron");
      const channel = interaction.options.getString("channel");
      const startOption =
        interaction.options.getBoolean("start-on-create") ?? false;
      const reactionsInput = interaction.options.getString("reactions") || "";
      const reactions = reactionsInput
        ? reactionsInput
            .split(",")
            .map((e) => e.trim())
            .filter((e) => e)
        : [];
      const guildId = interaction.guild?.id;

      // Check for missing required fields
      if (!name || !description || !cron || !channel) {
        await interaction.reply(
          getErrorString(
            "All required fields (name, description, cron, channel) must be provided.",
          ),
        );
        return;
      }

      if (!guildId) {
        await interaction.reply(
          getErrorString("This command can only be used in a guild."),
        );
        return;
      }

      try {
        const db = await getDbConnection();
        await db.run(
          `INSERT INTO reminders (guild_id, name, channel_id, cron_expression, description, started, reactions)
           VALUES ($guildId, $name, $channel, $cron, $description, $started, $reactions)`,
          {
            $guildId: guildId,
            $name: name,
            $channel: channel,
            $cron: cron,
            $description: description,
            $started: startOption,
            $reactions: JSON.stringify(reactions),
          },
        );
        // Add the new reminder to the running jobs
        addReminderJob({
          name,
          cron_expression: cron,
          channel_id: channel,
          description,
          started: startOption ? 1 : 0,
          reactions,
        });
        await interaction.reply(
          getSuccessString(`Reminder "${name}" successfully added.`),
        );
      } catch (error: unknown) {
        console.error(error);
        await interaction.reply(
          getErrorString(
            `Failed to add reminder. Error Code: ${ErrorCode.AddReminderFailed}`,
          ),
        );
      }
    }
  },
};
