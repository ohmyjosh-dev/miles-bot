import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { getDbConnection } from "../database";

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
  const campaignName = interaction.options
    .getString("campaign_name", true)
    .trim();
  const description = interaction.options.getString("description", true).trim();
  const guildId = interaction.guildId;

  if (!guildId) {
    return interaction.reply("This command can only be used within a server.");
  }

  try {
    const db = await getDbConnection();

    // Insert the new campaign
    await db.run(
      `INSERT INTO campaigns (guild_id, campaign_name, description) VALUES (?, ?, ?)`,
      [guildId, campaignName, description]
    );

    await interaction.reply(
      `Campaign **${campaignName}** created successfully!`
    );
  } catch (error: any) {
    if (error.message.includes("UNIQUE constraint failed")) {
      await interaction.reply(
        `A campaign with the name **${campaignName}** already exists.`
      );
    } else {
      console.error(error);
      await interaction.reply("There was an error creating the campaign.");
    }
  }
}
