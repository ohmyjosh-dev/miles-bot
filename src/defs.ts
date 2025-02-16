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
  milesDeleteReminder = "miles-delete-reminder",
  milesAddReminder = "miles-add-reminder",
  milesStartStopReminder = "miles-start-stop-reminder",
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
  openAddReminderModal = "openAddReminderModal", // New button id for add reminder modal
}

// Add new ModalId enum
export enum ModalId {
  addReminderModal = "addReminderModal"
}

export const REMINDERS_BUTTON_ID_PREFIX = "reminder:";
