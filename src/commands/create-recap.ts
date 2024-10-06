import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { getDbConnection } from "../database";

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
      .setDescription("A valid URL link for the recap.")
      .setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const campaignName = interaction.options
    .getString("campaign_name", true)
    .trim();
  const recapTitle = interaction.options.getString("recap_title", true).trim();
  const recapLink = interaction.options.getString("recap_link", true).trim();
  const guildId = interaction.guildId;

  if (!guildId) {
    return interaction.reply("This command can only be used within a server.");
  }

  // Validate the recap link
  try {
    new URL(recapLink);
  } catch {
    return interaction.reply("Please provide a valid URL for the recap link.");
  }

  try {
    const db = await getDbConnection();

    // Get the campaign ID
    const campaign = await db.get(
      `SELECT id FROM campaigns WHERE guild_id = ? AND campaign_name = ?`,
      [guildId, campaignName]
    );

    if (!campaign) {
      return interaction.reply(`Campaign **${campaignName}** does not exist.`);
    }

    const campaignId = campaign.id;

    // Insert the new recap
    await db.run(
      `INSERT INTO milesbot_recaps (guild_id, campaign_id, recap_title, recap_link) VALUES (?, ?, ?, ?)`,
      [guildId, campaignId, recapTitle, recapLink]
    );

    // Ensure only the latest 10 recaps are kept
    const count = await db.get(
      `SELECT COUNT(*) as count FROM milesbot_recaps WHERE guild_id = ? AND campaign_id = ?`,
      [guildId, campaignId]
    );

    if (count.count > 10) {
      const recapsToDelete = await db.all(
        `SELECT id FROM milesbot_recaps WHERE guild_id = ? AND campaign_id = ? ORDER BY created_at ASC LIMIT ?`,
        [guildId, campaignId, count.count - 10]
      );

      const deleteIds = recapsToDelete.map((recap) => recap.id);
      await db.run(
        `DELETE FROM milesbot_recaps WHERE id IN (${deleteIds
          .map(() => "?")
          .join(",")})`,
        deleteIds
      );
    }

    await interaction.reply(
      `Recap **${recapTitle}** added to campaign **${campaignName}**.`
    );
  } catch (error) {
    console.error(error);
    await interaction.reply("There was an error creating the recap.");
  }
}
