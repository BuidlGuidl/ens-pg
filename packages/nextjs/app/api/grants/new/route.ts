import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { parseEther } from "viem";
import { applyFormSchema } from "~~/app/apply/schema";
import { GrantInsert, createGrant } from "~~/services/database/repositories/grants";
import { createStage } from "~~/services/database/repositories/stages";
import { notifyTelegramBot } from "~~/services/notifications/telegram";
import { authOptions } from "~~/utils/auth";

export type CreateNewGrantReqBody = Omit<GrantInsert, "requestedFunds" | "builderAddress"> & {
  requestedFunds: string;
};

export async function POST(req: Request) {
  try {
    const body: CreateNewGrantReqBody = await req.json();
    const session = await getServerSession(authOptions);
    const builderAddress = session?.user.address;

    if (!builderAddress) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    try {
      applyFormSchema.parse(body);
    } catch (err) {
      return NextResponse.json({ error: "Invalid form details submitted" }, { status: 400 });
    }

    const [createdGrant] = await createGrant({
      ...body,
      builderAddress,
      requestedFunds: parseEther(body.requestedFunds),
    });

    const [createdStage] = await createStage({
      grantId: createdGrant.id,
    });

    await notifyTelegramBot("grant", {
      id: createdGrant.id,
      ...body,
      builderAddress,
    });

    return NextResponse.json({ grantId: createdGrant.id, stageId: createdStage.id }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error creating grant" }, { status: 500 });
  }
}
