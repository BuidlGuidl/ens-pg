import { forwardRef, useRef } from "react";
import { useRouter } from "next/navigation";
import { NewStageModalFormValues, newStageModalFormSchema } from "./schema";
import { useMutation } from "@tanstack/react-query";
import { FormProvider, useFieldArray } from "react-hook-form";
import { Toaster } from "react-hot-toast";
import { useSignTypedData } from "wagmi";
import { TrashIcon } from "@heroicons/react/20/solid";
import { CreateNewLargeStageReqBody } from "~~/app/api/large-stages/new/route";
import { Button } from "~~/components/pg-ens/Button";
import { FormInputDate } from "~~/components/pg-ens/form-fields/FormInputDate";
import { FormInputNumber } from "~~/components/pg-ens/form-fields/FormInputNumber";
import { FormTextarea } from "~~/components/pg-ens/form-fields/FormTextarea";
import { useFormMethods } from "~~/hooks/pg-ens/useFormMethods";
import { LargeGrant } from "~~/services/database/repositories/large-grants";
import { LargeStageWithMilestones } from "~~/services/database/repositories/large-stages";
import { EIP_712_DOMAIN, EIP_712_TYPES__APPLY_FOR_LARGE_STAGE } from "~~/utils/eip712";
import { postMutationFetcher } from "~~/utils/react-query";
import { getParsedError, notification } from "~~/utils/scaffold-eth";

type NewStageModalProps = {
  grantId: LargeGrant["id"];
  closeModal: () => void;
  previousStage: LargeStageWithMilestones;
};

export const NewStageModal = forwardRef<HTMLDialogElement, NewStageModalProps>(
  ({ grantId, closeModal, previousStage }, ref) => {
    const { formMethods, getCommonOptions } = useFormMethods<NewStageModalFormValues>({
      schema: newStageModalFormSchema,
      defaultValues: {
        milestones: [{ description: "", proposedDeliverables: "", amount: 0, proposedCompletionDate: new Date() }],
      },
    });

    const { handleSubmit, control, watch } = formMethods;

    const feedbackModalRef = useRef<HTMLDialogElement>(null);

    const onSubmit = async (fieldValues: NewStageModalFormValues) => {
      try {
        const milestones = fieldValues.milestones;

        const signature = await signTypedDataAsync({
          domain: EIP_712_DOMAIN,
          types: EIP_712_TYPES__APPLY_FOR_LARGE_STAGE,
          primaryType: "Message",
          message: {
            stage_number: (previousStage.stageNumber + 1).toString(),
            milestones: JSON.stringify(milestones),
          },
        });

        await postNewStage({ milestones, signature, grantId });
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
      mutationFn: (newStageBody: CreateNewLargeStageReqBody) =>
        postMutationFetcher("/api/large-stages/new", { body: newStageBody }),
    });

    const handleFeedbackModalClose = () => {
      feedbackModalRef.current?.close();
      router.refresh();
    };

    const { fields, append, remove } = useFieldArray({
      control,
      name: "milestones",
    });

    const watchMilestones = watch("milestones");
    const totalAmount = watchMilestones.reduce((acc, curr) => acc + Number(curr.amount), 0);

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
                <div className="mt-4">
                  <h3 className="text-lg font-bold">Planned milestones for this stage:</h3>
                  <div className="rounded-xl bg-light-purple p-4">
                    {fields.map((field, index) => (
                      <div key={field.id}>
                        {index > 0 && <hr className="border-t border-white my-6" />}
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-2xl font-bold">Milestone {index + 1}</h4>
                          <Button variant="secondary" size="sm" onClick={() => remove(index)} className="ml-2">
                            <TrashIcon className="h-4 w-4" />
                            <span className="hidden sm:inline">Delete milestone</span>
                          </Button>
                        </div>
                        <FormTextarea
                          label="Description"
                          showMessageLength
                          {...getCommonOptions(`milestones.${index}.description`)}
                        />
                        <FormTextarea
                          label="Detail of Deliverables"
                          showMessageLength
                          {...getCommonOptions(`milestones.${index}.proposedDeliverables`)}
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-x-16 sm:gap-y-1">
                          <FormInputNumber label="Budget (USDC)" {...getCommonOptions(`milestones.${index}.amount`)} />
                          <FormInputDate
                            label="Deadline"
                            {...getCommonOptions(`milestones.${index}.proposedCompletionDate`)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-1">
                    <div className="pt-6">
                      <label className="font-bold">
                        Total requested funds:
                        <span className="bg-light-purple ml-2 p-1 rounded">
                          {isNaN(totalAmount) ? "-" : totalAmount.toLocaleString()} USDC
                        </span>
                      </label>
                    </div>
                    <Button
                      type="button"
                      onClick={() =>
                        append({
                          description: "",
                          proposedDeliverables: "",
                          amount: 0,
                          proposedCompletionDate: new Date(),
                        })
                      }
                      variant="purple-secondary"
                      size="sm"
                      className="mt-2 text-sm"
                    >
                      + Add Milestone
                    </Button>
                  </div>
                </div>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={isPostingNewStage || isSigning}
                  className="self-center mt-4"
                >
                  {(isPostingNewStage || isSigning) && <span className="loading loading-spinner"></span>}
                  Apply
                </Button>
              </form>
            </FormProvider>
          </div>
          <Toaster />
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
                application was rejected and why, or when it is approved.
              </p>
              <div className="mt-6 flex justify-center">
                <Button onClick={handleFeedbackModalClose}>Accept</Button>
              </div>
            </div>
          </div>
          <Toaster />
        </dialog>
      </>
    );
  },
);

NewStageModal.displayName = "NewStageModal";
