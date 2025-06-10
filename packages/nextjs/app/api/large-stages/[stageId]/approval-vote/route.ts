import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { recoverTypedDataAddress } from "viem";
import { createLargeApprovalVote } from "~~/services/database/repositories/large-approval-votes";
import { authOptions } from "~~/utils/auth";
import { EIP_712_DOMAIN, EIP_712_TYPES__LARGE_STAGE_APPROVAL_VOTE } from "~~/utils/eip712";

export type ApprovalVoteReqBody = { signature: `0x${string}` };

export async function POST(req: NextRequest, { params }: { params: { stageId: string } }) {
  try {
    const { stageId } = params;
    const session = await getServerSession(authOptions);

    const body = (await req.json()) as ApprovalVoteReqBody;
    const { signature } = body;

    const recoveredAddress = await recoverTypedDataAddress({
      domain: EIP_712_DOMAIN,
      types: EIP_712_TYPES__LARGE_STAGE_APPROVAL_VOTE,
      primaryType: "Message",
      message: {
        stageId,
      },
      signature,
    });

    if (session?.user.address !== recoveredAddress)
      return NextResponse.json({ error: "Recovered address did not match session address" }, { status: 403 });

    if (session?.user.role !== "admin") {
      return NextResponse.json({ error: "Only admins can review stages" }, { status: 403 });
    }

    const approvalVoteId = await createLargeApprovalVote({
      stageId: Number(stageId),
      authorAddress: session.user.address,
    });

    return NextResponse.json({ approvalVoteId }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: "Error creating approval vote" }, { status: 500 });
  }
}
