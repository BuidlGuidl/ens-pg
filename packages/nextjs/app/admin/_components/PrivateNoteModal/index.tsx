import { forwardRef } from "react";
import { useRouter } from "next/navigation";
import { PrivateNoteModalFormValues, privateNoteModalFormSchema } from "./schema";
import { useMutation } from "@tanstack/react-query";
import { FormProvider } from "react-hook-form";
import { useSignTypedData } from "wagmi";
import { Button } from "~~/components/pg-ens/Button";
import { FormTextarea } from "~~/components/pg-ens/form-fields/FormTextarea";
import { useFormMethods } from "~~/hooks/pg-ens/useFormMethods";
import { LargeStage } from "~~/services/database/repositories/large-stages";
import { Stage } from "~~/services/database/repositories/stages";
import { EIP_712_DOMAIN, EIP_712_TYPES__STAGE_PRIVATE_NOTE } from "~~/utils/eip712";
import { StagePrivateNoteReqBody } from "~~/utils/privateNote";
import { postMutationFetcher } from "~~/utils/react-query";
import { getParsedError, notification } from "~~/utils/scaffold-eth";

type PrivateNoteModalProps = {
  stage: Stage | LargeStage;
  grantName: string;
  isLargeGrant?: boolean;
  closeModal: () => void;
};

export const PrivateNoteModal = forwardRef<HTMLDialogElement, PrivateNoteModalProps>(
  ({ stage, grantName, isLargeGrant = false, closeModal }, ref) => {
    const router = useRouter();
    const { formMethods, getCommonOptions } = useFormMethods<PrivateNoteModalFormValues>({
      schema: privateNoteModalFormSchema,
    });
    const { handleSubmit, reset: clearFormValues } = formMethods;
    const { signTypedDataAsync, isPending: isSigning } = useSignTypedData();

    const { mutateAsync: postPrivateNote, isPending: isPostingPrivateNote } = useMutation({
      mutationFn: (stagePrivateNoteBody: StagePrivateNoteReqBody) =>
        postMutationFetcher(`/api/${isLargeGrant ? "large-" : ""}stages/${stage.id}/private-note`, {
          body: stagePrivateNoteBody,
        }),
    });

    const onSubmit = async (fieldValues: PrivateNoteModalFormValues) => {
      try {
        const { note } = fieldValues;

        const signature = await signTypedDataAsync({
          domain: EIP_712_DOMAIN,
          types: EIP_712_TYPES__STAGE_PRIVATE_NOTE,
          primaryType: "Message",
          message: {
            note,
          },
        });

        await postPrivateNote({ signature, note });
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
                Private note for Stage {stage.stageNumber} of {grantName}
              </p>
            </div>
            {/* if there is a button in form, it will close the modal */}
            <button className="btn btn-sm btn-circle btn-ghost text-xl h-auto">✕</button>
          </form>
          <FormProvider {...formMethods}>
            <form onSubmit={handleSubmit(onSubmit)} className="w-full flex flex-col space-y-1">
              <FormTextarea label="Private note (not visible by grantee)" {...getCommonOptions("note")} />
              <Button type="submit" disabled={isPostingPrivateNote || isSigning} size="sm" className="self-center">
                {(isPostingPrivateNote || isSigning) && <span className="loading loading-spinner"></span>}
                Save
              </Button>
            </form>
          </FormProvider>
        </div>
      </dialog>
    );
  },
);

PrivateNoteModal.displayName = "PrivateNoteModal";
