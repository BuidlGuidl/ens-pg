import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { recoverTypedDataAddress } from "viem";
import { createLargeApprovalVote } from "~~/services/database/repositories/large-approval-votes";
import {
  LargeStageUpdate,
  approveStage,
  getStageByIdWithGrantAndVotes,
  updateStage,
} from "~~/services/database/repositories/large-stages";
import { MINIMAL_VOTES_FOR_FINAL_APPROVAL } from "~~/utils/approval-votes";
import { authOptions } from "~~/utils/auth";
import { EIP_712_DOMAIN, EIP_712_TYPES__REVIEW_LARGE_STAGE } from "~~/utils/eip712";

export type ReviewStageBody = {
  status: Required<LargeStageUpdate>["status"];
  approvedTx?: LargeStageUpdate["approvedTx"];
  statusNote?: LargeStageUpdate["statusNote"];
  signature: `0x${string}`;
};

export async function POST(req: NextRequest, { params }: { params: { stageId: string } }) {
  try {
    const { stageId } = params;
    const body = (await req.json()) as ReviewStageBody;
    const session = await getServerSession(authOptions);
    const stage = await getStageByIdWithGrantAndVotes(Number(stageId));

    const recoveredAddress = await recoverTypedDataAddress({
      domain: EIP_712_DOMAIN,
      types: EIP_712_TYPES__REVIEW_LARGE_STAGE,
      primaryType: "Message",
      message: {
        stageId,
        action: body.status,
        txHash: body.approvedTx || "",
        statusNote: body.statusNote || "",
      },
      signature: body.signature,
    });

    if (body.status === "completed" && session?.user.address !== stage?.grant.builderAddress) {
      return NextResponse.json({ error: "Only grant owner can complete stages" }, { status: 401 });
    }

    // TODO: Don't do admin check if the status is completed. The status will be marked completed probably through contract event
    if (body.status !== "completed" && session?.user.role !== "admin") {
      return NextResponse.json({ error: "Only admins can review stages" }, { status: 401 });
    }

    if (session?.user.address !== recoveredAddress)
      return NextResponse.json({ error: "Recovered address did not match session address" }, { status: 403 });

    if (body.status === "approved" && !body.approvedTx) {
      return NextResponse.json({ error: "Approved grants must have a transaction hash" }, { status: 400 });
    }

    if (
      body.status === "approved" &&
      (!stage?.approvalVotes || stage.approvalVotes.length + 1 < MINIMAL_VOTES_FOR_FINAL_APPROVAL)
    ) {
      return NextResponse.json({ error: "Not enough votes for final approval" }, { status: 400 });
    }

    const approvedObj = body.approvedTx
      ? {
          approvedTx: body.approvedTx,
          approvedAt: new Date(),
        }
      : {};

    if (body.status === "approved") {
      // Create approval vote
      await createLargeApprovalVote({
        stageId: Number(stageId),
        authorAddress: session.user.address,
      });

      await approveStage(Number(stageId), {
        statusNote: body.statusNote,
        ...approvedObj,
      });
    } else {
      await updateStage(Number(stageId), {
        status: body.status,
        statusNote: body.statusNote,
        ...approvedObj,
      });
    }

    return NextResponse.json({ stageId, status: body.status }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: "Error processing form" }, { status: 500 });
  }
}
