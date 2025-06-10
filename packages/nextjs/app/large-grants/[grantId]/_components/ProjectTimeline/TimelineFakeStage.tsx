import { CheckCircleIcon as CheckCircleSolidIcon } from "@heroicons/react/24/solid";

export const TimelineFakeStage = ({ stageNumber }: { stageNumber: number }) => {
  const isOdd = stageNumber % 2;

  return (
    <div className="grid sm:grid-cols-2">
      <div
        className={`hidden sm:block border-secondary border-dashed ${
          isOdd ? "order-1 border-r-2" : "order-3 border-l-2"
        }`}
      />
      <div
        className={`relative px-8 pb-4 pt-1 order-2 border-secondary border-dashed min-h-36 ${
          isOdd ? "border-l-2" : "border-l-2 sm:border-l-0 sm:border-r-2 sm:text-right"
        }`}
      >
        <CheckCircleSolidIcon
          className={`absolute bg-white text-secondary h-8 w-8 top-0 ${
            isOdd ? "-left-[18px]" : "-left-[18px] sm:left-auto sm:-right-[18px]"
          }`}
        />
        <div className="font-bold text-2xl -mt-1.5 text-gray-500">Stage {stageNumber} (locked)</div>
      </div>
    </div>
  );
};
