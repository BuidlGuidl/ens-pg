import { MockStage } from ".";
import { formatEther } from "viem";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";
import { ChatBubbleOvalLeftEllipsisIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolidIcon } from "@heroicons/react/24/solid";
import { statusText } from "~~/components/pg-ens/BadgeMilestone";
import { StyledTooltip } from "~~/components/pg-ens/StyledTooltip";
import { useWithdrawals } from "~~/hooks/pg-ens/useWithdrawals";
import { Grant } from "~~/services/database/repositories/grants";
import { StageWithMilestones } from "~~/services/database/repositories/stages";
import { getFormattedDate } from "~~/utils/getFormattedDate";
import { multilineStringToTsx } from "~~/utils/multiline-string-to-tsx";

type TimelineStageProps = { stage: StageWithMilestones | MockStage; grant: Grant };

export const TimelineStage = ({ stage, grant }: TimelineStageProps) => {
  const { builderAddress, grantNumber } = grant;
  const { stageNumber } = stage;

  const { data: withdrawalData } = useWithdrawals({ filter: { to: builderAddress, grantNumber, stageNumber } });

  const withdrawals = withdrawalData?.withdrawals?.items || [];

  const isOdd = stage.stageNumber % 2;

  const isRealStage = "id" in stage;

  return (
    <div className="grid sm:grid-cols-2">
      <div
        className={`hidden sm:block border-primary ${
          isRealStage ? "border-primary" : "border-secondary border-dashed"
        } ${isOdd ? "order-1 border-r-2" : "order-3 border-l-2"}`}
      />
      <div
        className={`relative px-8 pb-4 pt-1 order-2 ${
          isRealStage ? "border-primary" : "border-secondary border-dashed"
        }  min-h-36 ${isOdd ? "border-l-2" : "border-l-2 sm:border-l-0 sm:border-r-2 sm:text-right"}`}
      >
        <CheckCircleSolidIcon
          className={`absolute bg-white ${isRealStage ? "text-primary" : "text-secondary"} h-8 w-8 top-0 ${
            isOdd ? "-left-[18px]" : "-left-[18px] sm:left-auto sm:-right-[18px]"
          }`}
        />
        {isRealStage ? (
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

              {stage.grantAmount ? <span>Grant: {formatEther(stage.grantAmount)} ETH</span> : null}
            </div>

            {stage.milestone && (
              <div
                className={`collapse !mt-0 collapse-arrow rounded-none ${
                  isOdd ? "sm:self-start" : "sm:self-end"
                } self-start`}
              >
                <input type="checkbox" className="min-h-2" />
                <div
                  className={`collapse-title text-lg text-primary w-[184px] py-0 h-7 min-h-7 pl-0 pr-6 after:!end-2 ${
                    isOdd ? "sm:ml-0" : "sm:ml-auto"
                  }`}
                >
                  <div>Planned milestones</div>
                </div>
                <div className="collapse-content bg-white !rounded-none px-0 !pb-2 border-b border-primary text-gray-500">
                  {multilineStringToTsx(stage.milestone)}
                </div>
              </div>
            )}

            {stage.milestones ? (
              <div className="mt-4">
                {stage.milestones.map((milestone, idx) => (
                  <div key={`milestone-${milestone.id}`} className="mt-2">
                    <div className={`text-lg font-bold flex ${isOdd ? "" : "sm:place-content-end"}`}>
                      Milestone {idx + 1} (
                      {milestone.grantedAmount
                        ? formatEther(milestone.grantedAmount)
                        : formatEther(milestone.requestedAmount)}{" "}
                      ETH)
                      {["paid"].includes(milestone.status) && (
                        <CheckCircleSolidIcon
                          className="ml-1 mt-1 h-6 w-6 text-primary-green"
                          title={statusText[milestone.status as keyof typeof statusText]}
                        />
                      )}
                      {milestone.status === "rejected" && (
                        <ExclamationCircleIcon
                          className="ml-1 mt-1 h-6 w-6 text-primary-red"
                          title={statusText[milestone.status as keyof typeof statusText]}
                        />
                      )}
                    </div>
                    <div className="text-sm">{milestone.description}</div>
                  </div>
                ))}
              </div>
            ) : (
              withdrawals.map((withdrawal, idx) => (
                <div key={`withdrawal-${withdrawal.id}`} className="mt-3 text-gray-500">
                  <div className="font-bold text-lg">
                    Milestone {idx + 1} ({formatEther(BigInt(withdrawal.amount))} Eth withdraw)
                  </div>

                  {multilineStringToTsx(withdrawal.reason || "-")}
                </div>
              ))
            )}
          </>
        ) : (
          <div className="font-bold text-2xl -mt-1.5 text-gray-500">Stage {stage.stageNumber} (locked)</div>
        )}
      </div>
    </div>
  );
};
