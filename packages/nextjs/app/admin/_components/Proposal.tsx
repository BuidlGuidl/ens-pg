"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ApproveModal } from "./ApproveModal";
import { PrivateNoteModal } from "./PrivateNoteModal";
import { RejectModal } from "./RejectModal";
import { formatEther } from "viem";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { Button } from "~~/components/pg-ens/Button";
import { Address } from "~~/components/scaffold-eth";
import { getAllGrantsWithStagesAndPrivateNotes } from "~~/services/database/repositories/grants";
import { getFormattedDate } from "~~/utils/getFormattedDate";
import { multilineStringToTsx } from "~~/utils/multiline-string-to-tsx";

function isElementClamped(element: HTMLElement | null) {
  if (!element) return false;
  return element.scrollHeight > element.clientHeight;
}

export type GrantWithStagesAndPrivateNotes = Awaited<ReturnType<typeof getAllGrantsWithStagesAndPrivateNotes>>[0];

type ProposalProps = { proposal: GrantWithStagesAndPrivateNotes; userSubmissionsAmount: number };

export const Proposal = ({ proposal, userSubmissionsAmount }: ProposalProps) => {
  const milesonesRef = useRef<HTMLDivElement>(null);
  const [isDefaultExpanded, setIsDefaultExpanded] = useState(true);
  const [isExpandedByClick, setIsExpandedByClick] = useState(false);

  const privateNoteModalRef = useRef<HTMLDialogElement>(null);
  const approveModalRef = useRef<HTMLDialogElement>(null);
  const rejectModalRef = useRef<HTMLDialogElement>(null);

  const latestStage = proposal.stages[0];
  const { privateNotes } = latestStage;

  useEffect(() => {
    // waits for render to calculate
    setIsDefaultExpanded(!isElementClamped(milesonesRef.current));
  }, []);

  return (
    <div className="card bg-white text-primary-content w-full max-w-lg shadow-center">
      <div className="px-5 py-3 flex justify-between items-center w-full">
        <div className="font-bold text-xl">Stage {latestStage.stageNumber}</div>
        <div>{getFormattedDate(latestStage.submitedAt as Date)}</div>
      </div>
      <div className="px-5 py-8 bg-gray-100">
        <h2 className="text-2xl font-bold mb-0">{proposal.title}</h2>
        <Link
          href={`/grants/${proposal.id}`}
          className="text-gray-500 underline flex items-center gap-1"
          target="_blank"
        >
          View grant page <ArrowTopRightOnSquareIcon className="w-5 h-5" />
        </Link>
        <div className="mt-6 flex flex-col lg:flex-row gap-1">
          <Address address={proposal.builderAddress} />
          <span className="hidden lg:inline">·</span>
          <Link
            href={`/builder-grants/${proposal.builderAddress}`}
            className="text-gray-500 underline flex items-center gap-1"
            target="_blank"
          >
            <span>
              {userSubmissionsAmount} submission{userSubmissionsAmount === 1 ? "" : "s"}
            </span>
            <ArrowTopRightOnSquareIcon className="w-5 h-5" />
          </Link>
        </div>
      </div>

      <div className="p-5">
        <div className="inline-block px-2 font-semibold bg-gray-100 rounded-sm">
          Initial grant request: {formatEther(proposal.requestedFunds)} ETH
        </div>

        <div className="mt-2">
          <div className="font-semibold">Planned milestones:</div>
          <div className={isExpandedByClick ? "" : "line-clamp-4"} ref={milesonesRef}>
            {multilineStringToTsx(proposal.milestones)}
          </div>
          {!isDefaultExpanded && !isExpandedByClick && (
            <button className="bg-transparent font-semibold underline" onClick={() => setIsExpandedByClick(true)}>
              Read more
            </button>
          )}
        </div>

        <div className="flex flex-col lg:flex-row-reverse justify-between gap-3 mt-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => privateNoteModalRef && privateNoteModalRef.current?.showModal()}
            >
              Set private note
            </Button>

            <Button
              variant="green-secondary"
              size="sm"
              onClick={() => approveModalRef && approveModalRef.current?.showModal()}
            >
              Approve
            </Button>
          </div>
          <Button
            variant="red-secondary"
            size="sm"
            onClick={() => rejectModalRef && rejectModalRef.current?.showModal()}
          >
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

      <ApproveModal ref={approveModalRef} stage={latestStage} grantName={proposal.title} />
      <RejectModal ref={rejectModalRef} stage={latestStage} grantName={proposal.title} />
      <PrivateNoteModal
        ref={privateNoteModalRef}
        stage={latestStage}
        grantName={proposal.title}
        closeModal={() => privateNoteModalRef.current?.close()}
      />
    </div>
  );
};