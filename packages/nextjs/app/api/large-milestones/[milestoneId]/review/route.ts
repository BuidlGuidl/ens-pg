import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { recoverTypedDataAddress } from "viem";
import {
  LargeMilestoneUpdate,
  getMilestoneByIdWithRelatedData,
  updateMilestone,
} from "~~/services/database/repositories/large-milestones";
import { getStageWithMilestones, updateStageStatusToCompleted } from "~~/services/database/repositories/large-stages";
import { authOptions } from "~~/utils/auth";
import { EIP_712_DOMAIN, EIP_712_TYPES__REVIEW_LARGE_MILESTONE } from "~~/utils/eip712";

export type ReviewMilestoneBody = {
  status: Required<LargeMilestoneUpdate>["status"];
  verifiedTx?: LargeMilestoneUpdate["verifiedTx"];
  paymentTx?: LargeMilestoneUpdate["paymentTx"];
  statusNote?: LargeMilestoneUpdate["statusNote"];
  completionProof?: LargeMilestoneUpdate["completionProof"];
  signature: `0x${string}`;
};

export async function POST(req: NextRequest, { params }: { params: { milestoneId: string } }) {
  try {
    const { milestoneId } = params;
    const body = (await req.json()) as ReviewMilestoneBody;
    const session = await getServerSession(authOptions);
    const milestone = await getMilestoneByIdWithRelatedData(Number(milestoneId));

    if (!milestone) return NextResponse.json({ error: "Milestone not found" }, { status: 404 });

    const recoveredAddress = await recoverTypedDataAddress({
      domain: EIP_712_DOMAIN,
      types: EIP_712_TYPES__REVIEW_LARGE_MILESTONE,
      primaryType: "Message",
      message: {
        milestoneId,
        action: body.status,
        txHash: body.verifiedTx || body.paymentTx || "",
        statusNote: body.statusNote || "",
      },
      signature: body.signature,
    });

    if (body.status === "completed" && session?.user.address !== milestone.stage.grant.builderAddress) {
      return NextResponse.json({ error: "Only grant owner can complete milestones" }, { status: 401 });
    }

    if (body.status !== "completed" && session?.user.role !== "admin") {
      return NextResponse.json({ error: "Only admins can review milestones" }, { status: 401 });
    }

    if (session?.user.address !== recoveredAddress)
      return NextResponse.json({ error: "Recovered address did not match session address" }, { status: 403 });

    if (body.status === "verified" && !body.verifiedTx) {
      return NextResponse.json({ error: "Verified milestones must have a transaction hash" }, { status: 400 });
    }

    if (body.status === "paid" && !body.paymentTx) {
      return NextResponse.json({ error: "Paid milestones must have a transaction hash" }, { status: 400 });
    }

    if (body.status === "paid" && milestone.status !== "verified") {
      return NextResponse.json({ error: "Milestone not verified yet" }, { status: 400 });
    }

    const verifiedObj =
      body.status === "verified"
        ? {
            verifiedTx: body.verifiedTx,
            verifiedAt: new Date(),
            verifiedBy: session?.user.address,
          }
        : {};

    const paymentObj =
      body.status === "paid"
        ? {
            paymentTx: body.paymentTx,
            paidAt: new Date(),
            paidBy: session?.user.address,
          }
        : {};

    const completedObj =
      body.status === "completed"
        ? {
            completedAt: new Date(),
          }
        : {};

    await updateMilestone(Number(milestoneId), {
      status: body.status,
      statusNote: session?.user.role === "admin" ? body.statusNote : undefined,
      completionProof: body.completionProof,
      ...verifiedObj,
      ...paymentObj,
      ...completedObj,
    });

    // check if this is the last milestone of the stage and update the stage status to "completed"
    if (body.status === "paid") {
      const stage = milestone.stage;
      const stageWithMilestones = await getStageWithMilestones(stage.id);
      const allMilestonesPaid = stageWithMilestones
        ? stageWithMilestones.milestones.every(m => m.status === "paid")
        : false;

      if (allMilestonesPaid) {
        await updateStageStatusToCompleted(stage.id);
      }
    }

    return NextResponse.json({ milestoneId, status: body.status }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: "Error processing form" }, { status: 500 });
  }
}
