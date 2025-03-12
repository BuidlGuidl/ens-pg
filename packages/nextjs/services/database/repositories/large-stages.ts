import { InferInsertModel, InferSelectModel, and, eq } from "drizzle-orm";
import { db } from "~~/services/database/config/postgresClient";
import { largeGrants, largeStages, stagesStatusEnum } from "~~/services/database/config/schema";

export type LargeStageInsert = InferInsertModel<typeof largeStages>;
export type LargeStageUpdate = Partial<LargeStageInsert>;
export type LargeStage = InferSelectModel<typeof largeStages>;
export type Status = (typeof stagesStatusEnum.enumValues)[number];

// Note: not used yet
export async function createStage(stage: LargeStageInsert) {
  return await db.insert(largeStages).values(stage).returning({ id: largeStages.id });
}

// Note: not used yet
export async function updateStage(stageId: Required<LargeStageUpdate>["id"], stage: LargeStageUpdate) {
  return await db.update(largeStages).set(stage).where(eq(largeStages.id, stageId));
}

// Note: not used yet
export async function getStageByIdWithGrantAndVotes(stageId: number) {
  return await db.query.largeStages.findFirst({
    where: eq(largeStages.id, stageId),
    with: {
      grant: true,
      approvalVotes: true,
    },
  });
}

// Note: not used yet
export async function updateStageStatusToCompleted(stageId: number) {
  return await db.update(largeStages).set({ status: "completed" }).where(eq(largeStages.id, stageId));
}

// Note: not used yet
export async function findStageByGrantNumberStageNumberAndBuilderAddress(
  grantNumber: number,
  stageNumber: number,
  builderAddress: string,
) {
  return await db
    .select({
      stage: largeStages,
      grant: largeGrants,
    })
    .from(largeStages)
    .leftJoin(largeGrants, eq(largeStages.grantId, largeGrants.id))
    .where(
      and(
        eq(largeStages.stageNumber, stageNumber),
        eq(largeGrants.grantNumber, grantNumber),
        eq(largeGrants.builderAddress, builderAddress),
      ),
    )
    .limit(1);
}
