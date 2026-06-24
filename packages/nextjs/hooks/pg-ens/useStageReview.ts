import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useAccount, useSignTypedData } from "wagmi";
import { ReviewStageBody } from "~~/app/api/stages/[stageId]/review/route";
import { Status } from "~~/services/database/repositories/stages";
import { hasActiveAdminSession, hasActiveUserSession } from "~~/utils/admin-session";
import { EIP_712_DOMAIN, EIP_712_TYPES__REVIEW_STAGE } from "~~/utils/eip712";
import { postMutationFetcher } from "~~/utils/react-query";
import { getParsedError, notification } from "~~/utils/scaffold-eth";
import { SESSION_MESSAGES } from "~~/utils/session-messages";

export const useStageReview = (stageId?: number) => {
  const router = useRouter();
  const { signTypedDataAsync, isPending: isSigning } = useSignTypedData();
  const { address: connectedAddress } = useAccount();

  const { mutateAsync: postStageReview, isPending: isPostingStageReview } = useMutation({
    mutationFn: (reviewedStage: ReviewStageBody) =>
      postMutationFetcher(`/api/stages/${stageId}/review`, { body: reviewedStage }),
  });

  const reviewStage = async ({
    status,
    txHash,
    statusNote,
    grantAmount,
    grantNumber,
    milestones,
  }: {
    status: Status;
    txHash?: string;
    statusNote?: string;
    grantAmount?: string;
    grantNumber?: string;
    milestones?: { grantedAmount: string }[];
  }) => {
    if (!stageId) return false;
    let notificationId;
    try {
      if (!connectedAddress) {
        notification.error("Please connect your wallet");
        return false;
      }

      if (status === "approved" && !txHash) {
        notification.error("Please fill tx hash");
        return false;
      }

      if (!(await hasActiveUserSession())) {
        notification.error(SESSION_MESSAGES.genericExpiredRetry);
        return false;
      }

      if (status !== "completed" && !(await hasActiveAdminSession())) {
        notification.error(SESSION_MESSAGES.adminExpiredFinalApproval);
        return false;
      }

      const signature = await signTypedDataAsync({
        domain: EIP_712_DOMAIN,
        types: EIP_712_TYPES__REVIEW_STAGE,
        primaryType: "Message",
        message: {
          stageId: stageId.toString(),
          action: status,
          txHash: txHash || "",
          statusNote: statusNote || "",
          grantAmount: grantAmount || "",
          grantNumber: grantNumber || "",
        },
      });

      notificationId = notification.loading("Submitting review");
      await postStageReview({
        status,
        approvedTx: txHash,
        signature,
        statusNote,
        grantAmount,
        grantNumber,
        milestones,
      });
      notification.remove(notificationId);
      notification.success(`Grant ${status}`);
      router.refresh();
      return true;
    } catch (error) {
      if (notificationId) notification.remove(notificationId);
      if ((error as { status?: number })?.status === 401) {
        notification.error(SESSION_MESSAGES.genericExpiredRetry);
        return false;
      }
      const errorMessage = getParsedError(error);
      notification.error(errorMessage);
      return false;
    }
  };

  return {
    reviewStage,
    isSigning,
    isPostingStageReview,
  };
};
