import { ExclamationCircleIcon } from "@heroicons/react/20/solid";
import { ChatBubbleOvalLeftEllipsisIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolidIcon } from "@heroicons/react/24/solid";
import { statusText } from "~~/components/pg-ens/BadgeMilestone";
import { StyledTooltip } from "~~/components/pg-ens/StyledTooltip";
import { LargeStageWithMilestones } from "~~/services/database/repositories/large-stages";
import { getFormattedDate } from "~~/utils/getFormattedDate";
import { multilineStringToTsx } from "~~/utils/multiline-string-to-tsx";

export const TimelineStage = ({ stage }: { stage: LargeStageWithMilestones }) => {
  const isOdd = stage.stageNumber % 2;

  return (
    <div className="grid sm:grid-cols-2">
      <div className={`hidden sm:block border-primary ${isOdd ? "order-1 border-r-2" : "order-3 border-l-2"}`} />
      <div
        className={`relative px-8 pb-4 pt-1 order-2 border-primary min-h-36 ${
          isOdd ? "border-l-2" : "border-l-2 sm:border-l-0 sm:border-r-2 sm:text-right"
        }`}
      >
        <CheckCircleSolidIcon
          className={`absolute bg-white text-primary h-8 w-8 top-0 ${
            isOdd ? "-left-[18px]" : "-left-[18px] sm:left-auto sm:-right-[18px]"
          }`}
        />
        <>
          {stage.submitedAt && <div>{getFormattedDate(stage.submitedAt)}</div>}
          <div className={`flex flex-col font-bold text-2xl mt-1`}>
            <div className={`flex gap-2 items-center ${isOdd ? "" : "sm:flex-row-reverse"}`}>
              <span>
                Stage {stage.stageNumber} {stage.status}
              </span>
              {stage.statusNote && (
                <>
                  <span data-tooltip-id={`tooltip-note-${stage.stageNumber}`} className="">
                    <ChatBubbleOvalLeftEllipsisIcon className="h-7 w-7 text-gray-400" />
                  </span>
                  <StyledTooltip id={`tooltip-note-${stage.stageNumber}`}>
                    {multilineStringToTsx(stage.statusNote)}
                  </StyledTooltip>
                </>
              )}
            </div>
          </div>

          {stage.milestones && (
            <div className="mt-4">
              {stage.milestones.map((milestone, idx) => (
                <div key={`milestone-${milestone.id}`} className="mt-2">
                  <div>
                    <div className={`text-lg font-bold flex ${isOdd ? "" : "sm:place-content-end"}`}>
                      Milestone {idx + 1} ({milestone.amount.toLocaleString()} USDC)
                      {["completed", "verified", "paid"].includes(milestone.status) && (
                        <CheckCircleSolidIcon
                          className={`ml-1 mt-1 h-6 w-6 ${
                            milestone.status === "paid" ? "text-primary-green" : "text-primary-orange"
                          }`}
                          title={statusText[milestone.status]}
                        />
                      )}
                      {milestone.status === "rejected" && (
                        <ExclamationCircleIcon
                          className="ml-1 mt-1 h-6 w-6 text-primary-red"
                          title={statusText[milestone.status]}
                        />
                      )}
                    </div>
                    <div className="text-sm">{milestone.description}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      </div>
    </div>
  );
};
