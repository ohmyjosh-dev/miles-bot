export const environment = {
  prod: "production",
  dev: "development",
};

export enum CommandName {
  helloMiles = "hello-miles",
  milesCampaigns = "miles-campaigns",
  milesManageCampaign = "miles-manage-campaign",
  milesDeleteCampaign = "miles-delete-campaign",
  milesDeleteInfo = "miles-delete-info",
  milesUpdateInfo = "miles-update-info",
  milesDeleteReminder = "miles-delete-reminder", // newly added
  milesAddReminder = "miles-add-reminder", // newly added
}

export enum OptionName {
  campaignName = "campaign_name",
  campaignDescription = "description",
  infoTitle = "info_title",
  infoDescription = "info_description",
  infoLink = "info_link",
  sortOrder = "sort_order",
  showIds = "show_ids",
}

export enum ButtonId {
  campaign = "campaign",
}
