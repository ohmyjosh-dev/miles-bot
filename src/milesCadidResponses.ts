import { Message } from "discord.js";
import { isDevelopment } from "./utils";
import { MILES_RANDOM_RESPONSES } from "./consts";

let knockKnockFlag1 = false;
let knockKnockFlag2 = false;

export const milesCandidResponses = (msg: Message<boolean>): void => {
  inDevelopment(msg);
  knockKnockJoke(msg);

  // should run last
  randomResponses(msg);

  return;
};

function randomResponses(msg: Message<boolean>): void {
  if (shouldTrigger(3)) {
    msg.reply(getRandomString(MILES_RANDOM_RESPONSES));
  }

  return;
}

function inDevelopment(msg: Message<boolean>): void {
  if (msg.content.toLowerCase().includes("miles") && isDevelopment) {
    msg.reply("🛠️ Miles is currently in therapy");

    return;
  }
}

function knockKnockJoke(msg: Message): void {
  if (msg.content.toLowerCase().includes("knock knock")) {
    msg.reply("Who's there?");
    knockKnockFlag1 = true;

    return;
  }

  if (knockKnockFlag1) {
    if (msg.content.toLowerCase().includes("miles")) {
      msg.reply("Miles who? Miles who? MILES WHO? THINK ABOUT IT!");

      knockKnockFlag1 = false;
      knockKnockFlag2 = false;

      return;
    }

    msg.reply(msg.content + " who?");
    knockKnockFlag1 = false;
    knockKnockFlag2 = true;

    return;
  }

  if (knockKnockFlag2) {
    const responses = [
      "Haha! That's a good one! Would have been even better if you said \"Orange you glad I DIDN'T LEAVE MILES BEHIND?\"",
    ];

    msg.reply(getRandomString(responses));

    knockKnockFlag2 = false;
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