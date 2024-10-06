// src/commands/index.ts
import * as ping from "./ping";

export const commands = {
  [ping.data.name]: ping,
};
