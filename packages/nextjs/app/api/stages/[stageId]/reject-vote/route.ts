import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { recoverTypedDataAddress } from "viem";
import { createRejectVote } from "~~/services/database/repositories/reject-votes";
import { StageUpdate, getStageByIdWithGrantAndVotes, updateStage } from "~~/services/database/repositories/stages";
import { MINIMAL_VOTES_FOR_FINAL_APPROVAL } from "~~/utils/approval-votes";
import { authOptions } from "~~/utils/auth";
import { EIP_712_DOMAIN, EIP_712_TYPES__STAGE_REJECT_VOTE } from "~~/utils/eip712";

export type RejectVoteReqBody = { statusNote?: StageUpdate["statusNote"]; signature: `0x${string}` };

export async function POST(req: NextRequest, { params }: { params: { stageId: string } }) {
  try {
    const { stageId } = params;
    const session = await getServerSession(authOptions);

    const body = (await req.json()) as RejectVoteReqBody;
    const signature = body.signature;

    const recoveredAddress = await recoverTypedDataAddress({
      domain: EIP_712_DOMAIN,
      types: EIP_712_TYPES__STAGE_REJECT_VOTE,
      primaryType: "Message",
      message: {
        stageId,
        statusNote: body.statusNote || "",
      },
      signature,
    });

    if (session?.user.address !== recoveredAddress)
      return NextResponse.json({ error: "Recovered address did not match session address" }, { status: 403 });

    if (session?.user.role !== "admin") {
      return NextResponse.json({ error: "Only admins can reject stages" }, { status: 403 });
    }

    const rejectVoteId = await createRejectVote({
      stageId: Number(stageId),
      authorAddress: session.user.address,
    });

    const stage = await getStageByIdWithGrantAndVotes(Number(stageId));
    if (stage && stage.rejectVotes.length === MINIMAL_VOTES_FOR_FINAL_APPROVAL) {
      await updateStage(Number(stageId), {
        status: "rejected",
        statusNote: body.statusNote || "",
      });
    }

    return NextResponse.json({ rejectVoteId }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: "Error creating reject vote" }, { status: 500 });
  }
}
