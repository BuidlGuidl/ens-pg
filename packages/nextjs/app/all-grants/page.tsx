import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { AllGrantsList } from "~~/app/_components/Grants/AllGrantsList";
import { SignInBtn } from "~~/components/pg-ens/SignInBtn";
import { getAllGrants } from "~~/services/database/repositories/grants";
import { getAllLargeGrants } from "~~/services/database/repositories/large-grants";
import { DiscriminatedAdminGrant } from "~~/types/utils";
import { authOptions } from "~~/utils/auth";

export const revalidate = 0;

export default async function AllGrantsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return (
      <div className="flex flex-col items-center px-4 py-10 sm:py-20">
        <h1 className="text-3xl text-center font-extrabold mb-1">Sign In</h1>
        <p className="mb-6">You need to sign in to access the all grants page.</p>
        <SignInBtn />
      </div>
    );
  }

  if (session.user.role !== "admin") {
    return redirect("/");
  }

  const grants: DiscriminatedAdminGrant[] = (await getAllGrants()).map(grant => ({ ...grant, type: "grant" }));
  const largeGrants: DiscriminatedAdminGrant[] = (await getAllLargeGrants()).map(grant => ({
    ...grant,
    type: "largeGrant",
  }));

  const allGrants: DiscriminatedAdminGrant[] = [...grants, ...largeGrants].sort(
    (a, b) => (b.submitedAt?.getTime() ?? 0) - (a.submitedAt?.getTime() ?? 0),
  );

  return (
    <div className="py-10 px-4 flex flex-col items-center w-full">
      <h1 className="text-3xl text-center font-extrabold">All Grants</h1>
      <p className="text-center text-lg mb-10">
        This view is only for admins, you can check all the grants and their current stage and status. Click on the
        grant title to open the details.
      </p>
      <AllGrantsList allGrants={allGrants} />
    </div>
  );
}
