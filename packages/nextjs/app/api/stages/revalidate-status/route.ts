import { NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import deployedContracts from "~~/contracts/deployedContracts";
import scaffoldConfig from "~~/scaffold.config";
import {
  findStageByGrantNumberStageNumberAndBuilderAddress,
  updateStageStatusToCompleted,
} from "~~/services/database/repositories/stages";
import { getAlchemyHttpUrl } from "~~/utils/scaffold-eth";

export async function POST(request: Request) {
  try {
    const { grantNumber, stageNumber, builderAddress, contractGrantId } = await request.json();
    console.log(
      "Hitting the endpoint with grantNumber, stageNumber, builderAddress, contractGrantId",
      grantNumber,
      stageNumber,
      builderAddress,
      contractGrantId,
    );

    const result = await findStageByGrantNumberStageNumberAndBuilderAddress(grantNumber, stageNumber, builderAddress);

    if (!result) {
      return NextResponse.json({ message: "No matching stage found" }, { status: 404 });
    }

    if (result[0].stage.status !== "approved") {
      console.log("Cannot complete stage before approval or stage is already complete");
      return NextResponse.json(
        { message: "Cannot complete stage before approval or stage is already complete" },
        { status: 403 },
      );
    }

    const targetNetwork = scaffoldConfig.targetNetworks[0];
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

    const grantInfo = await publicClient.readContract({
      address: deployedContracts[targetNetwork.id].Stream.address,
      abi: deployedContracts[targetNetwork.id].Stream.abi,
      functionName: "grantStreams",
      args: [contractGrantId],
    });

    if (!grantInfo) {
      return NextResponse.json({ message: "No matching grant found in contract" }, { status: 404 });
    }

    const amountLeft = grantInfo[2];
    const grantBuilderAddress = grantInfo[5];
    if (grantBuilderAddress !== result[0].grant?.builderAddress) {
      return NextResponse.json(
        { message: "Builder address does not match the contract grant builder address" },
        { status: 403 },
      );
    }

    if (amountLeft !== 0n) {
      return NextResponse.json({ message: "Cannot complete stage, it has some amount left" }, { status: 403 });
    }

    await updateStageStatusToCompleted(result[0].stage.id);

    return NextResponse.json({ message: "Stage status updated to completed" }, { status: 200 });
  } catch (error) {
    console.error("Error finding stage:", error);
    return NextResponse.json({ error: "Failed to find stage" }, { status: 500 });
  }
}
