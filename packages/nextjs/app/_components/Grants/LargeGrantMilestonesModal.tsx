import { forwardRef } from "react";
import { LargeMilestone } from "~~/services/database/repositories/large-milestones";
import { getFormattedDateWithDay } from "~~/utils/getFormattedDate";
import { multilineStringToTsx } from "~~/utils/multiline-string-to-tsx";

type GrantMilestonesModalProps = {
  milestones: LargeMilestone[];
  id: number;
};

export const LargeGrantMilestonesModal = forwardRef<HTMLDialogElement, GrantMilestonesModalProps>(
  ({ milestones, id }, ref) => {
    return (
      <dialog id={`milestones_modal_${id}`} className="modal" ref={ref}>
        <div className="modal-box flex flex-col space-y-3">
          <form method="dialog" className="bg-secondary -mx-6 -mt-6 px-6 py-4">
            <div className="flex items-center">
              <p className="font-bold text-xl m-0 text-center w-full">Milestones delivered</p>
            </div>
            {/* if there is a button in form, it will close the modal */}
            <button className="btn btn-sm btn-circle btn-ghost text-xl h-auto absolute top-3.5 right-6">✕</button>
          </form>
          {milestones.map((milestone, index) => (
            <div key={milestone.id} className="pb-3 border-b last:pb-0 last:border-b-0 border-gray-400">
              <div className="flex items-center justify-between">
                <div className="flex gap-2 items-center">
                  <div className="text-lg font-bold">Milestone {index + 1}</div>
                  <div className="bg-secondary px-2 py-1 rounded font-semibold">{milestone.amount} USDC</div>
                </div>
                {milestone.completedAt && <div>{getFormattedDateWithDay(milestone.completedAt)}</div>}
              </div>
              <div className="mt-2">{multilineStringToTsx(milestone.completionProof || "-")}</div>
            </div>
          ))}
        </div>
      </dialog>
    );
  },
);

LargeGrantMilestonesModal.displayName = "LargeGrantMilestonesModal";
