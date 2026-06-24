import { forwardRef, useState } from "react";
import { GrantWithStagesAndPrivateNotes } from "../Proposal";
import { FinalApproveModalFormValues, finalApproveModalFormSchema } from "./schema";
import { FormProvider, useFieldArray } from "react-hook-form";
import { Toaster } from "react-hot-toast";
import { formatEther, parseEther } from "viem";
import { Button } from "~~/components/pg-ens/Button";
import { FormSelect } from "~~/components/pg-ens/form-fields/FormSelect";
import { FormTextarea } from "~~/components/pg-ens/form-fields/FormTextarea";
import { Address } from "~~/components/scaffold-eth";
import { useFormMethods } from "~~/hooks/pg-ens/useFormMethods";
import { useHandleLogin } from "~~/hooks/pg-ens/useHandleLogin";
import { useStageReview } from "~~/hooks/pg-ens/useStageReview";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { hasActiveAdminSession } from "~~/utils/admin-session";
import { notification } from "~~/utils/scaffold-eth";
import { REAUTH_UI_TEXT, SESSION_MESSAGES } from "~~/utils/session-messages";

const LOADING_STATUS_MAP = {
  CreatingStream: "Creating grant stream",
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

export const FinalApproveModal = forwardRef<
  HTMLDialogElement,
  {
    stage: GrantWithStagesAndPrivateNotes["stages"][number];
    grantName: string;
    builderAddress: `0x${string}`;
    isGrant?: boolean;
    grantNumber: number;
  }
>(({ stage, grantName, builderAddress, isGrant, grantNumber }, ref) => {
  const { reviewStage, isSigning } = useStageReview(stage.id);
  const [loadingStatus, setLoadingStatus] = useState<LoadingStatus>(LOADING_STATUS_MAP.Empty);
  const [pendingApprovedTxHash, setPendingApprovedTxHash] = useState<string | null>(null);
  const [requiresAdminSession, setRequiresAdminSession] = useState(false);
  const [isReauthenticating, setIsReauthenticating] = useState(false);
  const { handleLogin } = useHandleLogin();
  const { approvalVotes } = stage;

  const { formMethods, getCommonOptions } = useFormMethods<FinalApproveModalFormValues>({
    schema: finalApproveModalFormSchema,
    defaultValues: {
      milestones: stage.milestones.map(milestone => ({
        grantedAmount: formatEther(milestone.requestedAmount),
      })),
      statusNote: "",
    },
  });

  const { handleSubmit, control, watch, getValues } = formMethods;

  const { writeContractAsync, isPending: isWriteContractPending } = useScaffoldWriteContract("Stream");

  const { data: contractGrantIdForBuilder } = useScaffoldReadContract({
    contractName: "Stream",
    functionName: "getGrantIdByBuilderAndGrantNumber",
    // @ts-expect-error: grantNumber is safe to convert to BigInt
    args: [builderAddress, BigInt(grantNumber)],
    query: {
      enabled: !isGrant,
    },
  });

  const { fields } = useFieldArray({
    control,
    name: "milestones",
  });

  const watchMilestones = watch("milestones");
  const totalAmount = watchMilestones.reduce((acc, curr) => acc + Number(curr.grantedAmount), 0);

  const closeDialog = () => {
    if (ref && typeof ref !== "function") {
      ref.current?.close();
    }
  };

  const handleSetupStream = async () => {
    try {
      let txHash;

      if (isGrant) {
        setLoadingStatus(LOADING_STATUS_MAP.CreatingStream);
        txHash = await writeContractAsync({
          functionName: "addGrantStream",
          args: [builderAddress, parseEther(totalAmount.toString()), grantNumber],
        });
      } else {
        if (!contractGrantIdForBuilder) {
          setLoadingStatus(LOADING_STATUS_MAP.Empty);

          return notification.error("Error getting grant for corresponding builder in contract");
        }
        setLoadingStatus(LOADING_STATUS_MAP.MovingToNextStage);

        txHash = await writeContractAsync({
          functionName: "moveGrantToNextStage",
          args: [contractGrantIdForBuilder, parseEther(totalAmount.toString())],
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

    const txHash = pendingApprovedTxHash || (await handleSetupStream());
    if (!txHash) {
      setLoadingStatus(LOADING_STATUS_MAP.Empty);
      return notification.error("Error setting up stream");
    }

    setPendingApprovedTxHash(txHash);
    setLoadingStatus(LOADING_STATUS_MAP.Approving);
    const isReviewed = await reviewStage({
      status: "approved",
      ...fieldValues,
      txHash,
      grantNumber: grantNumber.toString(),
      grantAmount: totalAmount.toString(),
    });

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
      const isReviewed = await reviewStage({
        status: "approved",
        ...fieldValues,
        txHash: pendingApprovedTxHash,
        grantNumber: grantNumber.toString(),
        grantAmount: totalAmount.toString(),
      });

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
                  {approvalVote.amount && <span>({formatEther(approvalVote.amount)} ETH suggested)</span>}
                </div>
              ))}
              <div className="divider" />
            </>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="w-full flex flex-col gap-1">
            <h3 className="text-2xl font-bold">Planned Milestones</h3>
            <div className="rounded-xl bg-light-purple p-4 mb-2">
              {fields.map((field, index) => (
                <div key={field.id}>
                  {index > 0 && <hr className="border-t border-white my-2" />}
                  <div>
                    <h4 className="text-2xl font-bold">Milestone {index + 1}</h4>
                    <div>{stage.milestones[index].description}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-x-16 sm:gap-y-1 mt-4">
                      <div>
                        <span className="text-xl font-bold">Requested</span>
                        <select className="block select select-bordered mt-1 w-full max-w-[10rem]" disabled={true}>
                          <option>{formatEther(stage.milestones[index].requestedAmount)} ETH</option>
                        </select>
                      </div>
                      <FormSelect
                        label="Granted"
                        options={["0.25", "0.5", "1", "2"]}
                        {...getCommonOptions(`milestones.${index}.grantedAmount`)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <h3 className="text-xl font-bold">Total Granted: {totalAmount} ETH</h3>
            <hr className="border-t border-black my-2" />
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

FinalApproveModal.displayName = "FinalApproveModal";
