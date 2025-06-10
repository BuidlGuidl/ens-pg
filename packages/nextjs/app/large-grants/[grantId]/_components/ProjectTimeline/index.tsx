"use client";

import { LargeGrantWithStages } from "../../page";
import { TimelineFakeStage } from "./TimelineFakeStage";
import { TimelineStage } from "./TimelineStage";

const MIN_STAGES = 4;

export const ProjectTimeline = ({ grant }: { grant: LargeGrantWithStages }) => {
  if (!grant) {
    return null;
  }

  const fakeStageNumbers = Array.from(
    { length: MIN_STAGES - grant.stages.length },
    (_, i) => grant.stages.length + i + 1,
  );

  return (
    <div className="w-full max-w-5xl">
      <span className="text-2xl font-bold">Project timeline</span>

      <div className="bg-white pl-8 pr-4 sm:px-12 py-4 sm:py-10 mt-6 flex flex-col rounded-xl">
        {grant.stages.map(stage => (
          <TimelineStage key={stage.stageNumber} stage={stage} />
        ))}
        {fakeStageNumbers.map(stageNumber => (
          <TimelineFakeStage key={stageNumber} stageNumber={stageNumber} />
        ))}
      </div>
    </div>
  );
};
