// src/commands/index.ts
import * as createCampaign from "./create-campaign";
import * as deleteCampaign from "./delete-campaign";
import * as deleteRecap from "./delete-recap";
import * as listCampaigns from "./list-campaigns";
import * as ping from "./ping";
import * as recap from "./recap";
import * as recaps from "./recaps";
import * as updateInfo from "./update-info";

export const commands = {
  [ping.data.name]: ping,
  [createCampaign.data.name]: createCampaign,
  [updateInfo.data.name]: updateInfo,
  [recap.data.name]: recap,
  [recaps.data.name]: recaps,
  [listCampaigns.data.name]: listCampaigns,
  [deleteRecap.data.name]: deleteRecap,
  [deleteCampaign.data.name]: deleteCampaign,
};
