"use client";

import { BuilderGrantsResponse } from "../api/builders/[builderAddress]/grants/route";
import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";
import { useAccount } from "wagmi";
import { ChatBubbleOvalLeftEllipsisIcon } from "@heroicons/react/24/outline";
import { Badge } from "~~/components/pg-ens/Badge";
import { Button } from "~~/components/pg-ens/Button";
import { StyledTooltip } from "~~/components/pg-ens/StyledTooltip";
import { multilineStringToTsx } from "~~/utils/multiline-string-to-tsx";
import { fetcher } from "~~/utils/react-query";

type GrantsListProps = { address?: Address };

export const GrantsList = ({ address }: GrantsListProps) => {
  const { address: connectedAddress } = useAccount();

  const builderAddress = address || connectedAddress;

  const {
    data: builderGrants,
    isPending,
    isError,
  } = useQuery({
    queryKey: ["grants", { address: connectedAddress }],
    queryFn: () => fetcher<BuilderGrantsResponse>(`/api/builders/${builderAddress}/grants`),
  });

  if (isError) {
    return <div className="text-2xl">Error loading grants</div>;
  }

  if (isPending) {
    return <div className="text-2xl">Loading...</div>;
  }

  if (!builderGrants?.length) {
    return (
      <div className="text-xl text-gray-500">
        No grants found. You can{" "}
        <a href="/apply" className="text-primary hover:underline">
          apply for a grant
        </a>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl grid sm:grid-cols-2 gap-8 mb-10">
      {builderGrants.map((grant, grantIdx) => {
        const latestStage = grant.stages[0];
        const showGrantDetailsButton = latestStage.status !== "rejected" || latestStage.stageNumber > 1;
        const showProposalTitle =
          latestStage.stageNumber === 1 && (latestStage.status === "proposed" || latestStage.status === "rejected");
        return (
          <div
            key={grant.id}
            className={`flex flex-col items-center ${grantIdx % 2 ? "sm:items-end" : "sm:items-start"}`}
          >
            <div className="card flex flex-col flex-grow bg-white text-primary-content w-full max-w-96 shadow-xl">
              <div className="px-5 py-3 flex justify-between items-center w-full">
                <div className="font-bold text-xl">
                  {showProposalTitle ? "Proposal" : `Stage ${latestStage.stageNumber}`}
                </div>

                <div className="flex items-center">
                  <Badge status={latestStage.status} />
                  {latestStage.statusNote && (
                    <>
                      <span data-tooltip-id={`tooltip-${grant.id}`} className="ml-2">
                        <ChatBubbleOvalLeftEllipsisIcon className="h-7 w-7 text-gray-400" />
                      </span>
                      <StyledTooltip id={`tooltip-${grant.id}`}>
                        {multilineStringToTsx(latestStage.statusNote)}
                      </StyledTooltip>
                    </>
                  )}
                </div>
              </div>
              <h2 className="px-5 py-8 text-2xl font-bold bg-gray-100">{grant.title}</h2>
              <div className="p-5 flex flex-col justify-between flex-grow">
                <div className="text-gray-400 line-clamp-4">{multilineStringToTsx(grant.description)}</div>
                {showGrantDetailsButton && (
                  <Button
                    className="mt-6"
                    variant="secondary"
                    link
                    href={`/${grant.type == "largeGrant" ? "large-" : ""}grants/${grant.id}`}
                  >
                    Grant details
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
