import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ExportGrantMarkdown } from "../../admin/_components/ExportGrantMarkdown";
import { GrantMilestonesModal } from "./GrantMilestonesModal";
import { formatEther } from "viem";
import { ClipboardIcon } from "@heroicons/react/24/outline";
import { Badge } from "~~/components/pg-ens/Badge";
import { Button } from "~~/components/pg-ens/Button";
import { GrantProgressBar } from "~~/components/pg-ens/GrantProgressBar";
import { Address } from "~~/components/scaffold-eth";
import { useAuthSession } from "~~/hooks/pg-ens/useAuthSession";
import { useWithdrawals } from "~~/hooks/pg-ens/useWithdrawals";
import { PublicGrant } from "~~/services/database/repositories/grants";
import { Stage } from "~~/services/database/repositories/stages";
import { AdminGrant } from "~~/types/utils";
import { getFormattedDate } from "~~/utils/getFormattedDate";
import { multilineStringToTsx } from "~~/utils/multiline-string-to-tsx";

type GrantItemProps = {
  grant: PublicGrant | AdminGrant;
  latestsShownStatus: "all" | "approved";
};

export const GrantItem = ({ grant, latestsShownStatus }: GrantItemProps) => {
  const milestonesRef = useRef<HTMLDialogElement>(null);
  const { isAdmin } = useAuthSession();

  const [showMarkdown, setShowMarkdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [isDescriptionTruncated, setIsDescriptionTruncated] = useState(false);
  const descriptionRef = useRef<HTMLDivElement>(null);

  const latestStage =
    latestsShownStatus === "approved"
      ? (grant.stages.find(stage => stage.status === "approved" || stage.status === "completed") as Stage)
      : grant.stages[0];

  const showProposalTitle =
    latestsShownStatus === "all" &&
    latestStage.stageNumber === 1 &&
    (latestStage.status === "proposed" || latestStage.status === "rejected");

  const allStagesGrantAmount = grant.stages
    .map(stage => stage.grantAmount || 0n)
    .reduce((acc, current) => BigInt(acc || 0n) + BigInt(current || 0n), 0n);

  const { data: withdrawalData } = useWithdrawals({
    filter: { to: grant.builderAddress, grantNumber: grant.grantNumber },
  });

  const withdrawals = withdrawalData?.withdrawals?.items || [];

  const allWithdrawals = withdrawals;
  const withdrawnFromAllStages = allWithdrawals
    ?.map(withdrawal => withdrawal.amount)
    .filter(withdrawAmount => withdrawAmount)
    .reduce((acc, current) => BigInt(acc || 0n) + BigInt(current || 0n), 0n);

  // Only generate markdown if grant is an AdminGrant
  const markdown = "email" in grant ? ExportGrantMarkdown({ grant }) : "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
      alert("Failed to copy!");
    }
  };

  useEffect(() => {
    if (descriptionRef.current) {
      setIsDescriptionTruncated(descriptionRef.current.scrollHeight > descriptionRef.current.clientHeight);
    }
  }, [grant.description]);

  return (
    <div className="card flex flex-col bg-white text-primary-content w-full max-w-96 shadow-lg rounded-lg overflow-hidden">
      <div className="px-3 py-3 flex justify-between items-center w-full">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-medium-purple h-3.5 w-3.5" />
          <div className="font-bold text-xl">{showProposalTitle ? "Proposal" : `Stage ${latestStage.stageNumber}`}</div>
          <Badge status={latestStage.status} size="sm" className="ml-2" />
        </div>
        <div>{getFormattedDate(latestStage.submitedAt as Date)}</div>
      </div>
      <div className="px-4 py-8 bg-gray-100 mb-0 shadow-sm">
        <div className="flex items-start mb-6">
          {isAdmin ? (
            <div className="flex items-center">
              <Link href={`/grants/${grant.id}`} className="hover:underline">
                <h2 className="text-2xl font-bold pr-2">{grant.title}</h2>
              </Link>
              <button
                type="button"
                className="ml-2 p-1 rounded hover:bg-gray-200"
                onClick={e => {
                  e.preventDefault();
                  setShowMarkdown(true);
                }}
                title="Export to Markdown"
              >
                <ClipboardIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          ) : (
            <h2 className="text-2xl font-bold">{grant.title}</h2>
          )}
        </div>
        <Address address={grant.builderAddress as `0x${string}`} />
      </div>
      <div className="px-5 py-4 w-full">
        <GrantProgressBar
          className="w-full"
          amount={Number(formatEther(allStagesGrantAmount))}
          withdrawn={Number(formatEther(withdrawnFromAllStages || 0n))}
        />
      </div>
      <div className="px-5 pb-5 flex flex-col justify-between flex-grow">
        <div
          className={`text-gray-400 ${allWithdrawals.length > 0 ? "line-clamp-4" : "line-clamp-6"}`}
          ref={descriptionRef}
        >
          {multilineStringToTsx(grant.description)}
        </div>
        {isDescriptionTruncated && (
          <button
            className="text-blue-500 hover:underline text-sm mt-1 self-end"
            onClick={() => setShowDescriptionModal(true)}
            type="button"
          >
            Read more
          </button>
        )}
        {allWithdrawals.length > 0 && (
          <Button
            className="mt-6"
            variant="secondary"
            onClick={() => milestonesRef && milestonesRef.current?.showModal()}
          >
            {allWithdrawals.length} Milestone{allWithdrawals.length > 1 && "s"}
          </Button>
        )}
        <GrantMilestonesModal ref={milestonesRef} withdrawals={allWithdrawals} id={grant.id} />
      </div>
      {showMarkdown && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-2xl w-full">
            <h2 className="text-xl font-bold mb-4">Exported Markdown</h2>
            <textarea className="w-full h-64 p-2 border rounded mb-4" value={markdown} readOnly />
            <div className="flex justify-end gap-2">
              <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700" onClick={handleCopy}>
                {copied ? "Copied!" : "Copy to Clipboard"}
              </button>
              <button
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                onClick={() => setShowMarkdown(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {showDescriptionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-2xl w-full relative">
            <h2 className="text-xl font-bold mb-4">Grant Description</h2>
            <div className="max-h-96 overflow-y-auto text-gray-700 whitespace-pre-line">
              {multilineStringToTsx(grant.description)}
            </div>
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl font-bold"
              onClick={() => setShowDescriptionModal(false)}
              aria-label="Close"
              type="button"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
