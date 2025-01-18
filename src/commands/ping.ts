// ping.ts
import {
  CommandInteraction,
  InteractionResponse,
  SlashCommandBuilder,
} from "discord.js";
import { customizeText, getPingResponse, getRandomString } from "../utils";
import { MILES_RANDOM_RESPONSES } from "../consts";

export const data = new SlashCommandBuilder()
  .setName("hello-miles")
  .setDescription("Say Hi!");

export async function execute(
  interaction: CommandInteraction,
): Promise<InteractionResponse<boolean>> {
  // This will mention the user who called the command
  return interaction.reply(getPingResponse(`Hello ${interaction.user}.`));
}
