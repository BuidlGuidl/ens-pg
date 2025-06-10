import { forwardRef } from "react";
import { useRouter } from "next/navigation";
import { CompleteMilestoneModalFormValues, completeMilestoneModalFormSchema } from "./schema";
import { FormProvider } from "react-hook-form";
import { Toaster } from "react-hot-toast";
import { Button } from "~~/components/pg-ens/Button";
import { FormTextarea } from "~~/components/pg-ens/form-fields/FormTextarea";
import { useFormMethods } from "~~/hooks/pg-ens/useFormMethods";
import { useLargeMilestoneReview } from "~~/hooks/pg-ens/useLargeMilestoneReview";
import { LargeMilestone } from "~~/services/database/repositories/large-milestones";
import { multilineStringToTsx } from "~~/utils/multiline-string-to-tsx";

type WithdrawModalProps = {
  milestone: LargeMilestone;
  closeModal: () => void;
};

export const CompleteMilestoneModal = forwardRef<HTMLDialogElement, WithdrawModalProps>(
  ({ closeModal, milestone }, ref) => {
    const router = useRouter();
    const { reviewMilestone } = useLargeMilestoneReview(milestone.id);

    const { formMethods, getCommonOptions } = useFormMethods<CompleteMilestoneModalFormValues>({
      schema: completeMilestoneModalFormSchema,
    });
    const { handleSubmit, reset: clearFormValues } = formMethods;

    const onSubmit = async (fieldValues: CompleteMilestoneModalFormValues) => {
      try {
        const { completionProof } = fieldValues;
        await reviewMilestone({ status: "completed", completionProof });
        closeModal();
        clearFormValues();
        router.refresh();
      } catch (error) {
        console.error("Error completing milestone:", error);
      }
    };

    return (
      <dialog id="action_modal" className="modal" ref={ref}>
        <div className="modal-box flex flex-col space-y-3">
          <form method="dialog" className="bg-secondary -mx-6 -mt-6 px-6 py-4 flex items-center justify-between">
            <div className="flex justify-between items-center">
              <p className="font-bold text-xl m-0">Complete Milestone {milestone.milestoneNumber}</p>
            </div>
            {/* if there is a button in form, it will close the modal */}
            <button className="btn btn-sm btn-circle btn-ghost text-xl h-auto">✕</button>
          </form>
          <FormProvider {...formMethods}>
            <div>
              <div className="font-bold mb-2">Requested amount: {milestone.amount} USDC</div>
              <div>{multilineStringToTsx(milestone.description)}</div>
              <div className="mt-2">Proposed deliverables: {multilineStringToTsx(milestone.proposedDeliverables)}</div>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="w-full flex flex-col space-y-1">
              <div className="flex flex-col">
                <FormTextarea label="Proof of completion" showMessageLength {...getCommonOptions("completionProof")} />
                <span className="text-sm italic text-right pb-4">
                  *Video walkthrough, GitHub repo or other deliverables
                </span>
              </div>
              <Button type="submit" className="self-center">
                Submit
              </Button>
            </form>
          </FormProvider>
        </div>
        <Toaster />
      </dialog>
    );
  },
);

CompleteMilestoneModal.displayName = "CompleteMilestoneModal";
