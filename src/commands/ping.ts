import { CommandInteraction, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("miles-who-is-miles")
  .setDescription("Who is Miles?");

export async function execute(interaction: CommandInteraction) {
  // This will mention the user who called the command
  return interaction.reply(`${interaction.user} Who?`);
}
