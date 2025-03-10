// src/commands/index.ts
import * as deleteCampaign from "./delete-campaign";
import * as deleteInfo from "./delete-info";
import * as listCampaigns from "./list-campaigns";
import * as manageCampaign from "./manage-campaign";
import * as ping from "./ping";
import * as updateInfo from "./update-info";

export const commands = {
  [ping.data.name]: ping,
  [manageCampaign.data.name]: manageCampaign,
  [updateInfo.data.name]: updateInfo,
  [listCampaigns.data.name]: listCampaigns,
  [deleteInfo.data.name]: deleteInfo,
  [deleteCampaign.data.name]: deleteCampaign,
};
