import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createPublicClient, http, parseEther, recoverTypedDataAddress } from "viem";
import { newStageModalFormSchema } from "~~/app/grants/[grantId]/_components/CurrentStage/NewStageModal/schema";
import deployedContracts from "~~/contracts/deployedContracts";
import scaffoldConfig from "~~/scaffold.config";
import { getGrantById } from "~~/services/database/repositories/grants";
import {
  StageInsertWithMilestones,
  createStage,
  updateStageStatusToCompleted,
} from "~~/services/database/repositories/stages";
import { notifyTelegramBot } from "~~/services/notifications/telegram";
import { authOptions } from "~~/utils/auth";
import { EIP_712_DOMAIN, EIP_712_TYPES__APPLY_FOR_STAGE } from "~~/utils/eip712";
import { getAlchemyHttpUrl } from "~~/utils/scaffold-eth";

export type CreateNewStageReqBody = StageInsertWithMilestones & { signature: `0x${string}` };

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = (await req.json()) as CreateNewStageReqBody;

    try {
      newStageModalFormSchema.parse({ milestones: body.milestones });
    } catch (err) {
      return NextResponse.json({ error: "Invalid form details submitted" }, { status: 400 });
    }

    const { signature, ...newStage } = body;

    const totalAmount = newStage.milestones.reduce((sum, milestone) => sum + BigInt(milestone.requestedAmount), 0n);
    if (totalAmount > parseEther("2")) {
      return NextResponse.json({ error: "Total requested funds should not exceed 2 ETH" }, { status: 400 });
    }

    const grant = await getGrantById(newStage.grantId);
    if (!grant) return NextResponse.json({ error: "Grant not found" }, { status: 404 });
    const latestStage = grant.stages[0];

    const recoveredAddress = await recoverTypedDataAddress({
      domain: EIP_712_DOMAIN,
      types: EIP_712_TYPES__APPLY_FOR_STAGE,
      primaryType: "Message",
      message: { stage_number: (latestStage.stageNumber + 1).toString(), milestones: JSON.stringify(body.milestones) },
      signature,
    });

    if (grant.builderAddress !== session?.user.address)
      return NextResponse.json({ error: "Only owner can apply for new stage" }, { status: 401 });

    if (session?.user.address !== recoveredAddress)
      return NextResponse.json({ error: "Recovered address did not match session address" }, { status: 403 });

    // check if previous stage was completed
    if (latestStage.status !== "completed") {
      const targetNetwork = scaffoldConfig.targetNetworks[0];

      // try if the contract amount left is 0, if so mark the stage as completed
      // We have this check incase ponder fails to hit `/revalidate-status`
      const publicClient = createPublicClient({
        chain: targetNetwork,
        cacheTime: 0,
        transport: http(getAlchemyHttpUrl(targetNetwork.id), {
          fetchOptions: {
            headers: {
              Origin: "https://builder.ensgrants.xyz",
              Referer: "https://builder.ensgrants.xyz",
            },
          },
        }),
      });

      const contractConfig = {
        address: deployedContracts[targetNetwork.id].Stream.address,
        abi: deployedContracts[targetNetwork.id].Stream.abi,
      } as const;

      const contractGrantId = await publicClient.readContract({
        ...contractConfig,
        functionName: "getGrantIdByBuilderAndGrantNumber",
        // @ts-expect-error: grantNumber is safe to convert to BigInt
        args: [grant.builderAddress, BigInt(grant.grantNumber)],
      });

      const grantInfo = await publicClient.readContract({
        ...contractConfig,
        functionName: "grantStreams",
        args: [contractGrantId],
      });

      const amountLeft = grantInfo[2];
      const grantBuilderAddress = grantInfo[5];

      if (grantBuilderAddress !== grant.builderAddress || amountLeft !== 0n) {
        console.log("Cannot complete stage, it has some amount left");
        return NextResponse.json(
          { error: `Previous stage ${latestStage.stageNumber} must be completed before creating a new stage` },
          { status: 400 },
        );
      }

      await updateStageStatusToCompleted(latestStage.id);
    }

    const createdStage = await createStage({
      grantId: newStage.grantId,
      milestones: newStage.milestones,
      stageNumber: latestStage.stageNumber + 1,
    });

    await notifyTelegramBot("stage", {
      newStage: body,
      grant: grant,
    });

    return NextResponse.json({ grantId: newStage.grantId, stageId: createdStage.stageId }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error creating grant" }, { status: 500 });
  }
}
