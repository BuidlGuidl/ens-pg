import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useAccount, useSignTypedData } from "wagmi";
import { ReviewMilestoneBody } from "~~/app/api/large-milestones/[milestoneId]/review/route";
import { MilestoneStatus } from "~~/services/database/config/schema";
import { hasActiveAdminSession, hasActiveUserSession } from "~~/utils/admin-session";
import { EIP_712_DOMAIN, EIP_712_TYPES__REVIEW_LARGE_MILESTONE } from "~~/utils/eip712";
import { postMutationFetcher } from "~~/utils/react-query";
import { getParsedError, notification } from "~~/utils/scaffold-eth";
import { SESSION_MESSAGES } from "~~/utils/session-messages";

export const useLargeMilestoneReview = (milestoneId?: number) => {
  const router = useRouter();
  const { signTypedDataAsync, isPending: isSigning } = useSignTypedData();
  const { address: connectedAddress } = useAccount();

  const { mutateAsync: postMilestoneReview, isPending: isPostingMilestoneReview } = useMutation({
    mutationFn: (reviewedMilestone: ReviewMilestoneBody) =>
      postMutationFetcher(`/api/large-milestones/${milestoneId}/review`, { body: reviewedMilestone }),
  });

  const reviewMilestone = async ({
    status,
    txHash,
    statusNote,
    completionProof,
  }: {
    status: MilestoneStatus;
    txHash?: string;
    statusNote?: string;
    completionProof?: string;
  }) => {
    if (!milestoneId) return false;
    let notificationId;
    try {
      if (!connectedAddress) {
        notification.error("Please connect your wallet");
        return false;
      }

      if ((status === "verified" || status === "paid") && !txHash) {
        notification.error("Please fill tx hash");
        return false;
      }

      if (!(await hasActiveUserSession())) {
        notification.error(SESSION_MESSAGES.genericExpiredRetry);
        return false;
      }

      if (status !== "completed" && !(await hasActiveAdminSession())) {
        notification.error(SESSION_MESSAGES.adminExpiredMilestoneApproval);
        return false;
      }

      const signature = await signTypedDataAsync({
        domain: EIP_712_DOMAIN,
        types: EIP_712_TYPES__REVIEW_LARGE_MILESTONE,
        primaryType: "Message",
        message: {
          milestoneId: milestoneId.toString(),
          action: status,
          txHash: txHash || "",
          statusNote: statusNote || "",
        },
      });

      const verifiedObj =
        status === "verified"
          ? {
              verifiedTx: txHash,
            }
          : {};

      const paymentObj =
        status === "paid"
          ? {
              paymentTx: txHash,
            }
          : {};

      notificationId = notification.loading("Submitting milestone");
      await postMilestoneReview({
        status,
        signature,
        statusNote,
        completionProof,
        ...verifiedObj,
        ...paymentObj,
      });
      notification.remove(notificationId);
      notification.success(`Milestone ${status}`);
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
    reviewMilestone,
    isSigning,
    isPostingMilestoneReview,
  };
};
