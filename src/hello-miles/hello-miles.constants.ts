export const HELLO_MILES_VARIANTS: string[] = [
  "miles",
  "hello miles",
  "hi miles",
  "hey miles",
  "yo miles",
  "sup miles",
  "heyo miles",
  "hii miles",
  "hej miles",
  "hola miles",
  "bonjour miles",
  "ciao miles",
  "hallo miles",
  "salut miles",
  "yoohoo miles",
  "howdy miles",
  "greetings miles",
  "good day miles",
  "good morning miles",
  "good afternoon miles",
  "good evening miles",
];

export const SET_NEXT_SESSION_VARIANTS: string[] = ["set next session"];

export const HELLO_MILES_ID_PREFIX = "hello_miles_";

export const START_SESSION_VOTE_TIMER_VARIANTS: string[] = [
  "start session vote timer",
  "start the session vote timer",
  "start svt",
  "start the svt",
  "start session vote",
  "start vote timer",
];

export const STOP_SESSION_VOTE_TIMER_VARIANTS: string[] = [
  "stop session vote timer",
  "stop the session vote timer",
  "stop svt",
  "stop the svt",
  "stop session vote",
  "stop vote timer",
];

export enum HelloMilesCommand {
  Default = "",
}

export enum ErrorCode {
  NoMemberStartSessionVoteReminder = "SR-0000",
  NoMemberStopSessionVoteReminder = "SR-0001",
}
