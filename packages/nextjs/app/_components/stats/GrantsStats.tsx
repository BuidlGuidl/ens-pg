import { StatsItem } from "./StatsItem";
import { formatEther } from "viem";
import { getPublicGrants } from "~~/services/database/repositories/grants";

export const GrantsStats = async () => {
  const allGrants = await getPublicGrants();
  const grants = allGrants.filter(grant => {
    const latestStage = grant.stages[0];
    return (
      (latestStage.status !== "proposed" && latestStage.status !== "rejected" && latestStage.stageNumber === 1) ||
      latestStage.stageNumber !== 1
    );
  });

  const ethGranted = grants
    .flatMap(grant => grant.stages)
    .map(stage => stage.grantAmount)
    .filter(grantAmount => grantAmount)
    .reduce((a, b) => (a as bigint) + (b as bigint), 0n);

  return (
    <div className="inline-flex justify-center items-center gap-2 bg-white rounded-lg overflow-hidden">
      <StatsItem value={Number(Number(formatEther(ethGranted as bigint)).toFixed(2))} description="ETH granted" />
      <div className="flex flex-col gap-1">
        <StatsItem value={grants.length} description="Small Grants" secondary />
        <StatsItem value={allGrants.length} description="Proposals" secondary />
      </div>
    </div>
  );
};
