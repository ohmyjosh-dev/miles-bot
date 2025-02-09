import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Message,
} from "discord.js";
import {
  MILES_KNOCK_KNOCK_RESPONSES,
  MILES_SEE_CAMPAIGNS_PROMPTS,
} from "./consts";
import { listReminders } from "./cron/reminders";
import { ButtonId } from "./defs";
import {
  HELLO_MILES_ID_PREFIX,
  HELLO_MILES_VARIANTS,
  HelloMilesCommand,
} from "./hello-miles/hello-miles.constants";
import { customizeText, getPingResponse, getRandomString } from "./utils/utils";

let knockKnockFlag1: string[] = [];
let knockKnockFlag2: string[] = [];

export const helloMiles = async (msg: Message<boolean>): Promise<void> => {
  HELLO_MILES_VARIANTS.forEach((variant) => {
    if (msg.content.toLowerCase().startsWith(variant.toLowerCase())) {
      const text = msg.content.slice(variant.length).trim().toLowerCase();
      // Normalize text by replacing spaces with hyphens
      const normalizedText = text.replace(/\s+/g, "-");
      switch (normalizedText) {
        case HelloMilesCommand.listReminders:
          listReminders(msg);
          break;
        case HelloMilesCommand.Default:
          helloMilesDefault(msg);
          break;
        default:
          // do nothing
          break;
      }
    }
  });

  // should run last
  randomResponses(msg);

  return;
};

function helloMilesDefault(msg: Message<boolean>): void {
  const button = new ButtonBuilder()
    .setCustomId(`${HELLO_MILES_ID_PREFIX}${ButtonId.campaign}`)
    .setLabel("See available campaigns")
    .setStyle(ButtonStyle.Primary);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

  msg.reply({
    content: `${customizeText(
      `${getPingResponse(`Hello ${msg.author}.`)} ${getRandomString(MILES_SEE_CAMPAIGNS_PROMPTS)}`,
      {
        append: true,
      },
    )}`,
    components: [row],
  });
}

function randomResponses(_msg: Message<boolean>): void {
  // uncomment and remove underscore in function param to re-enable
  /* if (shouldTrigger(3)) {
    msg.reply(getRandomString(MILES_RANDOM_RESPONSES));
  } */

  return;
}

function knockKnockJoke(msg: Message): void {
  if (msg.content.toLowerCase().includes("knock knock")) {
    msg.reply("Who's there?");

    knockKnockFlag1 = [...knockKnockFlag1, msg.author.id];

    return;
  }

  if (knockKnockFlag1.includes(msg.author.id)) {
    if (msg.content.toLowerCase().includes("miles")) {
      msg.reply("Miles who? Miles who? MILES WHO? THINK ABOUT IT!");

      // remove the user from the flag if it exists
      knockKnockFlag1 = knockKnockFlag1.filter((id) => id !== msg.author.id);

      return;
    }

    msg.reply(msg.content + " who?");
    knockKnockFlag1 = knockKnockFlag1.filter((id) => id !== msg.author.id);
    knockKnockFlag2 = [...knockKnockFlag2, msg.author.id];

    return;
  }

  if (knockKnockFlag2.includes(msg.author.id)) {
    msg.reply(getRandomString(MILES_KNOCK_KNOCK_RESPONSES));

    knockKnockFlag2 = knockKnockFlag2.filter((id) => id !== msg.author.id);
  }

  return;
}

/**
 * Determines whether to trigger an action based on the given probability.
 *
 * @param probability - The probability (between 0 and 100) that the function returns true.
 * @returns A boolean indicating whether to trigger the action.
 */
function shouldTrigger(probability: number): boolean {
  if (probability <= 0) return false;
  if (probability >= 100) return true;

  const randomNumber = Math.random() * 100;
  return randomNumber < probability;
}
