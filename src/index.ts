// src/index.ts
import {
  ChatInputCommandInteraction,
  Client,
  GatewayIntentBits,
} from "discord.js";
import { commands } from "./commands";
import { handleDeleteConfirmation } from "./commands/delete-campaign";
import { config } from "./config";
import { CANCEL_BUTTON_ID, CONFIRM_DELETE_CAMPAIGN } from "./consts";
import { getDbConnection } from "./database";
import { CommandName, OptionName } from "./defs";
import { deployCommands } from "./deploy-commands";
import { milesCandidResponses } from "./milesCandidResponses";
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

  if (interaction.isButton()) {
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
  }

  if (interaction.isAutocomplete()) {
    if (
      interaction.commandName === CommandName.milesCampaigns ||
      interaction.commandName === CommandName.milesUpdateInfo
    ) {
      const focusedOption = interaction.options.getFocused(true);

      try {
        if (focusedOption.name === OptionName.campaignName) {
          const db = await getDbConnection();
          const guildId = interaction.guildId;

          if (!guildId) {
            return interaction.respond([]);
          }
          // Query for campaign names matching the partial value.
          const results: { campaign_name: string }[] = await db.all(
            `SELECT campaign_name
             FROM campaigns
             WHERE guild_id = $guild_id 
               AND campaign_name LIKE $value
             ORDER BY campaign_name ASC`,
            {
              $guild_id: guildId,
              $value: `%${focusedOption.value}%`,
            },
          );

          // Format the results as choices (limit to 25 as Discord requires)
          const choices = results
            .map((row) => ({
              name: row.campaign_name,
              value: row.campaign_name,
            }))
            .slice(0, 25);

          return interaction.respond(choices);
        }

        if (focusedOption.name === OptionName.infoTitle) {
          const db = await getDbConnection();
          const guildId = interaction.guildId;

          if (!guildId) {
            return interaction.respond([]);
          }
          // Query for info titles matching the partial value.
          const results: { title: string }[] = await db.all(
            `SELECT title
             FROM campaign_info
             WHERE guild_id = $guild_id 
               AND title LIKE $value
             ORDER BY title ASC`,
            {
              $guild_id: guildId,
              $value: `%${focusedOption.value}%`,
            },
          );

          // Format the results as choices (limit to 25 as Discord requires)
          const choices = results
            .map((row) => ({
              name: row.title,
              value: row.title,
            }))
            .slice(0, 25);

          return interaction.respond(choices);
        }
      } catch (error) {
        console.error("Autocomplete error:", error);
        return await interaction.respond([]);
      }
    }
  }
});

client.on("messageCreate", (msg) => {
  // **1. Ignore Messages from Bots**
  if (!msg || msg.author.bot) return; // If the message author is a bot, exit the handler.

  milesCandidResponses(msg);
});

client.login(config.DISCORD_TOKEN);
