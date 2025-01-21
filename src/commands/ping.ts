// ping.ts
import {
  CommandInteraction,
  InteractionResponse,
  SlashCommandBuilder,
} from "discord.js";
import { CommandName } from "../defs";
import { customizeText, getPingResponse } from "../utils/utils";

export const data = new SlashCommandBuilder()
  .setName(CommandName.helloMiles)
  .setDescription("Say Hi!");

export async function execute(
  interaction: CommandInteraction,
): Promise<InteractionResponse<boolean>> {
  // This will mention the user who called the command
  return interaction.reply(
    customizeText(getPingResponse(`Hello ${interaction.user}.`), {
      append: true,
    }),
  );
}
