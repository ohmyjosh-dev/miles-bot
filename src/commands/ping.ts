// ping.ts
import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { getRandomString } from "../utils";
import { MILES_RANDOM_RESPONSES } from "../consts";

export const data = new SlashCommandBuilder()
  .setName("hello-miles")
  .setDescription("Say Hi!");

export async function execute(interaction: CommandInteraction) {
  const response = getRandomString(MILES_RANDOM_RESPONSES);
  // This will mention the user who called the command
  return interaction.reply(`Hello ${interaction.user}. ${response}`);
}
