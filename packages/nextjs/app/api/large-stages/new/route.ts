import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { recoverTypedDataAddress } from "viem";
import { newStageModalFormSchema } from "~~/app/large-grants/[grantId]/_components/CurrentStage/NewStageModal/schema";
import { getLargeGrantById } from "~~/services/database/repositories/large-grants";
import { LargeStageInsertWithMilestones, createStage } from "~~/services/database/repositories/large-stages";
import { notifyTelegramBot } from "~~/services/notifications/telegram";
import { authOptions } from "~~/utils/auth";
import { EIP_712_DOMAIN, EIP_712_TYPES__APPLY_FOR_LARGE_STAGE } from "~~/utils/eip712";

export type CreateNewLargeStageReqBody = LargeStageInsertWithMilestones & { signature: `0x${string}` };

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = (await req.json()) as CreateNewLargeStageReqBody;

    try {
      newStageModalFormSchema.parse({ milestones: body.milestones });
    } catch (err) {
      return NextResponse.json({ error: "Invalid form details submitted" }, { status: 400 });
    }

    const { signature, ...newStage } = body;

    const grant = await getLargeGrantById(newStage.grantId);
    if (!grant) return NextResponse.json({ error: "Grant not found" }, { status: 404 });
    const latestStage = grant.stages[grant.stages.length - 1];

    const recoveredAddress = await recoverTypedDataAddress({
      domain: EIP_712_DOMAIN,
      types: EIP_712_TYPES__APPLY_FOR_LARGE_STAGE,
      primaryType: "Message",
      message: {
        stage_number: (latestStage.stageNumber + 1).toString(),
        milestones: JSON.stringify(newStage.milestones),
      },
      signature,
    });

    if (grant.builderAddress !== session?.user.address)
      return NextResponse.json({ error: "Only owner can apply for new stage" }, { status: 401 });

    if (session?.user.address !== recoveredAddress)
      return NextResponse.json({ error: "Recovered address did not match session address" }, { status: 403 });

    // check if previous stage was completed
    if (latestStage.status !== "completed") {
      return NextResponse.json(
        { error: "Previous stage must be completed before applying for a new stage" },
        { status: 403 },
      );
    }

    const formattedNewStage = {
      ...newStage,
      milestones: newStage.milestones.map(milestone => ({
        ...milestone,
        proposedCompletionDate:
          milestone.proposedCompletionDate instanceof Date
            ? milestone.proposedCompletionDate
            : new Date(milestone.proposedCompletionDate),
      })),
    };

    const createdStage = await createStage({
      grantId: newStage.grantId,
      milestones: formattedNewStage.milestones,
      stageNumber: latestStage.stageNumber + 1,
    });

    await notifyTelegramBot("largeStage", {
      newLargeStage: body,
      largeGrant: grant,
    });

    return NextResponse.json({ stageId: createdStage.stageId }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error creating grant" }, { status: 500 });
  }
}
