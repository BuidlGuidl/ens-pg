import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getMilestoneByIdWithRelatedData } from "~~/services/database/repositories/milestones";
import { authOptions } from "~~/utils/auth";

export async function GET(_request: Request, { params }: { params: { milestoneId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const { milestoneId } = params;

    const milestone = await getMilestoneByIdWithRelatedData(Number(milestoneId));

    if (!milestone) {
      return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
    }

    if (session?.user?.role !== "admin" && session?.user?.address !== milestone.stage.grant.builderAddress) {
      return NextResponse.json("Access denied", { status: 403 });
    }

    return NextResponse.json({ status: milestone.status }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
