import { InferInsertModel, InferSelectModel, desc, eq, max } from "drizzle-orm";
import { db } from "~~/services/database/config/postgresClient";
import { grants, stages } from "~~/services/database/config/schema";

export type GrantInsert = InferInsertModel<typeof grants>;
export type Grant = InferSelectModel<typeof grants>;

export async function getAllGrants() {
  return await db.query.grants.findMany({
    orderBy: [desc(grants.submitedAt)],
    with: {
      stages: {
        // this makes sure latest stage is first
        orderBy: [desc(stages.stageNumber)],
        with: {
          withdrawals: true,
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

export async function createGrant(grant: GrantInsert) {
  const maxGrantNumber = await db
    .select({ maxNumber: max(grants.grantNumber) })
    .from(grants)
    .where(eq(grants.builderAddress, grant.builderAddress))
    .then(result => result[0]?.maxNumber ?? 0);

  const newGrantNumber = maxGrantNumber + 1;

  return await db
    .insert(grants)
    .values({ ...grant, grantNumber: newGrantNumber })
    .returning({ id: grants.id, grantNumber: grants.grantNumber });
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
