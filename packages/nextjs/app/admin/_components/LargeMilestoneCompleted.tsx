"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LargeMilestoneApprovalModal } from "./LargeMilestoneApprovalModal";
import { LargeMilestoneRejectModal } from "./LargeMilestoneRejectModal";
import { MilestonePrivateNoteModal } from "./MilestonePrivateNoteModal";
import { useAccount } from "wagmi";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { Button } from "~~/components/pg-ens/Button";
import { FormErrorMessage } from "~~/components/pg-ens/form-fields/FormErrorMessage";
import { Address } from "~~/components/scaffold-eth";
import { getCompletedOrVerifiedMilestones } from "~~/services/database/repositories/large-milestones";
import { getFormattedDateWithDay } from "~~/utils/getFormattedDate";
import { multilineStringToTsx } from "~~/utils/multiline-string-to-tsx";

function isElementClamped(element: HTMLElement | null) {
  if (!element) return false;
  return element.scrollHeight > element.clientHeight;
}

export type LargeMilestoneWithRelatedData = Awaited<ReturnType<typeof getCompletedOrVerifiedMilestones>>[0];

export const LargeMilestoneCompleted = ({ milestone }: { milestone: LargeMilestoneWithRelatedData }) => {
  const milesonesRef = useRef<HTMLDivElement>(null);
  const [isDefaultExpanded, setIsDefaultExpanded] = useState(true);
  const [isExpandedByClick, setIsExpandedByClick] = useState(false);
  const [canVote, setCanVote] = useState(true);
  const { address } = useAccount();

  const privateNoteModalRef = useRef<HTMLDialogElement>(null);
  const approvalModalRef = useRef<HTMLDialogElement>(null);
  const rejectModalRef = useRef<HTMLDialogElement>(null);

  const latestStage = milestone.stage;
  const privateNotes = milestone.privateNotes;

  const isFinalApproveAvailable = milestone.status === "verified";

  useEffect(() => {
    // waits for render to calculate
    setIsDefaultExpanded(!isElementClamped(milesonesRef.current));
  }, []);

  useEffect(() => {
    setCanVote(milestone.verifiedBy !== address);
  }, [milestone.verifiedBy, address]);

  return (
    <div className="card bg-white text-primary-content w-full max-w-lg shadow-center">
      <div className="px-5 py-3 flex justify-between items-center w-full">
        <div className="font-bold text-xl flex items-center">
          <div className="rounded-full bg-primary h-3.5 w-3.5 min-w-3.5 mr-2" />
          Milestone {milestone.milestoneNumber} - Stage {latestStage.stageNumber}
        </div>
        <div>{milestone.completedAt && getFormattedDateWithDay(milestone.completedAt)}</div>
      </div>
      <div className={`px-5 pt-5 bg-gray-100 ${isFinalApproveAvailable ? "pb-2" : "pb-5"}`}>
        <div className="flex justify-between items-center gap-2 mb-2">
          <h2 className="text-2xl font-bold mb-0">{milestone.stage.grant.title}</h2>
          <div className="bg-white rounded-lg p-1 h-8 whitespace-nowrap">
            {milestone.amount.toLocaleString()}&nbsp;USDC
          </div>
        </div>
        <div className="flex justify-between gap-2">
          <Link
            href={`/large-grants/${milestone.stage.grant.id}`}
            className="text-gray-500 underline flex items-center gap-1"
            target="_blank"
          >
            View grant <ArrowTopRightOnSquareIcon className="w-5 h-5" />
          </Link>
          <div className="font-semibold">
            <span>Deadline:</span> {getFormattedDateWithDay(milestone.proposedCompletionDate)}
          </div>
        </div>
        {isFinalApproveAvailable && (
          <div className="flex gap-1 justify-end mt-2">
            <div className="tooltip tooltip-left" data-tip={`Pre-approved by ${milestone.verifiedBy}`}>
              <div>👍</div>
            </div>
          </div>
        )}
      </div>

      <div className="p-5">
        <div>
          <div className={isExpandedByClick ? "" : "line-clamp-2"} ref={milesonesRef}>
            <div>
              <span className="font-semibold">Description:</span>
              {multilineStringToTsx(milestone.description)}
            </div>
            <div className="mt-2">
              <span className="font-semibold">Proposed Deliverables:</span>
              {multilineStringToTsx(milestone.proposedDeliverables)}
            </div>
            {milestone.completionProof && (
              <div className="mt-2">
                <span className="font-semibold">Completion Proof:</span>
                {multilineStringToTsx(milestone.completionProof)}
              </div>
            )}
          </div>
          {!isDefaultExpanded && !isExpandedByClick && (
            <button className="bg-transparent font-semibold underline" onClick={() => setIsExpandedByClick(true)}>
              Read more
            </button>
          )}
        </div>

        <div className="flex flex-col 2xl:flex-row-reverse 2xl:items-start justify-between gap-3 mt-4">
          <div className="flex flex-col 2xl:flex-row 2xl:items-start gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => privateNoteModalRef && privateNoteModalRef.current?.showModal()}
            >
              Set private note
            </Button>

            <div className="flex flex-col gap-1">
              <Button
                variant={`green${isFinalApproveAvailable ? "" : "-secondary"}`}
                size="sm"
                onClick={() => approvalModalRef && approvalModalRef.current?.showModal()}
                disabled={!canVote}
              >
                {isFinalApproveAvailable ? "Final Approve" : "Vote for approval"}
              </Button>
              {!canVote && <FormErrorMessage error="Already voted" className="text-center" />}
            </div>
          </div>
          <Button variant="red" size="sm" onClick={() => rejectModalRef && rejectModalRef.current?.showModal()}>
            Reject
          </Button>
        </div>

        {privateNotes?.length > 0 && (
          <div className="mt-5 pt-3 border-t border-gray-200">
            {privateNotes.map(privateNote => (
              <div key={privateNote.id} className="mt-1 first:mt-0 text-gray-400">
                <div className="flex gap-1">
                  <Address address={privateNote.authorAddress as `0x${string}`} /> :
                </div>
                <div className="ml-[30px]">{multilineStringToTsx(privateNote.note)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <LargeMilestoneApprovalModal
        ref={approvalModalRef}
        milestone={milestone}
        closeModal={() => approvalModalRef.current?.close()}
      />
      <LargeMilestoneRejectModal ref={rejectModalRef} milestone={milestone} />
      <MilestonePrivateNoteModal
        ref={privateNoteModalRef}
        milestone={milestone}
        closeModal={() => privateNoteModalRef.current?.close()}
      />
    </div>
  );
};
