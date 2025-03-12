import { InferInsertModel, InferSelectModel, desc, eq, max } from "drizzle-orm";
import { db } from "~~/services/database/config/postgresClient";
import { largeGrants, largeMilestones, largeStages } from "~~/services/database/config/schema";

export type LargeGrantInsert = InferInsertModel<typeof largeGrants>;
export type LargeGrant = InferSelectModel<typeof largeGrants>;
export type PublicLargeGrant = Awaited<ReturnType<typeof getPublicLargeGrants>>[number];

// Note: not used yet
export async function getAllLargeGrants() {
  return await db.query.largeGrants.findMany({
    orderBy: [desc(largeGrants.submitedAt)],
    with: {
      stages: {
        // this makes sure latest stage is first
        orderBy: [desc(largeStages.stageNumber)],
      },
    },
  });
}

// Excludes sensitive information for public pages
export async function getPublicLargeGrants() {
  return await db.query.largeGrants.findMany({
    orderBy: [desc(largeGrants.submitedAt)],
    columns: {
      id: true,
      grantNumber: true,
      title: true,
      description: true,
      builderAddress: true,
      submitedAt: true,
    },
    with: {
      stages: {
        orderBy: [desc(largeStages.stageNumber)],
        columns: {
          id: true,
          stageNumber: true,
          submitedAt: true,
          status: true,
        },
        with: {
          milestones: {
            orderBy: [desc(largeMilestones.milestoneNumber)],
            columns: {
              id: true,
              milestoneNumber: true,
              description: true,
              amount: true,
              status: true,
              completedAt: true,
              completionProof: true,
            },
          },
        },
      },
    },
  });
}

// Note: not used yet
// Note: use only for admin pages
export async function getAllLargeGrantsWithStagesAndPrivateNotes() {
  return await db.query.largeGrants.findMany({
    orderBy: [desc(largeGrants.submitedAt)],
    with: {
      stages: {
        // this makes sure latest stage is first
        orderBy: [desc(largeStages.stageNumber)],
        with: {
          privateNotes: true,
          approvalVotes: true,
        },
      },
    },
  });
}

// Note: not used yet
export async function getBuilderLargeGrants(builderAddress: string) {
  return await db.query.largeGrants.findMany({
    where: eq(largeGrants.builderAddress, builderAddress),
    with: {
      stages: {
        orderBy: [desc(largeStages.stageNumber)],
      },
    },
  });
}

// Note: not used yet
export async function createLargeGrant(grant: LargeGrantInsert) {
  const maxGrantNumber = await db
    .select({ maxNumber: max(largeGrants.grantNumber) })
    .from(largeGrants)
    .where(eq(largeGrants.builderAddress, grant.builderAddress))
    .then(result => result[0]?.maxNumber ?? 0);

  const newGrantNumber = maxGrantNumber + 1;

  return await db
    .insert(largeGrants)
    .values({ ...grant, grantNumber: newGrantNumber })
    .returning({ id: largeGrants.id, grantNumber: largeGrants.grantNumber });
}

// Note: not used yet
export async function getLargeGrantById(grantId: number) {
  return await db.query.largeGrants.findFirst({
    where: eq(largeGrants.id, grantId),
    with: {
      stages: {
        orderBy: [desc(largeStages.stageNumber)],
      },
    },
  });
}
