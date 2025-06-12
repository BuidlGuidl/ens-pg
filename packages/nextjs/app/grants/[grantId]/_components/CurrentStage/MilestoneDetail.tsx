"use client";

import { useRef } from "react";
import { WithdrawModal } from "./WithdrawModal";
import { formatEther } from "viem";
import { BadgeMilestone } from "~~/components/pg-ens/BadgeMilestone";
import { Button } from "~~/components/pg-ens/Button";
import { Milestone } from "~~/services/database/repositories/milestones";
import { Stage } from "~~/services/database/repositories/stages";
import { getFormattedDateWithDay } from "~~/utils/getFormattedDate";
import { multilineStringToTsx } from "~~/utils/multiline-string-to-tsx";

type MilestoneDetailProps = {
  milestone: Milestone;
  stage: Stage;
  contractGrantId?: bigint;
  refetchContractInfo: () => Promise<any>;
};

export const MilestoneDetail = ({ milestone, stage, contractGrantId, refetchContractInfo }: MilestoneDetailProps) => {
  const withdrawModalRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <div className="bg-secondary px-4 sm:px-8 py-4 mt-6 flex flex-col gap-4 rounded-xl">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-xl font-bold">Milestone {milestone.milestoneNumber}</div>
          </div>
          <div className="bg-white rounded-lg p-1 font-bold">
            {milestone.grantedAmount ? formatEther(milestone.grantedAmount) : formatEther(milestone.requestedAmount)}{" "}
            ETH
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div>{multilineStringToTsx(milestone.description)}</div>
          <div>
            <span className="font-semibold">Proposed Deliverables:</span>{" "}
            {multilineStringToTsx(milestone.proposedDeliverables)}
          </div>
          {milestone.completionProof && (
            <div>
              <span className="font-semibold">Completion Proof:</span> {multilineStringToTsx(milestone.completionProof)}
            </div>
          )}
          {milestone.status === "approved" ? (
            <Button
              className="w-auto self-start"
              size="sm"
              onClick={() => {
                withdrawModalRef.current?.showModal();
              }}
            >
              Withdraw
            </Button>
          ) : (
            milestone.status !== "proposed" && (
              <div className="flex flex-row">
                <BadgeMilestone status={milestone.status} />
                {["rejected", "paid"].includes(milestone.status) && milestone.statusNote && (
                  <div className="mt-2 ml-4 text-sm font-bold text-gray-400">
                    {milestone.status === "rejected" ? "Rejection notes" : "Note"}: {milestone.statusNote}
                  </div>
                )}
                {milestone.status === "paid" && milestone.paidAt && (
                  <div className="mt-2 ml-4 text-sm font-bold text-gray-400">
                    Paid on {getFormattedDateWithDay(milestone.paidAt)} -
                    <a
                      href={`https://optimistic.etherscan.io/tx/${milestone.paymentTx}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-1 underline"
                    >
                      See transaction details
                    </a>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </div>

      <WithdrawModal
        ref={withdrawModalRef}
        stage={stage}
        closeModal={() => withdrawModalRef.current?.close()}
        contractGrantId={contractGrantId}
        refetchContractInfo={refetchContractInfo}
      />
    </>
  );
};
