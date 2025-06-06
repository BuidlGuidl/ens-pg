import { InferInsertModel, InferSelectModel, and, eq } from "drizzle-orm";
import { db } from "~~/services/database/config/postgresClient";
import { grants, stages, stagesStatusEnum } from "~~/services/database/config/schema";

export type StageInsert = InferInsertModel<typeof stages>;
export type StageUpdate = Partial<StageInsert>;
export type Stage = InferSelectModel<typeof stages>;
export type Status = (typeof stagesStatusEnum.enumValues)[number];

export async function createStage(stage: StageInsert) {
  return await db.insert(stages).values(stage).returning({ id: stages.id });
}

export async function updateStage(stageId: Required<StageUpdate>["id"], stage: StageUpdate) {
  return await db.update(stages).set(stage).where(eq(stages.id, stageId));
}

export async function getStageByIdWithGrantAndVotes(stageId: number) {
  return await db.query.stages.findFirst({
    where: eq(stages.id, stageId),
    with: {
      grant: true,
      approvalVotes: true,
      rejectVotes: true,
    },
  });
}

export async function updateStageStatusToCompleted(stageId: number) {
  return await db.update(stages).set({ status: "completed" }).where(eq(stages.id, stageId));
}

export async function findStageByGrantNumberStageNumberAndBuilderAddress(
  grantNumber: number,
  stageNumber: number,
  builderAddress: string,
) {
  return await db
    .select({
      stage: stages,
      grant: grants,
    })
    .from(stages)
    .leftJoin(grants, eq(stages.grantId, grants.id))
    .where(
      and(
        eq(stages.stageNumber, stageNumber),
        eq(grants.grantNumber, grantNumber),
        eq(grants.builderAddress, builderAddress),
      ),
    )
    .limit(1);
}
