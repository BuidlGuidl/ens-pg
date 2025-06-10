import { forwardRef } from "react";
import { useRouter } from "next/navigation";
import { LargeGrantWithStagesAndPrivateNotes } from "../LargeGrantProposal";
import { useMutation } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { useSignTypedData } from "wagmi";
import { ApprovalVoteReqBody } from "~~/app/api/large-stages/[stageId]/approval-vote/route";
import { Button } from "~~/components/pg-ens/Button";
import { EIP_712_DOMAIN, EIP_712_TYPES__LARGE_STAGE_APPROVAL_VOTE } from "~~/utils/eip712";
import { postMutationFetcher } from "~~/utils/react-query";
import { getParsedError, notification } from "~~/utils/scaffold-eth";

type ApprovalVoteModalProps = {
  stage: LargeGrantWithStagesAndPrivateNotes["stages"][number];
  grantName: string;
  closeModal: () => void;
};

export const LargeGrantApprovalVoteModal = forwardRef<HTMLDialogElement, ApprovalVoteModalProps>(
  ({ stage, grantName, closeModal }, ref) => {
    const router = useRouter();

    const { signTypedDataAsync, isPending: isSigning } = useSignTypedData();

    const { mutateAsync: postApprovalVote, isPending: isPostingApprovalVote } = useMutation({
      mutationFn: (approvalVoteBody: ApprovalVoteReqBody) =>
        postMutationFetcher(`/api/large-stages/${stage.id}/approval-vote`, { body: approvalVoteBody }),
    });

    const onSubmit = async () => {
      try {
        const signature = await signTypedDataAsync({
          domain: EIP_712_DOMAIN,
          types: EIP_712_TYPES__LARGE_STAGE_APPROVAL_VOTE,
          primaryType: "Message",
          message: {
            stageId: String(stage.id),
          },
        });

        await postApprovalVote({ signature });
        closeModal();
        router.refresh();
      } catch (error) {
        const errorMessage = getParsedError(error);
        notification.error(errorMessage);
      }
    };

    return (
      <dialog id="action_modal" className="modal" ref={ref}>
        <div className="modal-box flex flex-col space-y-6">
          <form method="dialog" className="bg-secondary -mx-6 -mt-6 px-6 py-4 flex items-center justify-between">
            <div className="flex justify-between items-center">
              <p className="font-bold text-xl m-0">
                {stage.stageNumber > 1 ? `Stage ${stage.stageNumber} of ${grantName}` : grantName}
              </p>
            </div>
            {/* if there is a button in form, it will close the modal */}
            <button className="btn btn-sm btn-circle btn-ghost text-xl h-auto">✕</button>
          </form>
          <div>Are you sure you want to vote for the approval of this {stage.stageNumber > 1 ? "stage" : "grant"}?</div>
          <div className="flex justify-between">
            <Button
              variant="secondary"
              size="sm"
              disabled={isPostingApprovalVote || isSigning}
              className="self-center"
              onClick={closeModal}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="green-secondary"
              size="sm"
              disabled={isPostingApprovalVote || isSigning}
              className="self-center"
              onClick={onSubmit}
            >
              {(isPostingApprovalVote || isSigning) && <span className="loading loading-spinner"></span>}
              Vote for approval
            </Button>
          </div>
        </div>
        <Toaster />
      </dialog>
    );
  },
);

LargeGrantApprovalVoteModal.displayName = "LargeGrantApprovalVoteModal";
