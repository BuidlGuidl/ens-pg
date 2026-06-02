import { forwardRef, useState } from "react";
import { useRouter } from "next/navigation";
import { WithdrawModalFormValues, withdrawModalFormSchema } from "./schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { FormProvider } from "react-hook-form";
import { Toaster } from "react-hot-toast";
import { formatEther } from "viem";
import { apolloClient } from "~~/components/ScaffoldEthAppWithProviders";
import { Button } from "~~/components/pg-ens/Button";
import { FormTextarea } from "~~/components/pg-ens/form-fields/FormTextarea";
import { useFormMethods } from "~~/hooks/pg-ens/useFormMethods";
import { useHandleLogin } from "~~/hooks/pg-ens/useHandleLogin";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { Milestone } from "~~/services/database/repositories/milestones";
import { hasActiveUserSession } from "~~/utils/admin-session";
import { multilineStringToTsx } from "~~/utils/multiline-string-to-tsx";
import { postMutationFetcher } from "~~/utils/react-query";
import { fetcher } from "~~/utils/react-query";
import { getParsedError, notification } from "~~/utils/scaffold-eth";
import { REAUTH_UI_TEXT, SESSION_MESSAGES } from "~~/utils/session-messages";

type WithdrawModalProps = {
  milestone: Milestone;
  closeModal: () => void;
  contractGrantId?: bigint;
  refetchContractInfo: () => Promise<any>;
};

export const WithdrawModal = forwardRef<HTMLDialogElement, WithdrawModalProps>(
  ({ milestone, closeModal, contractGrantId, refetchContractInfo }, ref) => {
    const router = useRouter();
    const [pendingPaymentTx, setPendingPaymentTx] = useState<string | null>(null);
    const [pendingCompletionProof, setPendingCompletionProof] = useState<string | null>(null);
    const [requiresSession, setRequiresSession] = useState(false);
    const [isReauthenticating, setIsReauthenticating] = useState(false);
    const { handleLogin } = useHandleLogin();

    const { formMethods, getCommonOptions } = useFormMethods<WithdrawModalFormValues>({
      schema: withdrawModalFormSchema,
    });
    const { handleSubmit, reset: clearFormValues, getValues } = formMethods;

    const { writeContractAsync, isPending: isWritingWithOnChain } = useScaffoldWriteContract("Stream");

    const { mutateAsync: postCompleteMilestone, isPending: isPostingCompleteMilestone } = useMutation({
      mutationFn: (completionData: { paymentTx: string; completionProof: string }) =>
        postMutationFetcher(`/api/milestones/${milestone.id}/complete`, { body: completionData }),
    });

    const { data: milestoneStatus, isLoading: isLoadingMilestoneStatus } = useQuery({
      queryKey: ["milestone-status", { milestoneId: milestone.id }],
      queryFn: () => fetcher<{ status: string }>(`/api/milestones/${milestone.id}/status`),
    });

    const onSubmit = async (fieldValues: WithdrawModalFormValues) => {
      let txnHash: string | undefined;
      try {
        const { completionProof } = fieldValues;

        const hasUserSession = await hasActiveUserSession();
        if (!hasUserSession) {
          setRequiresSession(true);
          notification.error(SESSION_MESSAGES.genericExpiredRetry);
          return;
        }

        setRequiresSession(false);

        if (!milestoneStatus) {
          notification.error("Error loading milestone.");
          return;
        }

        if (milestoneStatus.status === "paid") {
          notification.error("Milestone already paid.");
          return;
        }

        if (milestoneStatus.status !== "approved") {
          notification.error("Milestone must be approved before withdrawing.");
          return;
        }

        txnHash = pendingPaymentTx ?? undefined;

        if (!txnHash) {
          txnHash = await writeContractAsync({
            functionName: "streamWithdraw",
            args: [contractGrantId, milestone.grantedAmount || 0n, completionProof],
          });
        }

        if (!txnHash) {
          notification.error("Error withdrawing milestone");
          return;
        }

        setPendingPaymentTx(txnHash);
        setPendingCompletionProof(completionProof);

        await postCompleteMilestone({
          paymentTx: txnHash,
          completionProof,
        });

        setPendingPaymentTx(null);
        setPendingCompletionProof(null);
        setRequiresSession(false);

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

        if ((error as { status?: number })?.status === 401) {
          setRequiresSession(true);
          notification.error(SESSION_MESSAGES.withdrawSyncAfterOnChainFailed);
          return;
        }

        const errorMessage = getParsedError(error);
        notification.error(errorMessage);
      }
    };

    const handleReauthenticateAndRetry = async () => {
      if (isReauthenticating) return;

      setIsReauthenticating(true);
      try {
        const loggedIn = await handleLogin();
        if (!loggedIn) {
          notification.error(SESSION_MESSAGES.reauthFailed);
          return;
        }

        const hasUserSession = await hasActiveUserSession();
        if (!hasUserSession) {
          setRequiresSession(true);
          notification.error(SESSION_MESSAGES.sessionStillUnavailable);
          return;
        }

        setRequiresSession(false);

        const completionProof = pendingCompletionProof || getValues("completionProof");
        if (!pendingPaymentTx || !completionProof) {
          notification.success(SESSION_MESSAGES.sessionRestoredWithdrawAgain);
          return;
        }

        await postCompleteMilestone({
          paymentTx: pendingPaymentTx,
          completionProof,
        });

        setPendingPaymentTx(null);
        setPendingCompletionProof(null);

        await apolloClient.refetchQueries({
          include: "active",
        });
        await refetchContractInfo();

        closeModal();
        clearFormValues();
        router.refresh();
      } catch (error) {
        if ((error as { status?: number })?.status === 401) {
          setRequiresSession(true);
          notification.error(SESSION_MESSAGES.withdrawSyncAfterOnChainFailed);
          return;
        }

        const errorMessage = getParsedError(error);
        notification.error(errorMessage);
      } finally {
        setIsReauthenticating(false);
      }
    };

    return (
      <dialog id="action_modal" className="modal" ref={ref}>
        <div className="modal-box flex flex-col">
          <form method="dialog" className="bg-secondary -mx-6 -mt-6 px-6 py-4 flex items-center justify-between">
            <div className="flex justify-between items-center">
              <p className="font-bold text-xl m-0">Withdraw Milestone {milestone.milestoneNumber}</p>
            </div>
            {/* if there is a button in form, it will close the modal */}
            <button className="btn btn-sm btn-circle btn-ghost text-xl h-auto">✕</button>
          </form>
          <FormProvider {...formMethods}>
            <form onSubmit={handleSubmit(onSubmit)} className="w-full flex flex-col space-y-1 mt-4">
              <div className="text-xl">
                <span className="font-bold">Description:</span>
                <div className="mt-1">{multilineStringToTsx(milestone.description)}</div>
              </div>
              <div className="text-xl">
                <span className="font-bold">Amount:</span>
                <div className="mt-1">{formatEther(milestone.grantedAmount || 0n)} ETH</div>
              </div>
              <div>
                <span className="text-xl font-bold">Detail of Deliverables:</span>
                <div className="text-lg mt-1">{multilineStringToTsx(milestone.proposedDeliverables)}</div>
              </div>
              <div className="flex flex-col">
                <FormTextarea label="Proof of completion" showMessageLength {...getCommonOptions("completionProof")} />
                <span className="text-sm italic text-right pb-4">
                  *Video walkthrough, GitHub repo or other deliverables
                </span>
              </div>
              {(pendingPaymentTx || requiresSession) && (
                <div className="rounded-lg border border-warning px-3 py-2 my-2">
                  <p className="text-sm mb-2">
                    {pendingPaymentTx ? REAUTH_UI_TEXT.withdrawPendingSync : REAUTH_UI_TEXT.withdrawSessionExpired}
                  </p>
                  <Button
                    variant="secondary"
                    type="button"
                    className="self-start"
                    onClick={handleReauthenticateAndRetry}
                    disabled={isReauthenticating || isPostingCompleteMilestone}
                  >
                    {isReauthenticating
                      ? REAUTH_UI_TEXT.reauthenticating
                      : pendingPaymentTx
                      ? REAUTH_UI_TEXT.reauthAndRetry
                      : REAUTH_UI_TEXT.reauth}
                  </Button>
                </div>
              )}
              <Button
                type="submit"
                disabled={
                  isWritingWithOnChain || isPostingCompleteMilestone || isLoadingMilestoneStatus || isReauthenticating
                }
                className="self-center"
              >
                {(isWritingWithOnChain || isPostingCompleteMilestone || isLoadingMilestoneStatus) && (
                  <span className="loading loading-spinner"></span>
                )}
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

WithdrawModal.displayName = "WithdrawModal";
