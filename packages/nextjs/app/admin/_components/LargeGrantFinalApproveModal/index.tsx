import { forwardRef, useState } from "react";
import { FinalApproveModalFormValues, finalApproveModalFormSchema } from "./schema";
import { FormProvider } from "react-hook-form";
import { Toaster } from "react-hot-toast";
import { parseUnits } from "viem";
import { Button } from "~~/components/pg-ens/Button";
import { FormTextarea } from "~~/components/pg-ens/form-fields/FormTextarea";
import { Address } from "~~/components/scaffold-eth";
import { useFormMethods } from "~~/hooks/pg-ens/useFormMethods";
import { useHandleLogin } from "~~/hooks/pg-ens/useHandleLogin";
import { useLargeStageReview } from "~~/hooks/pg-ens/useLargeStageReview";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { LargeGrantWithStagesAndPrivateNotes } from "~~/types/utils";
import { hasActiveAdminSession } from "~~/utils/admin-session";
import { notification } from "~~/utils/scaffold-eth";
import { REAUTH_UI_TEXT, SESSION_MESSAGES } from "~~/utils/session-messages";

const LOADING_STATUS_MAP = {
  CreatingGrant: "Creating grant in contract",
  Approving: "Approving grant",
  MovingToNextStage: "Moving grant to next stage",
  Empty: "",
} as const;

const WAITING_FOR_SIGNATURE_POSTFIX = "waiting for signature";

type LoadingStatus = (typeof LOADING_STATUS_MAP)[keyof typeof LOADING_STATUS_MAP];

const getLoadingStatusText = ({ status, isWaiting }: { status: LoadingStatus; isWaiting: boolean }) => {
  if (status === LOADING_STATUS_MAP.Empty) {
    return status;
  }

  if (isWaiting) {
    return `${status}, ${WAITING_FOR_SIGNATURE_POSTFIX}...`;
  }

  return `${status}...`;
};

export const LargeGrantFinalApproveModal = forwardRef<
  HTMLDialogElement,
  {
    stage: LargeGrantWithStagesAndPrivateNotes["stages"][number];
    grantName: string;
    builderAddress: string;
    isGrant?: boolean;
    grantId: number;
  }
>(({ stage, grantName, builderAddress, isGrant, grantId }, ref) => {
  const { reviewStage, isSigning } = useLargeStageReview(stage.id);
  const [loadingStatus, setLoadingStatus] = useState<LoadingStatus>(LOADING_STATUS_MAP.Empty);
  const [pendingApprovedTxHash, setPendingApprovedTxHash] = useState<string | null>(null);
  const [requiresAdminSession, setRequiresAdminSession] = useState(false);
  const [isReauthenticating, setIsReauthenticating] = useState(false);
  const { handleLogin } = useHandleLogin();
  const { approvalVotes } = stage;

  const { getCommonOptions, formMethods } = useFormMethods<FinalApproveModalFormValues>({
    schema: finalApproveModalFormSchema,
  });

  const { handleSubmit, getValues } = formMethods;

  const { writeContractAsync, isPending: isWriteContractPending } = useScaffoldWriteContract("LargeGrant");

  const { data: contractGrantIdForBuilder } = useScaffoldReadContract({
    contractName: "LargeGrant",
    functionName: "grantData",
    args: [BigInt(grantId)],
    query: {
      enabled: !isGrant,
    },
  });

  const closeDialog = () => {
    if (ref && typeof ref !== "function") {
      ref.current?.close();
    }
  };

  const handleCreateGrant = async () => {
    try {
      let txHash;

      const milestoneAmounts = stage.milestones.map(milestone => parseUnits(milestone.amount.toString(), 6));

      if (isGrant) {
        setLoadingStatus(LOADING_STATUS_MAP.CreatingGrant);
        txHash = await writeContractAsync({
          functionName: "addGrant",
          args: [builderAddress as `0x${string}`, BigInt(grantId), milestoneAmounts],
        });
      } else {
        if (!contractGrantIdForBuilder) {
          setLoadingStatus(LOADING_STATUS_MAP.Empty);

          return notification.error("Error getting grant for corresponding builder in contract");
        }
        setLoadingStatus(LOADING_STATUS_MAP.MovingToNextStage);

        txHash = await writeContractAsync({
          functionName: "addGrantStage",
          args: [BigInt(grantId), milestoneAmounts],
        });
      }

      return txHash;
    } catch (e) {
      console.error("Error sending setup transaction", e);
    }
  };

  const onSubmit = async (fieldValues: FinalApproveModalFormValues) => {
    const hasAdminSession = await hasActiveAdminSession();
    if (!hasAdminSession) {
      setLoadingStatus(LOADING_STATUS_MAP.Empty);
      setRequiresAdminSession(true);
      notification.error(SESSION_MESSAGES.adminExpiredFinalApproval);
      return;
    }
    setRequiresAdminSession(false);

    const txHash = pendingApprovedTxHash || (await handleCreateGrant());
    if (!txHash) {
      setLoadingStatus(LOADING_STATUS_MAP.Empty);
      return notification.error("Error setting up stream");
    }

    setPendingApprovedTxHash(txHash);
    setLoadingStatus(LOADING_STATUS_MAP.Approving);
    const isReviewed = await reviewStage({ status: "approved", ...fieldValues, txHash });

    if (isReviewed) {
      setPendingApprovedTxHash(null);
      setRequiresAdminSession(false);
    }

    setLoadingStatus(LOADING_STATUS_MAP.Empty);
  };

  const handleReauthenticateAndRetry = async () => {
    if (isReauthenticating) return;

    setIsReauthenticating(true);
    try {
      const loggedIn = await handleLogin();
      if (!loggedIn) {
        notification.error(SESSION_MESSAGES.reauthFailed);
        return;
      }

      const hasAdminSession = await hasActiveAdminSession();
      if (!hasAdminSession) {
        setRequiresAdminSession(true);
        notification.error(SESSION_MESSAGES.adminPermissionsRequired);
        return;
      }

      setRequiresAdminSession(false);

      if (!pendingApprovedTxHash) {
        notification.success(SESSION_MESSAGES.sessionRestoredSubmitAgain);
        return;
      }

      setLoadingStatus(LOADING_STATUS_MAP.Approving);
      const fieldValues = getValues();
      const isReviewed = await reviewStage({ status: "approved", ...fieldValues, txHash: pendingApprovedTxHash });

      if (isReviewed) {
        setPendingApprovedTxHash(null);
        setRequiresAdminSession(false);
        closeDialog();
      }
    } finally {
      setLoadingStatus(LOADING_STATUS_MAP.Empty);
      setIsReauthenticating(false);
    }
  };

  const loadingStatusText = getLoadingStatusText({
    status: loadingStatus,
    isWaiting: isSigning || isWriteContractPending,
  });

  return (
    <dialog id="action_modal" className="modal" ref={ref}>
      <div className="modal-box flex flex-col space-y-3">
        <form method="dialog" className="bg-secondary -mx-6 -mt-6 px-6 py-4 flex items-center justify-between">
          <div className="flex justify-between items-center">
            <p className="font-bold text-xl m-0">
              Approve Stage {stage.stageNumber} for {grantName}
            </p>
          </div>
          <button className="btn btn-sm btn-circle btn-ghost text-xl h-auto">✕</button>
        </form>
        <FormProvider {...formMethods}>
          {approvalVotes.length > 0 && (
            <>
              <div className="font-bold">Pre-approved by:</div>

              {approvalVotes.map(approvalVote => (
                <div key={approvalVote.id} className="flex items-center gap-2">
                  <Address address={approvalVote.authorAddress as `0x${string}`} />
                </div>
              ))}
              <div className="divider" />
            </>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="w-full flex flex-col gap-1">
            <FormTextarea label="Note (visible to grantee)" {...getCommonOptions("statusNote")} />
            {(pendingApprovedTxHash || requiresAdminSession) && !loadingStatus && (
              <div className="rounded-lg border border-warning px-3 py-2 my-2">
                <p className="text-sm mb-2">
                  {pendingApprovedTxHash
                    ? REAUTH_UI_TEXT.finalApprovalPendingSync
                    : REAUTH_UI_TEXT.finalApprovalSessionExpired}
                </p>
                <Button
                  variant="secondary"
                  type="button"
                  size="sm"
                  className="!px-4"
                  onClick={handleReauthenticateAndRetry}
                  disabled={isReauthenticating}
                >
                  <span>
                    {isReauthenticating
                      ? REAUTH_UI_TEXT.reauthenticating
                      : pendingApprovedTxHash
                      ? REAUTH_UI_TEXT.reauthAndRetry
                      : REAUTH_UI_TEXT.reauth}
                  </span>
                </Button>
              </div>
            )}
            {loadingStatusText && (
              <div className="text-xl flex justify-center items-center gap-2 my-2">
                <span className="loading loading-spinner" />
                {loadingStatusText}
              </div>
            )}
            <Button
              variant="green"
              type="submit"
              size="sm"
              className="!px-4 self-center"
              disabled={Boolean(loadingStatus) || isReauthenticating}
            >
              <span>Final Approve</span>
            </Button>
          </form>
        </FormProvider>
      </div>
      <Toaster />
    </dialog>
  );
});

LargeGrantFinalApproveModal.displayName = "LargeGrantFinalApproveModal";
