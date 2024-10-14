// src/index.ts
import {
  Client,
  GatewayIntentBits,
  ChatInputCommandInteraction,
} from "discord.js";
import { deployCommands } from "./deploy-commands";
import { commands } from "./commands";
import { config } from "./config";
import { isDevelopment } from "./utils";
import { CANCEL_BUTTON_ID, CONFIRM_DELETE_CAMPAIGN } from "./consts";
import { handleDeleteConfirmation } from "./commands/delete-campaign";
// import { startSchedulers } from "./scheduler/scheduler"; // Uncomment if you have schedulers

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once("ready", async () => {
  console.log("Discord bot is ready! 🤖");

  const guilds = client.guilds.cache.map((guild) => guild.id);
  for (const guildId of guilds) {
    await deployCommands({ guildId });
  }

  // Start the scheduled tasks
  // startSchedulers(); // Uncomment if you have schedulers
});

client.on("guildCreate", async (guild) => {
  await deployCommands({ guildId: guild.id });
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const { commandName } = interaction;

    const command = commands[commandName as keyof typeof commands];
    if (!command) {
      console.error(`Command not found: ${commandName}`);
      return;
    }

    try {
      await command.execute(interaction as ChatInputCommandInteraction);
    } catch (error) {
      console.error(`Error executing command ${commandName}:`, error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "There was an error executing that command.",
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: "There was an error executing that command.",
          ephemeral: true,
        });
      }
    }
  }
});

/* client.on("messageCreate", (msg) => {
  // **1. Ignore Messages from Bots**
  if (msg.author.bot) return; // If the message author is a bot, exit the handler.

  if (msg.content.toLowerCase().includes("miles")) {
    if (isDevelopment) {
      msg.reply("🛠️ Miles is currently in therapy");

      return;
    }

    msg.reply("Who?");
  }

  if (msg.content.toLowerCase().includes("thurs")) {
    msg.reply("Thursdays are for D&D! 🎲");
  }
}); */

client.on("interactionCreate", async (interaction) => {
  if (!interaction?.isButton()) return;

  const customIdLower = interaction.customId.toLowerCase();

  if (customIdLower.includes(CONFIRM_DELETE_CAMPAIGN.toLowerCase())) {
    try {
      await handleDeleteConfirmation(interaction);
    } catch (error) {
      console.error("Error handling delete confirmation:", error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: "An error occurred while processing your request.",
          ephemeral: true,
        });
      }
    }
    return; // Exit after handling to prevent further replies
  }

  if (customIdLower === CANCEL_BUTTON_ID.toLowerCase()) {
    await interaction.reply({
      content: "Deletion has been cancelled.",
      ephemeral: true,
    });
    return;
  }

  // Handle other button interactions or send a generic error if the button is unrecognized
  // You can choose to ignore unrecognized buttons or notify the user
  // For example:
  await interaction.reply({
    content: "This button interaction is not recognized.",
    ephemeral: true,
  });
});

client.login(config.DISCORD_TOKEN);
