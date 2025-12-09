import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAllGrants } from "~~/services/database/repositories/grants";
import { getAllLargeGrants } from "~~/services/database/repositories/large-grants";
import { authOptions } from "~~/utils/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  // Check authentication
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const grants = await getAllGrants();
    const largeGrants = await getAllLargeGrants();

    // Serialize data for client
    const serializedGrants = grants.map(grant => ({
      id: grant.id,
      title: grant.title,
      builderAddress: grant.builderAddress,
      email: grant.email,
      submitedAt: grant.submitedAt?.toISOString(),
      grantNumber: grant.grantNumber,
      requestedFunds: grant.requestedFunds?.toString(),
      type: "grant" as const,
      stages: grant.stages.map(stage => ({
        id: stage.id,
        stageNumber: stage.stageNumber,
        status: stage.status,
        grantAmount: stage.grantAmount?.toString(),
        submitedAt: stage.submitedAt?.toISOString(),
        approvedAt: stage.approvedAt?.toISOString(),
        milestones: stage.milestones?.map(m => ({
          id: m.id,
          milestoneNumber: m.milestoneNumber,
          requestedAmount: m.requestedAmount?.toString(),
          grantedAmount: m.grantedAmount?.toString(),
          completedAt: m.completedAt?.toISOString(),
        })),
      })),
    }));

    const serializedLargeGrants = largeGrants.map(grant => ({
      id: grant.id,
      title: grant.title,
      builderAddress: grant.builderAddress,
      email: grant.email,
      submitedAt: grant.submitedAt?.toISOString(),
      type: "largeGrant" as const,
      stages: grant.stages.map(stage => ({
        id: stage.id,
        stageNumber: stage.stageNumber,
        status: stage.status,
        submitedAt: stage.submitedAt?.toISOString(),
        approvedAt: stage.approvedAt?.toISOString(),
        milestones: stage.milestones?.map(m => ({
          id: m.id,
          milestoneNumber: m.milestoneNumber,
          amount: m.amount,
          status: m.status,
          proposedCompletionDate: m.proposedCompletionDate?.toISOString(),
          completedAt: m.completedAt?.toISOString(),
          verifiedAt: m.verifiedAt?.toISOString(),
          paidAt: m.paidAt?.toISOString(),
        })),
      })),
    }));

    const allGrants = [...serializedGrants, ...serializedLargeGrants].sort((a, b) => {
      const aTime = a.submitedAt ? new Date(a.submitedAt).getTime() : 0;
      const bTime = b.submitedAt ? new Date(b.submitedAt).getTime() : 0;
      return bTime - aTime;
    });

    return NextResponse.json(allGrants);
  } catch (error) {
    console.error("Error fetching grants for export:", error);
    return NextResponse.json({ error: "Failed to fetch grants" }, { status: 500 });
  }
}
