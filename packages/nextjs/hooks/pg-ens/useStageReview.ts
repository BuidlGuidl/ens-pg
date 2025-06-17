import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useAccount, useSignTypedData } from "wagmi";
import { ReviewStageBody } from "~~/app/api/stages/[stageId]/review/route";
import { Status } from "~~/services/database/repositories/stages";
import { EIP_712_DOMAIN, EIP_712_TYPES__REVIEW_STAGE } from "~~/utils/eip712";
import { postMutationFetcher } from "~~/utils/react-query";
import { getParsedError, notification } from "~~/utils/scaffold-eth";

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
    if (!stageId) return;
    let notificationId;
    try {
      if (!connectedAddress) {
        notification.error("Please connect your wallet");
        return;
      }

      if (status === "approved" && !txHash) {
        notification.error("Please fill tx hash");
        return;
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
    } catch (error) {
      if (notificationId) notification.remove(notificationId);
      const errorMessage = getParsedError(error);
      notification.error(errorMessage);
    }
  };

  return {
    reviewStage,
    isSigning,
    isPostingStageReview,
  };
};
