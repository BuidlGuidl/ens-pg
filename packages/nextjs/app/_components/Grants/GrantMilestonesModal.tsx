import { forwardRef } from "react";
import { formatEther } from "viem";
import { WithdrawalItems } from "~~/hooks/pg-ens/useWithdrawals";
import { getFormattedDateWithDay } from "~~/utils/getFormattedDate";
import { multilineStringToTsx } from "~~/utils/multiline-string-to-tsx";

type GrantMilestonesModalProps = {
  withdrawals: WithdrawalItems;
  id: number;
};

export const GrantMilestonesModal = forwardRef<HTMLDialogElement, GrantMilestonesModalProps>(
  ({ withdrawals, id }, ref) => {
    return (
      <dialog id={`milestones_modal_${id}`} className="modal" ref={ref}>
        <div className="modal-box flex flex-col space-y-3">
          <form method="dialog" className="bg-secondary -mx-6 -mt-6 px-6 py-4">
            <div className="flex items-center">
              <p className="font-bold text-xl m-0 text-center w-full">
                Milestones delivered
                {/* Approve Stage {id} {withdrawals.length} */}
              </p>
            </div>
            {/* if there is a button in form, it will close the modal */}
            <button className="btn btn-sm btn-circle btn-ghost text-xl h-auto absolute top-3.5 right-6">✕</button>
          </form>
          {withdrawals.map((withdrawal, index) => (
            <div key={withdrawal.id} className="pb-3 border-b last:pb-0 last:border-b-0 border-gray-400">
              <div className="flex items-center justify-between">
                <div className="flex gap-2 items-center">
                  <div className="text-lg font-bold">Milestone {index + 1}</div>
                  <div className="bg-secondary px-2 py-1 rounded font-semibold">
                    {formatEther(BigInt(withdrawal.amount))} ETH
                  </div>
                </div>
                <div>{getFormattedDateWithDay(new Date(+withdrawal.timestamp * 1000)) || "-"}</div>
              </div>
              <div className="mt-2">{multilineStringToTsx(withdrawal.reason || "-")}</div>
            </div>
          ))}
        </div>
      </dialog>
    );
  },
);

GrantMilestonesModal.displayName = "GrantMilestonesModal";
