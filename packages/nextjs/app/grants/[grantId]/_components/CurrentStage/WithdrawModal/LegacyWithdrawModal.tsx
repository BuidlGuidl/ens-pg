import { forwardRef } from "react";
import { useRouter } from "next/navigation";
import { LegacyWithdrawModalFormValues, legacyWithdrawModalFormSchema } from "./schema";
import { FormProvider } from "react-hook-form";
import { Toaster } from "react-hot-toast";
import { parseEther } from "viem";
import { apolloClient } from "~~/components/ScaffoldEthAppWithProviders";
import { Button } from "~~/components/pg-ens/Button";
import { FormInput } from "~~/components/pg-ens/form-fields/FormInput";
import { FormTextarea } from "~~/components/pg-ens/form-fields/FormTextarea";
import { useFormMethods } from "~~/hooks/pg-ens/useFormMethods";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { Stage } from "~~/services/database/repositories/stages";
import { getParsedError, notification } from "~~/utils/scaffold-eth";

// Props for legacy modal
export type LegacyWithdrawModalProps = {
  stage: Stage;
  closeModal: () => void;
  contractGrantId?: bigint;
  refetchContractInfo: () => Promise<any>;
};

export const LegacyWithdrawModal = forwardRef<HTMLDialogElement, LegacyWithdrawModalProps>(
  ({ closeModal, contractGrantId, refetchContractInfo }, ref) => {
    const router = useRouter();

    const { formMethods, getCommonOptions } = useFormMethods<LegacyWithdrawModalFormValues>({
      schema: legacyWithdrawModalFormSchema,
    });
    const { handleSubmit, reset: clearFormValues } = formMethods;

    const { writeContractAsync, isPending: isWritingWithOnChain } = useScaffoldWriteContract("Stream");

    const onSubmit = async (fieldValues: LegacyWithdrawModalFormValues) => {
      let txnHash: string | undefined;
      try {
        const { completedMilestones, withdrawAmount } = fieldValues;

        txnHash = await writeContractAsync({
          functionName: "streamWithdraw",
          args: [contractGrantId, parseEther(withdrawAmount), completedMilestones],
        });

        await apolloClient.refetchQueries({
          include: "active",
        });
        await refetchContractInfo();

        closeModal();
        clearFormValues();
        router.refresh();
      } catch (error) {
        if (!txnHash) {
          // error was from writeContractAsync and already handled
          return;
        }
        const errorMessage = getParsedError(error);
        notification.error(errorMessage);
      }
    };

    return (
      <dialog id="action_modal" className="modal" ref={ref}>
        <div className="modal-box flex flex-col space-y-3">
          <form method="dialog" className="bg-secondary -mx-6 -mt-6 px-6 py-4 flex items-center justify-between">
            <div className="flex justify-between items-center">
              <p className="font-bold text-xl m-0">Withdraw a milestone</p>
            </div>
            {/* if there is a button in form, it will close the modal */}
            <button className="btn btn-sm btn-circle btn-ghost text-xl h-auto">✕</button>
          </form>
          <FormProvider {...formMethods}>
            <form onSubmit={handleSubmit(onSubmit)} className="w-full flex flex-col space-y-1">
              <FormInput label="Amount (in ETH)" {...getCommonOptions("withdrawAmount")} />
              <div className="flex flex-col">
                <FormTextarea
                  label="Completed Milestone and proof of completion"
                  showMessageLength
                  {...getCommonOptions("completedMilestones")}
                />
                <span className="text-sm italic text-right pb-4">
                  *Video walkthrough, GitHub repo or other deliverables
                </span>
              </div>
              <Button type="submit" disabled={isWritingWithOnChain} className="self-center">
                {isWritingWithOnChain && <span className="loading loading-spinner"></span>}
                Withdraw
              </Button>
            </form>
          </FormProvider>
        </div>
        <Toaster />
      </dialog>
    );
  },
);

LegacyWithdrawModal.displayName = "LegacyWithdrawModal";
