import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { applyFormSchema } from "~~/app/large-grant-apply/schema";
import { LargeGrantInsertWithMilestones, createLargeGrant } from "~~/services/database/repositories/large-grants";
import { notifyTelegramBot } from "~~/services/notifications/telegram";
import { authOptions } from "~~/utils/auth";

export type CreateNewLargeGrantReqBody = Omit<LargeGrantInsertWithMilestones, "builderAddress">;

export async function POST(req: Request) {
  try {
    const body: CreateNewLargeGrantReqBody = await req.json();
    const session = await getServerSession(authOptions);
    const builderAddress = session?.user.address;

    if (!builderAddress) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    try {
      applyFormSchema.parse(body);
    } catch (err) {
      console.log(err);
      return NextResponse.json({ error: "Invalid form details submitted" }, { status: 400 });
    }

    const formattedBody = {
      ...body,
      milestones: body.milestones.map(milestone => ({
        ...milestone,
        proposedCompletionDate:
          milestone.proposedCompletionDate instanceof Date
            ? milestone.proposedCompletionDate
            : new Date(milestone.proposedCompletionDate),
      })),
    };

    const result = await createLargeGrant({
      ...formattedBody,
      builderAddress,
    });

    await notifyTelegramBot("largeGrant", {
      id: result.grantId,
      ...body,
      builderAddress,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error creating grant" }, { status: 500 });
  }
}
