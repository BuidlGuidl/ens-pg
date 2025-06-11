import { InferInsertModel, InferSelectModel, desc, eq, max } from "drizzle-orm";
import { db } from "~~/services/database/config/postgresClient";
import { grants, milestones, stages } from "~~/services/database/config/schema";

export type GrantInsert = InferInsertModel<typeof grants>;
export type GrantInsertWithMilestones = Omit<GrantInsert, "milestones"> & {
  milestones: Omit<InferInsertModel<typeof milestones>, "stageId" | "milestoneNumber">[];
};
export type Grant = InferSelectModel<typeof grants>;
export type PublicGrant = Awaited<ReturnType<typeof getPublicGrants>>[number];

export async function getAllGrants() {
  return await db.query.grants.findMany({
    orderBy: [desc(grants.submitedAt)],
    with: {
      stages: {
        // this makes sure latest stage is first
        orderBy: [desc(stages.stageNumber)],
        with: {
          privateNotes: true,
        },
      },
    },
  });
}

// Excludes sensitive information for public pages
export async function getPublicGrants() {
  return await db.query.grants.findMany({
    orderBy: [desc(grants.submitedAt)],
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
        orderBy: [desc(stages.stageNumber)],
        columns: {
          id: true,
          stageNumber: true,
          submitedAt: true,
          grantAmount: true,
          status: true,
        },
      },
    },
  });
}

// Note: use only for admin pages
export async function getAllGrantsWithStagesAndPrivateNotes() {
  return await db.query.grants.findMany({
    orderBy: [desc(grants.submitedAt)],
    with: {
      stages: {
        // this makes sure latest stage is first
        orderBy: [desc(stages.stageNumber)],
        with: {
          privateNotes: true,
          approvalVotes: true,
          rejectVotes: true,
        },
      },
    },
  });
}

export async function getBuilderGrants(builderAddress: string) {
  return await db.query.grants.findMany({
    where: eq(grants.builderAddress, builderAddress),
    with: {
      stages: {
        orderBy: [desc(stages.stageNumber)],
      },
    },
  });
}

export async function createGrant(
  grant: GrantInsertWithMilestones,
): Promise<{ grantId: number; stageId: number; createdMilestones: number[] }> {
  return await db.transaction(async tx => {
    const maxGrantNumber = await db
      .select({ maxNumber: max(grants.grantNumber) })
      .from(grants)
      .where(eq(grants.builderAddress, grant.builderAddress))
      .then(result => result[0]?.maxNumber ?? 0);

    const newGrantNumber = maxGrantNumber + 1;

    const [createdGrant] = await tx
      .insert(grants)
      .values({ ...grant, grantNumber: newGrantNumber, milestones: undefined })
      .returning({ id: grants.id, grantNumber: grants.grantNumber });
    const [createdStage] = await tx.insert(stages).values({ grantId: createdGrant.id }).returning({ id: stages.id });

    const createdMilestones = [];

    for (let i = 0; i < grant.milestones.length; i++) {
      const milestone = grant.milestones[i];
      const [createdMilestone] = await tx
        .insert(milestones)
        .values({
          ...milestone,
          stageId: createdStage.id,
          milestoneNumber: i + 1,
        })
        .returning({ id: milestones.id });
      createdMilestones.push(createdMilestone.id);
    }

    return {
      grantId: createdGrant.id,
      grantNumber: createdGrant.grantNumber,
      stageId: createdStage.id,
      createdMilestones,
    };
  });
}

export async function getGrantById(grantId: number) {
  return await db.query.grants.findFirst({
    where: eq(grants.id, grantId),
    with: {
      stages: {
        orderBy: [desc(stages.stageNumber)],
      },
    },
  });
}
