import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { recoverTypedDataAddress } from "viem";
import {
  PrivateNoteModalFormValues,
  privateNoteModalFormSchema,
} from "~~/app/admin/_components/PrivateNoteModal/schema";
import { createLargePrivateNote } from "~~/services/database/repositories/large-private-notes";
import { createPrivateNote } from "~~/services/database/repositories/private-notes";
import { authOptions } from "~~/utils/auth";
import { EIP_712_DOMAIN, EIP_712_TYPES__STAGE_PRIVATE_NOTE } from "~~/utils/eip712";

export type StagePrivateNoteReqBody = PrivateNoteModalFormValues & { signature: `0x${string}` };

export async function createPrivateNoteRequest(
  req: NextRequest,
  { params, isLargeGrant }: { params: { stageId: string }; isLargeGrant: boolean },
) {
  try {
    const { stageId } = params;
    const session = await getServerSession(authOptions);

    const body = (await req.json()) as StagePrivateNoteReqBody;
    const { note, signature } = body;

    const recoveredAddress = await recoverTypedDataAddress({
      domain: EIP_712_DOMAIN,
      types: EIP_712_TYPES__STAGE_PRIVATE_NOTE,
      primaryType: "Message",
      message: {
        note,
      },
      signature,
    });

    if (session?.user.address !== recoveredAddress)
      return NextResponse.json({ error: "Recovered address did not match session address" }, { status: 403 });

    if (session?.user.role !== "admin") {
      return NextResponse.json({ error: "Only admins can review stages" }, { status: 403 });
    }

    try {
      privateNoteModalFormSchema.parse({ note });
    } catch (err) {
      return NextResponse.json({ error: "Invalid form details submitted" }, { status: 400 });
    }

    let privateNoteId;
    if (isLargeGrant) {
      privateNoteId = await createLargePrivateNote({
        stageId: Number(stageId),
        note,
        authorAddress: session.user.address,
      });
    } else {
      privateNoteId = await createPrivateNote({
        stageId: Number(stageId),
        note,
        authorAddress: session.user.address,
      });
    }

    return NextResponse.json({ privateNoteId }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: "Error creating private note" }, { status: 500 });
  }
}
