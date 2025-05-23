import { redirect } from "next/navigation";
import ExportGrantsToMarkdown from "./_components/ExportGrantsToMarkdown";
import { LargeGrantProposal } from "./_components/LargeGrantProposal";
import { LargeMilestoneCompleted } from "./_components/LargeMilestoneCompleted";
import { Proposal } from "./_components/Proposal";
import type { NextPage } from "next";
import { getServerSession } from "next-auth";
import { SignInBtn } from "~~/components/pg-ens/SignInBtn";
import { getAllGrantsWithStagesAndPrivateNotes } from "~~/services/database/repositories/grants";
import { getAllLargeGrantsWithStagesAndPrivateNotes } from "~~/services/database/repositories/large-grants";
import { getCompletedOrVerifiedMilestones } from "~~/services/database/repositories/large-milestones";
import { DiscriminatedGrantWithStagesAndPrivateNotes } from "~~/types/utils";
import { authOptions } from "~~/utils/auth";

export const revalidate = 0;

const Admin: NextPage = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return (
      <div className="flex flex-col items-center px-4 py-10 sm:py-20">
        <h1 className="text-3xl text-center font-extrabold mb-1">Sign In</h1>
        <p className="mb-6">You need to sign in to access the admin dashboard.</p>
        <SignInBtn />
      </div>
    );
  }

  if (session?.user?.role !== "admin") {
    return redirect("/");
  }

  const grants = (await getAllGrantsWithStagesAndPrivateNotes()).map(grant => ({ ...grant, type: "grant" }));
  const largeGrants = (await getAllLargeGrantsWithStagesAndPrivateNotes()).map(grant => ({
    ...grant,
    type: "largeGrant",
  }));

  const allGrants = ([...grants, ...largeGrants] as DiscriminatedGrantWithStagesAndPrivateNotes[]).sort(
    (a, b) => (b.submitedAt?.getTime() ?? 0) - (a.submitedAt?.getTime() ?? 0),
  );

  const submissionsByBuilderAddress: { [key: string]: number } = {};
  const grantProposals: Array<NonNullable<DiscriminatedGrantWithStagesAndPrivateNotes>> = [];
  const stageProposals: Array<NonNullable<DiscriminatedGrantWithStagesAndPrivateNotes>> = [];

  allGrants.forEach(grant => {
    const latestStage = grant.stages[0];

    if (latestStage?.status === "proposed") {
      const builderSubmissions = submissionsByBuilderAddress[grant.builderAddress] || 0;
      // count builder submissions
      submissionsByBuilderAddress[grant.builderAddress] = builderSubmissions + 1;
      if (latestStage.stageNumber === 1) {
        // stage 1 proposed grants
        grantProposals.push(grant);
      } else {
        // grants that have passed stage 1 and are in proposed stage
        stageProposals.push(grant);
      }
    }
  });

  const milestones = await getCompletedOrVerifiedMilestones();

  return (
    <div className="flex flex-col flex-grow px-4 py-10 sm:py-20">
      <ExportGrantsToMarkdown />
      <h1 className="text-3xl text-center font-extrabold !mb-0">Pending proposals</h1>

      <div className="mt-10 mx-auto grid xl:grid-cols-3 gap-4 sm:gap-8 w-full">
        <div className="flex flex-col items-center p-4 sm:p-6 bg-[#FBE6F4] rounded-xl">
          <h2 className="text-2xl font-bold !m-0">New Grant Proposals ({grantProposals.length})</h2>
          <div className="mt-4 sm:mt-6 space-y-4 w-full flex flex-col items-center">
            {grantProposals.map(grant =>
              grant.type === "largeGrant" ? (
                <LargeGrantProposal
                  key={`${grant.type}-${grant.id}`}
                  proposal={grant}
                  userSubmissionsAmount={submissionsByBuilderAddress[grant.builderAddress]}
                  isGrant
                />
              ) : (
                <Proposal
                  key={`${grant.type}-${grant.id}`}
                  proposal={grant}
                  userSubmissionsAmount={submissionsByBuilderAddress[grant.builderAddress]}
                  isGrant
                />
              ),
            )}
          </div>
        </div>

        <div className="flex flex-col items-center p-4 sm:p-6 bg-[#F3E6FB] rounded-xl">
          <h2 className="text-2xl font-bold !m-0">New Stage Proposals ({stageProposals.length})</h2>
          <div className="mt-4 sm:mt-6 space-y-4 w-full flex flex-col items-center">
            {stageProposals.map(grant =>
              grant.type === "largeGrant" ? (
                <LargeGrantProposal
                  key={`${grant.type}-${grant.id}`}
                  proposal={grant}
                  userSubmissionsAmount={submissionsByBuilderAddress[grant.builderAddress]}
                />
              ) : (
                <Proposal
                  key={`${grant.type}-${grant.id}`}
                  proposal={grant}
                  userSubmissionsAmount={submissionsByBuilderAddress[grant.builderAddress]}
                />
              ),
            )}
          </div>
        </div>

        <div className="flex flex-col items-center p-4 sm:p-6 bg-light-purple rounded-xl">
          <h2 className="text-2xl font-bold !m-0">Milestones to Review ({milestones.length})</h2>
          <div className="mt-4 sm:mt-6 space-y-4 w-full flex flex-col items-center">
            {milestones.map(milestone => (
              <LargeMilestoneCompleted key={milestone.id} milestone={milestone} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
