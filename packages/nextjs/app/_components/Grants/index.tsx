import { ApprovedGrantsList } from "./ApprovedGrantsList";
import { getPublicGrants } from "~~/services/database/repositories/grants";
import { getPublicLargeGrants } from "~~/services/database/repositories/large-grants";
import { DiscriminatedPublicGrant } from "~~/types/utils";

export const ApprovedGrants = async () => {
  const allGrants = await getPublicGrants();
  const approvedGrants: DiscriminatedPublicGrant[] = allGrants
    .filter(grant => grant.stages.some(stage => stage.status === "approved" || stage.status === "completed"))
    .map(grant => ({ ...grant, type: "grant" }));

  const allLargeGrants = await getPublicLargeGrants();
  const approvedLargeGrants: DiscriminatedPublicGrant[] = allLargeGrants
    .filter(grant => grant.stages.some(stage => stage.status === "approved" || stage.status === "completed"))
    .map(grant => ({ ...grant, type: "largeGrant" }));

  if (approvedGrants.length === 0 && approvedLargeGrants.length === 0) return null;

  const approvedAllGrants: DiscriminatedPublicGrant[] = [...approvedGrants, ...approvedLargeGrants].sort(
    (a, b) => (b.submitedAt?.getTime() ?? 0) - (a.submitedAt?.getTime() ?? 0),
  );

  return (
    <div className="py-10 px-4 flex flex-col items-center w-full">
      <h2 className="text-3xl font-black !mb-0">Grantees</h2>
      <ApprovedGrantsList approvedGrants={approvedAllGrants} />
    </div>
  );
};
