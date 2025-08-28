import { forwardRef, useRef } from "react";
import { useRouter } from "next/navigation";
import { NewStageModalFormValues, newStageModalFormSchema } from "./schema";
import { useMutation } from "@tanstack/react-query";
import { FormProvider, useFieldArray } from "react-hook-form";
import { Toaster } from "react-hot-toast";
import { parseEther } from "viem";
import { useSignTypedData } from "wagmi";
import { TrashIcon } from "@heroicons/react/20/solid";
import { CreateNewStageReqBody } from "~~/app/api/stages/new/route";
import { Button } from "~~/components/pg-ens/Button";
import { FormSelect } from "~~/components/pg-ens/form-fields/FormSelect";
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
      defaultValues: {
        milestones: [{ description: "", proposedDeliverables: "", amount: 0 }],
      },
    });

    const { handleSubmit, control, watch } = formMethods;

    const feedbackModalRef = useRef<HTMLDialogElement>(null);

    const onSubmit = async (fieldValues: NewStageModalFormValues) => {
      try {
        const milestones = fieldValues.milestones;

        const formattedMilestones = milestones.map(milestone => ({
          ...milestone,
          requestedAmount: parseEther(milestone.requestedAmount),
        }));

        const signature = await signTypedDataAsync({
          domain: EIP_712_DOMAIN,
          types: EIP_712_TYPES__APPLY_FOR_STAGE,
          primaryType: "Message",
          message: {
            stage_number: (previousStage.stageNumber + 1).toString(),
            milestones: JSON.stringify(formattedMilestones),
          },
        });

        await postNewStage({ milestones: formattedMilestones, signature, grantId });
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

    const { fields, append, remove } = useFieldArray({
      control,
      name: "milestones",
    });

    const watchMilestones = watch("milestones");
    const totalAmount = watchMilestones.reduce((acc, curr) => acc + Number(curr.requestedAmount), 0);

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
                <h3 className="text-2xl font-bold">Planned Milestones</h3>
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
                      <div className="grid grid-cols-1 gap-3 sm:gap-x-16 sm:gap-y-1">
                        <FormSelect
                          label="Requested Funds (in ETH)"
                          options={["0.25", "0.5", "1", "2"]}
                          {...getCommonOptions(`milestones.${index}.requestedAmount`)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-x-16 sm:gap-y-1 items-start">
                  <div className="pt-6">
                    <label className="text-xl font-bold">
                      Total:
                      <span className={`bg-light-purple ml-2 p-1 rounded ${totalAmount > 2 ? "text-red-500" : ""}`}>
                        {isNaN(totalAmount) ? "-" : totalAmount.toLocaleString()} ETH
                      </span>
                    </label>
                    {totalAmount > 2 && (
                      <p className="mb-0 mt-1 text-red-500">Note: Total requested funds should not exceed 2 ETH.</p>
                    )}
                  </div>
                  <Button
                    type="button"
                    onClick={() =>
                      append({
                        description: "",
                        proposedDeliverables: "",
                        requestedAmount: "0",
                      })
                    }
                    variant="purple-secondary"
                    className="mt-4 px-8"
                  >
                    + Milestone
                  </Button>
                </div>
                <Button
                  type="submit"
                  disabled={isPostingNewStage || isSigning || totalAmount > 2}
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
                application was rejected and why, or when it is approved and for what amount.
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
