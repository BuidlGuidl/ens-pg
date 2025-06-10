import { forwardRef } from "react";
import { useRouter } from "next/navigation";
import { GrantWithStagesAndPrivateNotes } from "../Proposal";
import { ApprovalVoteModalFormValues, approvalVoteModalFormSchema } from "./schema";
import { useMutation } from "@tanstack/react-query";
import { FormProvider } from "react-hook-form";
import { Toaster } from "react-hot-toast";
import { useSignTypedData } from "wagmi";
import { ApprovalVoteReqBody } from "~~/app/api/stages/[stageId]/approval-vote/route";
import { Button } from "~~/components/pg-ens/Button";
import { FormInput } from "~~/components/pg-ens/form-fields/FormInput";
import { useFormMethods } from "~~/hooks/pg-ens/useFormMethods";
import { EIP_712_DOMAIN, EIP_712_TYPES__STAGE_APPROVAL_VOTE } from "~~/utils/eip712";
import { postMutationFetcher } from "~~/utils/react-query";
import { getParsedError, notification } from "~~/utils/scaffold-eth";

type ApprovalVoteModalProps = {
  stage: GrantWithStagesAndPrivateNotes["stages"][number];
  grantName: string;
  closeModal: () => void;
};

export const ApprovalVoteModal = forwardRef<HTMLDialogElement, ApprovalVoteModalProps>(
  ({ stage, grantName, closeModal }, ref) => {
    const router = useRouter();

    const { formMethods, getCommonOptions } = useFormMethods<ApprovalVoteModalFormValues>({
      schema: approvalVoteModalFormSchema,
    });
    const { handleSubmit, reset: clearFormValues } = formMethods;
    const { signTypedDataAsync, isPending: isSigning } = useSignTypedData();

    const { mutateAsync: postApprovalVote, isPending: isPostingApprovalVote } = useMutation({
      mutationFn: (approvalVoteBody: ApprovalVoteReqBody) =>
        postMutationFetcher(`/api/stages/${stage.id}/approval-vote`, { body: approvalVoteBody }),
    });

    const onSubmit = async (fieldValues: ApprovalVoteModalFormValues) => {
      try {
        const { grantAmount } = fieldValues;

        const signature = await signTypedDataAsync({
          domain: EIP_712_DOMAIN,
          types: EIP_712_TYPES__STAGE_APPROVAL_VOTE,
          primaryType: "Message",
          message: {
            grantAmount,
            stageId: String(stage.id),
          },
        });

        await postApprovalVote({ signature, grantAmount });
        closeModal();
        clearFormValues();
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
                Approval vote for Stage {stage.stageNumber} of {grantName}
              </p>
            </div>
            {/* if there is a button in form, it will close the modal */}
            <button className="btn btn-sm btn-circle btn-ghost text-xl h-auto">✕</button>
          </form>
          <FormProvider {...formMethods}>
            <span className="text-sm">
              This grant doesn&apos;t meet the approval threshold to setup stream yet. Set your suggested grant amount
              and sign your initial approval.
            </span>
            <form onSubmit={handleSubmit(onSubmit)} className="w-full flex flex-col space-y-1">
              <FormInput label="Grant amount (in ETH)" {...getCommonOptions("grantAmount")} />
              <Button
                type="submit"
                size="sm"
                variant="green-secondary"
                disabled={isPostingApprovalVote || isSigning}
                className="self-center"
              >
                {(isPostingApprovalVote || isSigning) && <span className="loading loading-spinner"></span>}
                Vote for approval
              </Button>
            </form>
          </FormProvider>
        </div>
        <Toaster />
      </dialog>
    );
  },
);

ApprovalVoteModal.displayName = "ApprovalVoteModal";
