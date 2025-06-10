import { CurrentStage } from "./_components/CurrentStage";
import { GrantDetails } from "./_components/GrantDetails";
import { ProjectTimeline } from "./_components/ProjectTimeline";
import { getServerSession } from "next-auth";
import { getLargeGrantById } from "~~/services/database/repositories/large-grants";
import { authOptions } from "~~/utils/auth";

export type LargeGrantWithStages = Awaited<ReturnType<typeof getLargeGrantById>>;

const Grant = async ({ params }: { params: { grantId: string } }) => {
  const grantId = Number(params.grantId);
  const session = await getServerSession(authOptions);

  const grant = await getLargeGrantById(grantId);

  if (!grant) {
    return (
      <div className="flex items-center text-xl flex-col flex-grow pt-10 space-y-4">No grant with id {grantId}</div>
    );
  }

  if (session?.user?.role !== "admin" && grant.builderAddress !== session?.user.address) {
    return <div className="flex items-center text-xl flex-col flex-grow pt-10 space-y-4">Access denied</div>;
  }

  return (
    <div className="flex items-center flex-col flex-grow pt-10 space-y-8 px-2">
      <h1 className="text-3xl font-extrabold">{grant.title}</h1>
      <GrantDetails grant={grant} />
      <CurrentStage stage={grant.stages[grant.stages.length - 1]} />
      <ProjectTimeline grant={grant} />
    </div>
  );
};

export default Grant;
