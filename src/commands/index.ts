// src/commands/index.ts
import * as ping from "./ping";
import * as createCampaign from "./create-campaign";
import * as createRecap from "./create-recap";
import * as recap from "./recap";
import * as recaps from "./recaps";
import * as listCampaigns from "./list-campaigns";
import * as deleteRecap from "./delete-recap";

export const commands = {
  [ping.data.name]: ping,
  [createCampaign.data.name]: createCampaign,
  [createRecap.data.name]: createRecap,
  [recap.data.name]: recap,
  [recaps.data.name]: recaps,
  [listCampaigns.data.name]: listCampaigns,
  [deleteRecap.data.name]: deleteRecap,
};
