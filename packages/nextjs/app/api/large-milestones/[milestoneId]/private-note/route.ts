import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { recoverTypedDataAddress } from "viem";
import {
  PrivateNoteModalFormValues,
  privateNoteModalFormSchema,
} from "~~/app/admin/_components/PrivateNoteModal/schema";
import { createLargeMilestonePrivateNote } from "~~/services/database/repositories/large-milestone-private-notes";
import { authOptions } from "~~/utils/auth";
import { EIP_712_DOMAIN, EIP_712_TYPES__LARGE_MILESTONE_PRIVATE_NOTE } from "~~/utils/eip712";

export type MilestonePrivateNoteReqBody = PrivateNoteModalFormValues & { signature: `0x${string}` };

export async function POST(req: NextRequest, { params }: { params: { milestoneId: string } }) {
  try {
    const { milestoneId } = params;
    const session = await getServerSession(authOptions);

    const body = (await req.json()) as MilestonePrivateNoteReqBody;
    const { note, signature } = body;

    const recoveredAddress = await recoverTypedDataAddress({
      domain: EIP_712_DOMAIN,
      types: EIP_712_TYPES__LARGE_MILESTONE_PRIVATE_NOTE,
      primaryType: "Message",
      message: {
        milestoneId,
        note,
      },
      signature,
    });

    if (session?.user.address !== recoveredAddress)
      return NextResponse.json({ error: "Recovered address did not match session address" }, { status: 403 });

    if (session?.user.role !== "admin") {
      return NextResponse.json({ error: "Only admins can review milestones" }, { status: 403 });
    }

    try {
      privateNoteModalFormSchema.parse({ note });
    } catch (err) {
      return NextResponse.json({ error: "Invalid form details submitted" }, { status: 400 });
    }

    const privateNoteId = await createLargeMilestonePrivateNote({
      milestoneId: Number(milestoneId),
      note,
      authorAddress: session.user.address,
    });

    return NextResponse.json({ privateNoteId }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: "Error creating private note" }, { status: 500 });
  }
}
