import { ModalSubmitInteraction, GuildMember } from "discord.js";
import { addReminderJob } from "../cron/reminders";
import { getDbConnection } from "../database";
import { getErrorString, getSuccessString } from "../utils/utils";
import { DM_ROLE_NAME, ErrorCode } from "../consts";

export async function handleAddReminderModal(interaction: ModalSubmitInteraction) {
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

  const name = interaction.fields.getTextInputValue("name");
  const description = interaction.fields.getTextInputValue("description");
  const cron = interaction.fields.getTextInputValue("cron");
  const channel = interaction.fields.getTextInputValue("channel");
  const reactionsInput = interaction.fields.getTextInputValue("reactions") || "";
  const reactions = reactionsInput
    ? reactionsInput.split(",").map((e) => e.trim()).filter((e) => e)
    : [];
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
      `INSERT INTO reminders (guild_id, name, channel_id, cron_expression, description, started, reactions)
       VALUES ($guildId, $name, $channel, $cron, $description, $started, $reactions)`,
      {
        $guildId: guildId,
        $name: name,
        $channel: channel,
        $cron: cron,
        $description: description,
        $started: true,
        $reactions: JSON.stringify(reactions),
      },
    );
    // Add the new reminder to the running jobs
    addReminderJob({
      name,
      cron_expression: cron,
      channel_id: channel,
      description,
      started: 1,
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
