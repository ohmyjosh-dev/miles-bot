import { REST, Routes } from "discord.js";
import { config } from "./config";
import { commands } from "./slash-commands";

type DeployCommandsProps = {
  guildId: string;
};

const commandsData = Object.values(commands).map((command) =>
  command.data.toJSON(),
);

const rest = new REST({ version: "10" }).setToken(config.DISCORD_TOKEN);

export async function deployCommands({ guildId }: DeployCommandsProps) {
  try {
    console.log(
      `Started refreshing application (/) commands for guild ${guildId}.`,
    );

    await rest.put(
      Routes.applicationGuildCommands(config.DISCORD_CLIENT_ID, guildId),
      { body: commandsData },
    );

    console.log(
      `Successfully reloaded application (/) commands for guild ${guildId}.`,
    );
  } catch (error) {
    console.error(error);
  }
}
