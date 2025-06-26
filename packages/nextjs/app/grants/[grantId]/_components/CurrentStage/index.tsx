"use client";

import { useRef } from "react";
import { GrantWithStages } from "../../page";
import { MilestoneDetail } from "./MilestoneDetail";
import { NewStageModal } from "./NewStageModal";
import { formatEther } from "viem";
import { Badge } from "~~/components/pg-ens/Badge";
import { Button } from "~~/components/pg-ens/Button";
import { GrantProgressBar } from "~~/components/pg-ens/GrantProgressBar";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

type CurrentStageProps = {
  grant: NonNullable<GrantWithStages>;
};

export const CurrentStage = ({ grant }: CurrentStageProps) => {
  const latestStage = grant.stages[0];

  const { data: contractGrantId } = useScaffoldReadContract({
    contractName: "Stream",
    functionName: "getGrantIdByBuilderAndGrantNumber",
    // @ts-expect-error: grantNumber is safe to convert to BigInt
    args: [grant.builderAddress, BigInt(grant.grantNumber)],
  });

  const { data: contractGrantInfo, refetch: refetchGrantInfo } = useScaffoldReadContract({
    contractName: "Stream",
    functionName: "grantStreams",
    args: [contractGrantId],
  });

  const { data: unlockedAmount, refetch: refetchUnlockedAmount } = useScaffoldReadContract({
    contractName: "Stream",
    functionName: "unlockedGrantAmount",
    args: [contractGrantId],
  });

  const [cap = BigInt(0), , amountLeft = BigInt(0)] = contractGrantInfo ?? [];
  const amountWithdrawn = cap - amountLeft;

  const newStageModalRef = useRef<HTMLDialogElement>(null);

  return (
    <div className="w-full max-w-5xl">
      <div className="flex gap-8">
        <span className="text-2xl font-bold">Stage {latestStage.stageNumber}</span>
        <Badge status={latestStage.status} />
      </div>
      {(latestStage.status === "approved" || latestStage.status === "completed") && (
        <div className="bg-white px-4 sm:px-12 py-4 sm:py-10 mt-6 flex flex-col sm:flex-row gap-4 justify-between items-center rounded-xl">
          {((contractGrantInfo && amountLeft === BigInt(0)) || latestStage.status === "completed") && (
            <Button onClick={() => newStageModalRef && newStageModalRef.current?.showModal()}>
              Apply for new stage
            </Button>
          )}

          <GrantProgressBar
            className={`w-full ${
              (contractGrantInfo && amountLeft === BigInt(0)) || latestStage.status === "completed" ? "sm:w-1/2" : ""
            }`}
            amount={Number(formatEther(cap))}
            withdrawn={Number(formatEther(amountWithdrawn as unknown as bigint))}
            available={Number(formatEther(unlockedAmount ?? BigInt(0)))}
          />
        </div>
      )}

      {latestStage.milestones.map(milestone => (
        <MilestoneDetail
          milestone={milestone}
          key={milestone.id}
          contractGrantId={contractGrantId}
          refetchContractInfo={async () => {
            await Promise.all([refetchGrantInfo(), refetchUnlockedAmount()]);
          }}
        />
      ))}

      <NewStageModal
        ref={newStageModalRef}
        previousStage={latestStage}
        grantId={grant.id}
        closeModal={() => newStageModalRef.current?.close()}
      />
    </div>
  );
};
