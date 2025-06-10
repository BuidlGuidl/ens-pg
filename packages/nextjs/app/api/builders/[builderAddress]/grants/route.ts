import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getBuilderGrants } from "~~/services/database/repositories/grants";
import { getBuilderLargeGrants } from "~~/services/database/repositories/large-grants";
import { DiscriminatedBuilderGrant } from "~~/types/utils";
import { authOptions } from "~~/utils/auth";

export type BuilderGrantsResponse = DiscriminatedBuilderGrant[];

// https://github.com/GoogleChromeLabs/jsbi/issues/30#issuecomment-1006086291
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

export async function GET(_request: Request, { params }: { params: { builderAddress: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const builderAddress = params.builderAddress;

    if (session?.user.address !== builderAddress && session?.user.role !== "admin") {
      return NextResponse.json("Access denied", { status: 403 });
    }

    const grants = (await getBuilderGrants(builderAddress)).map(grant => ({ ...grant, type: "grant" }));
    const largeGrants = (await getBuilderLargeGrants(builderAddress)).map(grant => ({ ...grant, type: "largeGrant" }));

    const allGrants = [...grants, ...largeGrants];
    allGrants.sort((a, b) => (b.submitedAt?.getTime() ?? 0) - (a.submitedAt?.getTime() ?? 0));

    return NextResponse.json(allGrants, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
