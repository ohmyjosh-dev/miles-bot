export const environment = {
  prod: "production",
  dev: "development",
};

export enum CommandName {
  helloMiles = "hello-miles",
  milesCampaigns = "miles-campaigns",
  milesCreateCampaign = "miles-create-campaign",
  milesDeleteCampaign = "miles-delete-campaign",
  milesDeleteInfo = "miles-delete-info",
  milesUpdateInfo = "miles-update-info",
}

export enum OptionName {
  campaignName = "campaign_name",
  infoTitle = "info_title",
  infoDescription = "info_description",
  infoLink = "info_link",
  sortOrder = "sort_order",
}
