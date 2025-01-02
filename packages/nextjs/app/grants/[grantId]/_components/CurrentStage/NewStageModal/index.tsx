import { forwardRef, useRef } from "react";
import { useRouter } from "next/navigation";
import { NewStageModalFormValues, newStageModalFormSchema } from "./schema";
import { useMutation } from "@tanstack/react-query";
import { FormProvider } from "react-hook-form";
import { Toaster } from "react-hot-toast";
import { useSignTypedData } from "wagmi";
import { CreateNewStageReqBody } from "~~/app/api/stages/new/route";
import { Button } from "~~/components/pg-ens/Button";
import { FormTextarea } from "~~/components/pg-ens/form-fields/FormTextarea";
import { useFormMethods } from "~~/hooks/pg-ens/useFormMethods";
import { Grant } from "~~/services/database/repositories/grants";
import { Stage } from "~~/services/database/repositories/stages";
import { EIP_712_DOMAIN, EIP_712_TYPES__APPLY_FOR_STAGE } from "~~/utils/eip712";
import { postMutationFetcher } from "~~/utils/react-query";
import { getParsedError, notification } from "~~/utils/scaffold-eth";

type NewStageModalProps = {
  grantId: Grant["id"];
  closeModal: () => void;
  previousStage: Stage;
};

export const NewStageModal = forwardRef<HTMLDialogElement, NewStageModalProps>(
  ({ grantId, closeModal, previousStage }, ref) => {
    const { formMethods, getCommonOptions } = useFormMethods<NewStageModalFormValues>({
      schema: newStageModalFormSchema,
    });
    const { handleSubmit } = formMethods;
    const feedbackModalRef = useRef<HTMLDialogElement>(null);

    const onSubmit = async (fieldValues: NewStageModalFormValues) => {
      try {
        const milestone = fieldValues.milestone;

        const signature = await signTypedDataAsync({
          domain: EIP_712_DOMAIN,
          types: EIP_712_TYPES__APPLY_FOR_STAGE,
          primaryType: "Message",
          message: {
            stage_number: (previousStage.stageNumber + 1).toString(),
            milestone: milestone,
          },
        });

        await postNewStage({ milestone, signature, grantId });
        closeModal();
        feedbackModalRef.current?.showModal();
      } catch (error) {
        const errorMessage = getParsedError(error);
        notification.error(errorMessage);
      }
    };

    const { signTypedDataAsync, isPending: isSigning } = useSignTypedData();
    const router = useRouter();

    const { mutateAsync: postNewStage, isPending: isPostingNewStage } = useMutation({
      mutationFn: (newStageBody: CreateNewStageReqBody) =>
        postMutationFetcher("/api/stages/new", { body: newStageBody }),
    });

    const handleFeedbackModalClose = () => {
      feedbackModalRef.current?.close();
      router.refresh();
    };

    return (
      <>
        <dialog id="action_modal" className="modal" ref={ref}>
          <div className="modal-box flex flex-col space-y-3">
            <form method="dialog" className="bg-secondary -mx-6 -mt-6 px-6 py-4 flex items-center justify-between">
              <div className="flex justify-between items-center">
                <p className="font-bold text-xl m-0">Stage {previousStage.stageNumber + 1} application</p>
              </div>
              {/* if there is a button in form, it will close the modal */}
              <button className="btn btn-sm btn-circle btn-ghost text-xl h-auto">✕</button>
            </form>
            <FormProvider {...formMethods}>
              <form onSubmit={handleSubmit(onSubmit)} className="w-full flex flex-col">
                <FormTextarea label="Stage milestones" showMessageLength {...getCommonOptions("milestone")} />
                <Button
                  variant="green"
                  type="submit"
                  disabled={isPostingNewStage || isSigning}
                  className="self-center mt-4"
                >
                  {(isPostingNewStage || isSigning) && <span className="loading loading-spinner"></span>}
                  Apply for a grant
                </Button>
              </form>
            </FormProvider>
          </div>
        </dialog>

        <dialog ref={feedbackModalRef} className="modal">
          <div className="modal-box flex flex-col space-y-3">
            <form method="dialog" className="bg-secondary -mx-6 -mt-6 px-6 py-4">
              <div className="flex items-center">
                <p className="font-bold text-xl m-0 text-center w-full">Stage Application Submitted!</p>
              </div>
            </form>

            <div className="text-center">
              <p>
                Your stage application will be reviewed. You will receive information if we need more details, if the
                application was rejected and why, or when it is approved and for what amount.
              </p>
              <div className="mt-6 flex justify-center">
                <Button onClick={handleFeedbackModalClose}>Accept</Button>
              </div>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={handleFeedbackModalClose}>close</button>
          </form>
        </dialog>
        <Toaster />
      </>
    );
  },
);

NewStageModal.displayName = "NewStageModal";
