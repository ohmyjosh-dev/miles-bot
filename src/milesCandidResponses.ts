import { Message } from "discord.js";
import { MILES_KNOCK_KNOCK_RESPONSES, MILES_RANDOM_RESPONSES } from "./consts";

let knockKnockFlag1: string[] = [];
let knockKnockFlag2: string[] = [];

export const milesCandidResponses = (msg: Message<boolean>): void => {
  knockKnockJoke(msg);

  // should run last
  randomResponses(msg);

  return;
};

function randomResponses(_msg: Message<boolean>): void {
  // remove false to re-enable
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

function getRandomString(arr: string[]): string {
  if (!arr.length) {
    return ""; // or handle the empty array case as needed
  }

  const randomIndex = Math.floor(Math.random() * arr.length);
  return arr[randomIndex];
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
