import { getLargeGrantById } from "../database/repositories/large-grants";
import { getMilestoneByIdWithRelatedData } from "../database/repositories/large-milestones";
import { CreateNewGrantReqBody } from "~~/app/api/grants/new/route";
import { CreateNewLargeGrantReqBody } from "~~/app/api/large-grants/new/route";
import { CreateNewLargeStageReqBody } from "~~/app/api/large-stages/new/route";
import { CreateNewStageReqBody } from "~~/app/api/stages/new/route";
import { GrantWithStages } from "~~/app/grants/[grantId]/page";

const TELEGRAM_BOT_URL = process.env.TELEGRAM_BOT_URL;
const TELEGRAM_WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;

export type LargeGrantDataFromDB = Awaited<ReturnType<typeof getLargeGrantById>>;
export type MilestoneDataFromDB = Awaited<ReturnType<typeof getMilestoneByIdWithRelatedData>>;

type StageData = {
  newStage?: CreateNewStageReqBody;
  newLargeStage?: CreateNewLargeStageReqBody;
  grant?: GrantWithStages;
  largeGrant?: CreateNewLargeGrantReqBody | LargeGrantDataFromDB;
  largeMilestone?: MilestoneDataFromDB;
};

type GrantData = CreateNewGrantReqBody & { builderAddress: string };
type LargeGrantData = CreateNewLargeGrantReqBody & { builderAddress: string };

export async function notifyTelegramBot<T extends "grant" | "stage" | "largeGrant" | "largeStage" | "largeMilestone">(
  endpoint: T,
  data: T extends "grant" ? GrantData : T extends "largeGrant" ? LargeGrantData : StageData,
) {
  if (!TELEGRAM_BOT_URL || !TELEGRAM_WEBHOOK_SECRET) {
    if (!TELEGRAM_BOT_URL) {
      console.warn("TELEGRAM_BOT_URL is not set. Telegram notifications will be disabled.");
    }

    if (!TELEGRAM_WEBHOOK_SECRET) {
      console.warn("TELEGRAM_WEBHOOK_SECRET is not set. Telegram notifications will be disabled.");
    }
    return;
  }

  try {
    const response = await fetch(`${TELEGRAM_BOT_URL}/webhook/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Secret": TELEGRAM_WEBHOOK_SECRET,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const json = await response.json();

    return json;
  } catch (error) {
    // We don't throw here to prevent the main flow from failing if notifications fail
    console.error(`Error notifying Telegram bot (${endpoint}):`, error);
  }
}
