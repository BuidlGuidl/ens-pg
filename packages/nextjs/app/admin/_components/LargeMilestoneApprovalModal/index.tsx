import { forwardRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FinalApproveModalFormValues, finalApproveModalFormSchema } from "../LargeGrantFinalApproveModal/schema";
import { LargeMilestoneWithRelatedData } from "../LargeMilestoneCompleted";
import { FormProvider } from "react-hook-form";
import { Toaster } from "react-hot-toast";
import { Button } from "~~/components/pg-ens/Button";
import { FormTextarea } from "~~/components/pg-ens/form-fields/FormTextarea";
import { Address } from "~~/components/scaffold-eth";
import { useFormMethods } from "~~/hooks/pg-ens/useFormMethods";
import { useHandleLogin } from "~~/hooks/pg-ens/useHandleLogin";
import { useLargeMilestoneReview } from "~~/hooks/pg-ens/useLargeMilestoneReview";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { hasActiveAdminSession } from "~~/utils/admin-session";
import { notification } from "~~/utils/scaffold-eth";
import { REAUTH_UI_TEXT, SESSION_MESSAGES } from "~~/utils/session-messages";

const LOADING_STATUS_MAP = {
  Approving: "Approving milestone",
  Completing: "Completing milestone",
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

export const LargeMilestoneApprovalModal = forwardRef<
  HTMLDialogElement,
  {
    milestone: LargeMilestoneWithRelatedData;
    closeModal: () => void;
  }
>(({ milestone, closeModal }, ref) => {
  const { reviewMilestone, isSigning } = useLargeMilestoneReview(milestone.id);
  const [loadingStatus, setLoadingStatus] = useState<LoadingStatus>(LOADING_STATUS_MAP.Empty);
  const [pendingMilestoneTxHash, setPendingMilestoneTxHash] = useState<string | null>(null);
  const [pendingMilestoneStatus, setPendingMilestoneStatus] = useState<"paid" | "verified" | null>(null);
  const [requiresAdminSession, setRequiresAdminSession] = useState(false);
  const [isReauthenticating, setIsReauthenticating] = useState(false);
  const { handleLogin } = useHandleLogin();
  const router = useRouter();

  const { getCommonOptions, formMethods } = useFormMethods<FinalApproveModalFormValues>({
    schema: finalApproveModalFormSchema,
  });

  const { handleSubmit, getValues } = formMethods;

  const { writeContractAsync, isPending: isWriteContractPending } = useScaffoldWriteContract("LargeGrant");

  const handleApproveMilestone = async () => {
    try {
      let txHash;

      if (milestone.status === "verified") {
        setLoadingStatus(LOADING_STATUS_MAP.Completing);
        txHash = await writeContractAsync({
          functionName: "completeMilestone",
          args: [
            BigInt(milestone.stage.grant.id),
            milestone.stage.stageNumber,
            milestone.milestoneNumber,
            milestone.description,
            milestone.completionProof || "",
          ],
        });
      } else {
        setLoadingStatus(LOADING_STATUS_MAP.Approving);
        txHash = await writeContractAsync({
          functionName: "approveMilestone",
          args: [BigInt(milestone.stage.grant.id), milestone.stage.stageNumber, milestone.milestoneNumber],
        });
      }

      return txHash;
    } catch (e) {
      console.error("Error sending milestone transaction", e);
    }
  };

  const onSubmit = async (fieldValues: FinalApproveModalFormValues) => {
    const hasAdminSession = await hasActiveAdminSession();
    if (!hasAdminSession) {
      setLoadingStatus(LOADING_STATUS_MAP.Empty);
      setRequiresAdminSession(true);
      notification.error(SESSION_MESSAGES.adminExpiredMilestoneApproval);
      return;
    }

    setRequiresAdminSession(false);
    const nextStatus = pendingMilestoneStatus || (milestone.status === "verified" ? "paid" : "verified");
    const txHash = pendingMilestoneTxHash || (await handleApproveMilestone());

    if (!txHash) {
      setLoadingStatus(LOADING_STATUS_MAP.Empty);
      return notification.error("Error approving milestone");
    }

    setPendingMilestoneTxHash(txHash);
    setPendingMilestoneStatus(nextStatus);
    setLoadingStatus(nextStatus === "paid" ? LOADING_STATUS_MAP.Completing : LOADING_STATUS_MAP.Approving);
    const isReviewed = await reviewMilestone({ status: nextStatus, ...fieldValues, txHash });
    setLoadingStatus(LOADING_STATUS_MAP.Empty);

    if (!isReviewed) return;

    setPendingMilestoneTxHash(null);
    setPendingMilestoneStatus(null);
    setRequiresAdminSession(false);
    closeModal();
    router.refresh();
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

      if (!pendingMilestoneTxHash || !pendingMilestoneStatus) {
        notification.success(SESSION_MESSAGES.sessionRestoredSubmitAgain);
        return;
      }

      setLoadingStatus(
        pendingMilestoneStatus === "paid" ? LOADING_STATUS_MAP.Completing : LOADING_STATUS_MAP.Approving,
      );
      const fieldValues = getValues();
      const isReviewed = await reviewMilestone({
        status: pendingMilestoneStatus,
        ...fieldValues,
        txHash: pendingMilestoneTxHash,
      });

      if (!isReviewed) return;

      setPendingMilestoneTxHash(null);
      setPendingMilestoneStatus(null);
      setRequiresAdminSession(false);
      closeModal();
      router.refresh();
    } finally {
      setLoadingStatus(LOADING_STATUS_MAP.Empty);
      setIsReauthenticating(false);
    }
  };

  const loadingStatusText = getLoadingStatusText({
    status: loadingStatus,
    isWaiting: isSigning || isWriteContractPending,
  });

  if (milestone.status !== "completed" && milestone.status !== "verified") {
    return (
      <dialog id="action_modal" className="modal" ref={ref}>
        <div className="modal-box flex flex-col space-y-3">
          <form method="dialog" className="bg-secondary -mx-6 -mt-6 px-6 py-4 flex items-center justify-between">
            <div className="flex justify-between items-center">
              <p className="font-bold text-xl m-0">Milestone is not in a valid state for approval.</p>
            </div>
            <button className="btn btn-sm btn-circle btn-ghost text-xl h-auto">✕</button>
          </form>
        </div>
      </dialog>
    );
  }

  return (
    <dialog id="action_modal" className="modal" ref={ref}>
      <div className="modal-box flex flex-col space-y-6">
        <form method="dialog" className="bg-secondary -mx-6 -mt-6 px-6 py-4 flex items-center justify-between">
          <div className="flex justify-between items-center">
            <p className="font-bold text-xl m-0">
              Verify Milestone {milestone.milestoneNumber} - Stage {milestone.stage.stageNumber} for{" "}
              {milestone.stage.grant.title}
            </p>
          </div>
          <button className="btn btn-sm btn-circle btn-ghost text-xl h-auto">✕</button>
        </form>
        <FormProvider {...formMethods}>
          {milestone.status === "verified" && (
            <>
              <div className="font-bold">Pre-approved by:</div>
              <div className="flex items-center gap-2">
                <Address address={milestone.verifiedBy as `0x${string}`} />
              </div>
              <div className="divider" />
            </>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="w-full flex flex-col gap-1 space-y-6">
            {milestone.status === "verified" ? (
              <FormTextarea label="Note (visible to grantee)" {...getCommonOptions("statusNote")} />
            ) : (
              <div>Are you sure you want to vote for the approval of this milestone?</div>
            )}
            {(pendingMilestoneTxHash || requiresAdminSession) && !loadingStatus && (
              <div className="rounded-lg border border-warning px-3 py-2 my-2">
                <p className="text-sm mb-2">
                  {pendingMilestoneTxHash
                    ? REAUTH_UI_TEXT.milestonePendingSync
                    : REAUTH_UI_TEXT.milestoneSessionExpired}
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
                      : pendingMilestoneTxHash
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
            <div className="flex justify-between">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                disabled={Boolean(loadingStatus) || isReauthenticating}
                className="self-center"
                onClick={closeModal}
              >
                Cancel
              </Button>
              <Button
                variant="green"
                type="submit"
                className="!px-4 self-center"
                size="sm"
                disabled={Boolean(loadingStatus) || isReauthenticating}
              >
                <span>{milestone.status === "verified" ? "Final Approve" : "Approve"}</span>
              </Button>
            </div>
          </form>
        </FormProvider>
      </div>
      <Toaster />
    </dialog>
  );
});

LargeMilestoneApprovalModal.displayName = "LargeMilestoneApprovalModal";
