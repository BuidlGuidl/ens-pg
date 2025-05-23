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
import { useLargeMilestoneReview } from "~~/hooks/pg-ens/useLargeMilestoneReview";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

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
  const router = useRouter();

  const { getCommonOptions, formMethods } = useFormMethods<FinalApproveModalFormValues>({
    schema: finalApproveModalFormSchema,
  });

  const { handleSubmit } = formMethods;

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
    const txHash = await handleApproveMilestone();
    if (!txHash) {
      setLoadingStatus(LOADING_STATUS_MAP.Empty);
      return notification.error("Error approving milestone");
    }
    if (milestone.status === "verified") {
      setLoadingStatus(LOADING_STATUS_MAP.Completing);
      await reviewMilestone({ status: "paid", ...fieldValues, txHash });
      setLoadingStatus(LOADING_STATUS_MAP.Empty);
    }
    if (milestone.status === "completed") {
      setLoadingStatus(LOADING_STATUS_MAP.Approving);
      await reviewMilestone({ status: "verified", ...fieldValues, txHash });
      setLoadingStatus(LOADING_STATUS_MAP.Empty);
    }
    closeModal();
    router.refresh();
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
                disabled={Boolean(loadingStatus)}
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
                disabled={Boolean(loadingStatus)}
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
