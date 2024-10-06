// src/index.ts
import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
} from "discord.js";
import { deployCommands } from "./deploy-commands";
import { commands } from "./commands";
import { config } from "./config";
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
  } else if (interaction.isAutocomplete()) {
    const { commandName } = interaction;

    const command = commands[commandName as keyof typeof commands];
    if (!command || typeof command.autocomplete !== "function") {
      await interaction.respond([]);
      return;
    }

    try {
      await command.autocomplete(interaction as AutocompleteInteraction);
    } catch (error) {
      console.error(
        `Error during autocomplete for command ${commandName}:`,
        error
      );
      await interaction.respond([]);
    }
  }
});

client.on("messageCreate", (msg) => {
  if (msg.content.toLowerCase().includes("miles")) {
    msg.reply("Who?");
  }
});

client.login(config.DISCORD_TOKEN);
