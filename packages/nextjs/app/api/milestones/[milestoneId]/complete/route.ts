import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import {
  MilestoneUpdate,
  getMilestoneByIdWithRelatedData,
  updateMilestoneStatusToPaid,
} from "~~/services/database/repositories/milestones";
import { getStageWithMilestones, updateStageStatusToCompleted } from "~~/services/database/repositories/stages";
import { notifyTelegramBot } from "~~/services/notifications/telegram";
import { authOptions } from "~~/utils/auth";

export type CompleteMilestoneBody = {
  paymentTx: MilestoneUpdate["paymentTx"];
  completionProof: MilestoneUpdate["completionProof"];
};

export async function POST(req: NextRequest, { params }: { params: { milestoneId: string } }) {
  try {
    const { milestoneId } = params;
    const body = (await req.json()) as CompleteMilestoneBody;
    const session = await getServerSession(authOptions);
    const milestone = await getMilestoneByIdWithRelatedData(Number(milestoneId));

    if (!milestone) return NextResponse.json({ error: "Milestone not found" }, { status: 404 });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.address !== milestone.stage.grant.builderAddress) {
      return NextResponse.json({ error: "Only grant owner can complete milestones" }, { status: 401 });
    }

    if (!body.paymentTx || !body.completionProof) {
      return NextResponse.json({ error: "Payment transaction and completion proof are required" }, { status: 400 });
    }

    await updateMilestoneStatusToPaid({
      milestoneId: Number(milestoneId),
      paymentTx: body.paymentTx,
      completionProof: body.completionProof,
    });

    // check if this is the last milestone of the stage and update the stage status to "completed"
    const stage = milestone.stage;
    const stageWithMilestones = await getStageWithMilestones(stage.id);
    const allMilestonesCompleted = stageWithMilestones
      ? stageWithMilestones.milestones.every(m => m.status === "paid")
      : false;

    if (allMilestonesCompleted) {
      await updateStageStatusToCompleted(stage.id);
    }

    // Fetch the updated milestone
    const updatedMilestone = await getMilestoneByIdWithRelatedData(Number(milestoneId));
    await notifyTelegramBot("milestone", { milestone: updatedMilestone });

    return NextResponse.json({ milestoneId }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: "Error processing form" }, { status: 500 });
  }
}
