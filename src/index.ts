// src/index.ts
import {
  ChatInputCommandInteraction,
  Client,
  EmbedBuilder,
  GatewayIntentBits,
} from "discord.js";
import { config } from "./config";
import {
  CANCEL_BUTTON_ID,
  CONFIRM_DELETE_CAMPAIGN,
  VIEW_CAMPAIGN_BUTTON_ID_PREFIX,
} from "./consts";
import { loadAndStartReminderJobs } from "./cron/reminders";
import { getDbConnection } from "./database";
import {
  ButtonId,
  CommandName,
  OptionName,
  REMINDERS_BUTTON_ID_PREFIX,
} from "./defs";
import { deployCommands } from "./deploy-commands";
import { helloMiles } from "./hello-miles";
import { HELLO_MILES_ID_PREFIX } from "./hello-miles/hello-miles.constants";
import { commands } from "./slash-commands";
import { handleDeleteConfirmation } from "./slash-commands/delete-campaign";
import { sendCampaignDetails, sendCampaigns } from "./utils/campaign-helpers";
// import { startSchedulers } from "./scheduler/scheduler"; // Uncomment if you have schedulers

export const client = new Client({
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

  /** cron jobs */
  await loadAndStartReminderJobs(); // Load and start reminder jobs from DB

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
    console.log("Button interaction detected:", customIdLower);

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

    if (
      customIdLower.startsWith(VIEW_CAMPAIGN_BUTTON_ID_PREFIX.toLowerCase())
    ) {
      const campaignName = interaction.customId.replace(
        VIEW_CAMPAIGN_BUTTON_ID_PREFIX,
        "",
      );

      await sendCampaignDetails(
        campaignName,
        interaction.guildId!,
        false,
        interaction,
      );
      return;
    }

    if (customIdLower === `${HELLO_MILES_ID_PREFIX}${ButtonId.campaign}`) {
      await sendCampaigns(interaction.guildId!, false, interaction);

      return;
    }

    if (customIdLower.startsWith(REMINDERS_BUTTON_ID_PREFIX.toLowerCase())) {
      if (interaction.message.embeds?.length) {
        const [, , rawIndex, emoji] = customIdLower.split(":");
        const newEmoji = emoji ?? "";
        const newIndex = parseInt(rawIndex, 10) ?? 0;
        const embed = EmbedBuilder.from(interaction.message.embeds[0]);
        const description = embed.data.description ?? "";
        const lines = description.split("\n");
        let updatedLines: string[] = [];
        let emojiFound = false;

        // Process each "Reacted with ..." line
        for (const line of lines) {
          const match = line.match(/^Reacted with (.+?): (.*)$/);
          if (!match) {
            updatedLines = [...updatedLines, line];
            continue;
          }
          const [, lineEmoji, lineUsers] = match;
          let users = lineUsers
            .split(",")
            .map((u) => u.trim())
            .filter(Boolean);

          // Remove this user from any existing emoji list
          users = users.filter((u) => u !== interaction.user.tag);

          // If this line matches the new emoji, re-add the user
          if (lineEmoji === newEmoji) {
            users = [...users, interaction.user.tag];
            updatedLines = [
              ...updatedLines,
              `Reacted with ${lineEmoji}: ${users.join(", ")}`,
            ];
            emojiFound = true;
          } else if (users.length > 0) {
            updatedLines = [
              ...updatedLines,
              `Reacted with ${lineEmoji}: ${users.join(", ")}`,
            ];
          }
        }

        // If the line for the new emoji wasn't found at all, create a new line
        if (!emojiFound && newEmoji) {
          updatedLines = [
            ...updatedLines,
            `Reacted with ${newEmoji}: ${interaction.user.tag}`,
          ];
        }

        embed.setDescription(updatedLines.join("\n"));
        await interaction.update({ embeds: [embed] });
      }
      return;
    }

    // Handle other button interactions or send a generic error if the button is unrecognized
    // You can choose to ignore unrecognized buttons or notify the user
    // For example:
    await interaction.reply({
      content: "This button interaction is not recognized.",
      ephemeral: true,
    });

    return;
  }

  if (interaction.isAutocomplete()) {
    if (
      interaction.commandName === CommandName.milesCampaigns ||
      interaction.commandName === CommandName.milesUpdateInfo ||
      interaction.commandName === CommandName.milesManageCampaign
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

          const campaignNameOption = interaction.options
            .getString(OptionName.campaignName, true)
            ?.trim();
          if (!campaignNameOption) {
            // If for some reason no campaign name is provided, respond with empty choices.
            return interaction.respond([]);
          }

          // Query to find the campaign using the provided campaign name and guild ID.
          const campaign = await db.get(
            `SELECT id FROM campaigns WHERE guild_id = $guild_id AND campaign_name = $campaign_name`,
            {
              $guild_id: guildId,
              $campaign_name: campaignNameOption,
            },
          );

          if (!campaign) {
            // No campaign found, return empty array.
            return interaction.respond([]);
          }

          // Query for info titles matching the partial value.
          const results: { title: string }[] = await db.all(
            `SELECT title
             FROM campaign_info
             WHERE guild_id = $guild_id 
               AND campaign_id = $campaign_id
               AND title LIKE $value
             ORDER BY title ASC`,
            {
              $guild_id: guildId,
              $campaign_id: campaign.id,
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

    // Add autocomplete for add-reminder channel option
    if (interaction.commandName === CommandName.milesAddReminder) {
      const focusedOption = interaction.options.getFocused(true);
      if (focusedOption.name === "channel") {
        const guild = interaction.guild;
        if (!guild) return interaction.respond([]);
        // Import ChannelType from discord.js if not imported
        const { ChannelType } = require("discord.js");
        // Filter guild channels: text channels (and news channels) only
        let channels = guild.channels.cache.filter(
          (ch) =>
            ch.type === ChannelType.GuildText ||
            ch.type === ChannelType.GuildAnnouncement,
        );
        // Map to choices using channel name and id; filter by focused value
        let choices = channels
          .map((ch) => ({
            name: ch.name,
            value: ch.id,
          }))
          .filter((choice) =>
            choice.name
              .toLowerCase()
              .includes(focusedOption.value.toLowerCase()),
          )
          .slice(0, 25); // Discord limit
        return interaction.respond(choices);
      }
    }

    // Combined autocomplete branch for start-stop and delete reminder commands
    if (
      interaction.commandName === CommandName.milesStartStopReminder ||
      interaction.commandName === CommandName.milesDeleteReminder
    ) {
      const focusedOption = interaction.options.getFocused(true);
      const db = await getDbConnection();
      const guildId = interaction.guildId;
      if (!guildId) return interaction.respond([]);
      try {
        const results: { name: string }[] = await db.all(
          `SELECT name FROM reminders WHERE guild_id = $guildId AND name LIKE $value ORDER BY name ASC LIMIT 25`,
          {
            $guildId: guildId,
            $value: `%${focusedOption.value}%`,
          },
        );
        const choices = results.map((row) => ({
          name: row.name,
          value: row.name,
        }));
        return interaction.respond(choices);
      } catch (error) {
        console.error("Autocomplete error for reminders:", error);
        return interaction.respond([]);
      }
    }
  }
});

client.on("messageCreate", (msg) => {
  // **1. Ignore Messages from Bots**
  if (!msg || msg.author.bot) return; // If the message author is a bot, exit the handler.

  helloMiles(msg);
});

client.login(config.DISCORD_TOKEN);
