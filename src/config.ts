import dotenv from "dotenv";
import { environment } from "./defs";

dotenv.config();

const { DISCORD_TOKEN, DISCORD_CLIENT_ID } = process.env;

if (!DISCORD_TOKEN || !DISCORD_CLIENT_ID) {
  throw new Error("Missing Env Vars");
}

export const config = {
  DISCORD_TOKEN,
  DISCORD_CLIENT_ID,
};

export const BOT_ENV = process.env.BOT_ENV || environment.prod;
