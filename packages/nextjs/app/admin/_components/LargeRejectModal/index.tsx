import { forwardRef } from "react";
import { useRouter } from "next/navigation";
import { RejectModalFormValues, rejectModalFormSchema } from "./schema";
import { useMutation } from "@tanstack/react-query";
import { FormProvider } from "react-hook-form";
import { Toaster } from "react-hot-toast";
import { useSignTypedData } from "wagmi";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import { RejectVoteReqBody } from "~~/app/api/large-stages/[stageId]/reject-vote/route";
import { Button } from "~~/components/pg-ens/Button";
import { FormTextarea } from "~~/components/pg-ens/form-fields/FormTextarea";
import { Address } from "~~/components/scaffold-eth";
import { useFormMethods } from "~~/hooks/pg-ens/useFormMethods";
import { LargeGrantWithStagesAndPrivateNotes } from "~~/types/utils";
import { MINIMAL_VOTES_FOR_FINAL_APPROVAL } from "~~/utils/approval-votes";
import { EIP_712_DOMAIN, EIP_712_TYPES__LARGE_STAGE_REJECT_VOTE } from "~~/utils/eip712";
import { postMutationFetcher } from "~~/utils/react-query";
import { getParsedError, notification } from "~~/utils/scaffold-eth";

interface RejectModalProps {
  stage: LargeGrantWithStagesAndPrivateNotes["stages"][number];
  grantName: string;
  closeModal: () => void;
}

export const LargeRejectModal = forwardRef<HTMLDialogElement, RejectModalProps>(
  ({ stage, grantName, closeModal }, ref) => {
    const { formMethods, getCommonOptions } = useFormMethods<RejectModalFormValues>({ schema: rejectModalFormSchema });
    const { handleSubmit } = formMethods;
    const { rejectVotes } = stage;
    const finalReject = rejectVotes.length + 1 === MINIMAL_VOTES_FOR_FINAL_APPROVAL;

    const router = useRouter();

    const { signTypedDataAsync, isPending: isSigning } = useSignTypedData();

    const { mutateAsync: postRejectVote, isPending: isPostingRejectVote } = useMutation({
      mutationFn: (rejectVoteBody: RejectVoteReqBody) =>
        postMutationFetcher(`/api/large-stages/${stage.id}/reject-vote`, { body: rejectVoteBody }),
    });

    const onSubmit = async (fieldValues: RejectModalFormValues) => {
      try {
        const signature = await signTypedDataAsync({
          domain: EIP_712_DOMAIN,
          types: EIP_712_TYPES__LARGE_STAGE_REJECT_VOTE,
          primaryType: "Message",
          message: {
            stageId: String(stage.id),
            statusNote: fieldValues.statusNote || "",
          },
        });

        await postRejectVote({ signature, statusNote: fieldValues.statusNote || "" });
        closeModal();
        router.refresh();
      } catch (error) {
        const errorMessage = getParsedError(error);
        notification.error(errorMessage);
      }
    };

    return (
      <dialog id="action_modal" className="modal" ref={ref}>
        <div className="modal-box flex flex-col space-y-3">
          <form method="dialog" className="bg-secondary -mx-6 -mt-6 px-6 py-4 flex items-center justify-between">
            <div className="flex justify-between items-center">
              <p className="font-bold text-xl m-0">
                Reject {stage.stageNumber > 1 ? `Stage ${stage.stageNumber} of ${grantName}` : grantName}
              </p>
            </div>
            {/* if there is a button in form, it will close the modal */}
            <button className="btn btn-sm btn-circle btn-ghost text-xl h-auto">✕</button>
          </form>
          <FormProvider {...formMethods}>
            {rejectVotes.length > 0 && (
              <>
                <div className="font-bold">Pre-rejected by:</div>

                {rejectVotes.map(rejectVote => (
                  <div key={rejectVote.id} className="flex items-center gap-2">
                    <Address address={rejectVote.authorAddress as `0x${string}`} />
                  </div>
                ))}
                <div className="divider" />
              </>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="w-full flex flex-col space-y-1">
              {finalReject ? (
                <>
                  <div className="flex items-center gap-1 mb-4">
                    <ExclamationTriangleIcon className="w-6 h-6 text-primary-orange" />
                    <span>Clicking Reject will change the status of this grant to Rejected</span>
                  </div>
                  <FormTextarea label="Note (visible to grantee)" {...getCommonOptions("statusNote")} />
                </>
              ) : (
                <div className="mb-4 mt-4">
                  Are you sure you want to vote for the rejection of this {stage.stageNumber > 1 ? "stage" : "grant"}?
                </div>
              )}
              <div className="flex justify-between">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={isPostingRejectVote || isSigning}
                  className="self-center"
                  type="button"
                  onClick={closeModal}
                >
                  Cancel
                </Button>
                <Button
                  variant={finalReject ? "red" : "red-secondary"}
                  type="submit"
                  size="sm"
                  disabled={isPostingRejectVote || isSigning}
                  className="self-center"
                >
                  {(isPostingRejectVote || isSigning) && <span className="loading loading-spinner"></span>}
                  {finalReject ? "Reject" : "Vote for Rejection"}
                </Button>
              </div>
            </form>
          </FormProvider>
        </div>
        <Toaster />
      </dialog>
    );
  },
);

LargeRejectModal.displayName = "LargeRejectModal";
