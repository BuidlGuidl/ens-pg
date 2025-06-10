import { forwardRef } from "react";
import { RejectModalFormValues, rejectModalFormSchema } from "./schema";
import { FormProvider } from "react-hook-form";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import { Button } from "~~/components/pg-ens/Button";
import { FormTextarea } from "~~/components/pg-ens/form-fields/FormTextarea";
import { useFormMethods } from "~~/hooks/pg-ens/useFormMethods";
import { useStageReview } from "~~/hooks/pg-ens/useStageReview";
import { Stage } from "~~/services/database/repositories/stages";

interface RejectModalProps {
  stage: Stage;
  grantName: string;
}

export const RejectModal = forwardRef<HTMLDialogElement, RejectModalProps>(({ stage, grantName }, ref) => {
  const { reviewStage, isSigning, isPostingStageReview } = useStageReview(stage.id);

  const { formMethods, getCommonOptions } = useFormMethods<RejectModalFormValues>({ schema: rejectModalFormSchema });
  const { handleSubmit } = formMethods;

  const onSubmit = async (fieldValues: RejectModalFormValues) => {
    await reviewStage({ status: "rejected", ...fieldValues });
  };

  return (
    <dialog id="action_modal" className="modal" ref={ref}>
      <div className="modal-box flex flex-col space-y-3">
        <form method="dialog" className="bg-secondary -mx-6 -mt-6 px-6 py-4 flex items-center justify-between">
          <div className="flex justify-between items-center">
            <p className="font-bold text-xl m-0">
              Reject stage {stage.stageNumber} for {grantName}
            </p>
          </div>
          {/* if there is a button in form, it will close the modal */}
          <button className="btn btn-sm btn-circle btn-ghost text-xl h-auto">✕</button>
        </form>
        <FormProvider {...formMethods}>
          <div className="flex items-center gap-1">
            <ExclamationTriangleIcon className="w-6 h-6 text-primary-orange" />
            <span>Clicking Reject will change the status of this grant to Rejected</span>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="w-full flex flex-col space-y-1">
            <FormTextarea label="Note (visible to grantee)" {...getCommonOptions("statusNote")} />
            <Button
              variant="red"
              type="submit"
              size="sm"
              disabled={isPostingStageReview || isSigning}
              className="self-center"
            >
              {(isPostingStageReview || isSigning) && <span className="loading loading-spinner"></span>}
              Reject
            </Button>
          </form>
        </FormProvider>
      </div>
    </dialog>
  );
});

RejectModal.displayName = "RejectModal";
