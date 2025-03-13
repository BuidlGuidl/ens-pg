import { useRef } from "react";
import Link from "next/link";
import { LargeGrantMilestonesModal } from "./LargeGrantMilestonesModal";
import { formatUnits } from "viem";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Badge } from "~~/components/pg-ens/Badge";
import { Button } from "~~/components/pg-ens/Button";
import { GrantProgressBar } from "~~/components/pg-ens/GrantProgressBar";
import { Address } from "~~/components/scaffold-eth";
import { useAuthSession } from "~~/hooks/pg-ens/useAuthSession";
import { PublicLargeGrant } from "~~/services/database/repositories/large-grants";
import { LargeMilestone } from "~~/services/database/repositories/large-milestones";
import { LargeStage } from "~~/services/database/repositories/large-stages";
import { getFormattedDate } from "~~/utils/getFormattedDate";
import { multilineStringToTsx } from "~~/utils/multiline-string-to-tsx";

type GrantItemProps = {
  grant: PublicLargeGrant;
  latestsShownStatus: "all" | "approved";
};

export const LargeGrantItem = ({ grant, latestsShownStatus }: GrantItemProps) => {
  const milestonesRef = useRef<HTMLDialogElement>(null);
  const { isAdmin } = useAuthSession();

  const latestStage =
    latestsShownStatus === "approved"
      ? (grant.stages.find(
          stage => stage.status === "approved" || stage.status === "completed",
        ) as unknown as LargeStage)
      : grant.stages[0];

  const showProposalTitle =
    latestsShownStatus === "all" &&
    latestStage.stageNumber === 1 &&
    (latestStage.status === "proposed" || latestStage.status === "rejected");

  const allMilestonesGrantAmount = grant.stages
    .flatMap(stage => stage.milestones)
    .reduce((acc, current) => BigInt(acc || 0n) + BigInt(current.amount || 0n), 0n);

  const completedMilestones = grant.stages.flatMap(stage =>
    stage.milestones.filter(milestone => milestone.status === "completed"),
  );

  const completedMilestonesAmount = completedMilestones.reduce(
    (acc, current) => BigInt(acc || 0n) + BigInt(current.amount || 0n),
    0n,
  );

  return (
    <div className="card flex flex-col bg-white text-primary-content w-full max-w-96 shadow-lg rounded-lg overflow-hidden">
      <div className="px-5 py-3 flex justify-between items-center w-full">
        <div className="flex items-center gap-2">
          <div className="font-bold text-xl">{showProposalTitle ? "Proposal" : `Stage ${latestStage.stageNumber}`}</div>
          <Badge status={latestStage.status} size="sm" className="ml-2" />
        </div>
        <div>{getFormattedDate(latestStage.submitedAt as Date)}</div>
      </div>
      <div className="px-5 py-8 bg-gray-100 mb-0 shadow-sm">
        <div className="flex items-start mb-6">
          {isAdmin ? (
            <Link href={`/grants/${grant.id}`} className="hover:underline flex items-start">
              <h2 className="text-2xl font-bold pr-2 flex-grow">{grant.title}</h2>
              <MagnifyingGlassIcon className="flex-shrink-0 w-6 h-6 text-gray-500 mt-1" />
            </Link>
          ) : (
            <h2 className="text-2xl font-bold">{grant.title}</h2>
          )}
        </div>
        <Address address={grant.builderAddress as `0x{string}`} />
      </div>
      <div className="px-5 py-4 w-full">
        <GrantProgressBar
          className="w-full"
          isLargeGrant={true}
          amount={Number(formatUnits(allMilestonesGrantAmount, 6))}
          withdrawn={Number(formatUnits(completedMilestonesAmount || 0n, 6))}
        />
      </div>
      <div className="px-5 pb-5 flex flex-col justify-between flex-grow">
        <div className="text-gray-400 line-clamp-4">{multilineStringToTsx(grant.description)}</div>
        {completedMilestones.length > 0 && (
          <Button
            className="mt-6"
            variant="secondary"
            onClick={() => milestonesRef && milestonesRef.current?.showModal()}
          >
            {completedMilestones.length} Milestone{completedMilestones.length > 1 && "s"}
          </Button>
        )}
        <LargeGrantMilestonesModal
          ref={milestonesRef}
          milestones={completedMilestones as unknown as LargeMilestone[]}
          id={grant.id}
        />
      </div>
    </div>
  );
};
