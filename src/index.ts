import { Client, GatewayIntentBits } from "discord.js";
import { deployCommands } from "./deploy-commands";
import { commands } from "./commands";
import { config } from "./config";
import { startSchedulers } from "./scheduler/scheduler";

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
  // startSchedulers();
});

client.on("guildCreate", async (guild) => {
  await deployCommands({ guildId: guild.id });
});

client.on("interactionCreate", async (interaction) => {
  console.log(interaction);
  if (!interaction.isCommand()) {
    return;
  }
  const { commandName } = interaction;
  if (commands[commandName as keyof typeof commands]) {
    commands[commandName as keyof typeof commands].execute(interaction);
  } else {
    console.error(`Command not found: ${commandName}`);
  }
});

client.on("messageCreate", (msg) => {
  if (msg.content.toLowerCase().includes("miles")) {
    msg.reply("Who?");
  }
});

client.login(config.DISCORD_TOKEN);
