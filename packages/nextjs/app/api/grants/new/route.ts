import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { parseEther } from "viem";
import { applyFormSchema } from "~~/app/apply/schema";
import { GrantInsertWithMilestones, createGrant } from "~~/services/database/repositories/grants";
import { notifyTelegramBot } from "~~/services/notifications/telegram";
import { authOptions } from "~~/utils/auth";

export type CreateNewGrantReqBody = Omit<GrantInsertWithMilestones, "builderAddress" | "requestedFunds">;

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

    const totalAmount = body.milestones.reduce((sum, milestone) => sum + BigInt(milestone.requestedAmount), 0n);

    if (totalAmount > parseEther("2")) {
      return NextResponse.json({ error: "Total requested funds should not exceed 2 ETH" }, { status: 400 });
    }

    const result = await createGrant({
      ...body,
      builderAddress,
      requestedFunds: totalAmount,
    });

    await notifyTelegramBot("grant", {
      id: result.grantId,
      ...body,
      builderAddress,
    });

    return NextResponse.json({ grantId: result.grantId, stageId: result.stageId }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error creating grant" }, { status: 500 });
  }
}
