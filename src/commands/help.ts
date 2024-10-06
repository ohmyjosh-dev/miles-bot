// help.ts
import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
} from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("help")
  .setDescription("Displays information about available commands.");

export async function execute(interaction: ChatInputCommandInteraction) {
  const embed = new EmbedBuilder()
    .setTitle("Bot Commands")
    .setDescription("Here are some commands you can use:")
    .setColor(0x00ae86)
    .addFields(
      {
        name: "/skyhook",
        value:
          "Logs a skyhook timer.\n" +
          "**Usage:**\n" +
          "```/skyhook system:<system name> moon_type:<Lava|Ice|L|I> time_until:<duration>```\n" +
          "**Example:**\n" +
          "```/skyhook system: RT64-D 8 moon_type: Lava time_until: 1d23h45m```",
      },
      {
        name: "/skyhooks",
        value:
          "Shows upcoming skyhook timers.\n" +
          "**Usage:**\n" +
          "```/skyhooks [limit:1-50]```\n" +
          "**Example:**\n" +
          "```/skyhooks limit:20```",
      },
      {
        name: "/delete-skyhook",
        value:
          "Deletes a skyhook timer by ID.\n" +
          "**Usage:**\n" +
          "```/delete-skyhook id:<skyhook ID>```\n" +
          "**Example:**\n" +
          "```/delete-skyhook id:42```",
      },
      {
        name: "/ping",
        value:
          "Replies with a message to check if the bot is responsive.\n" +
          "**Usage:**\n" +
          "```/ping```",
      },
      {
        name: "/help",
        value: "Displays this help message.\n" + "**Usage:**\n" + "```/help```",
      }
    );

  await interaction.reply({ embeds: [embed] });
}
