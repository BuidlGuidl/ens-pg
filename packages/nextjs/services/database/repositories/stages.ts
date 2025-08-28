import { Milestone } from "./milestones";
import { InferInsertModel, InferSelectModel, and, eq } from "drizzle-orm";
import { db } from "~~/services/database/config/postgresClient";
import { grants, milestones, stages, stagesStatusEnum } from "~~/services/database/config/schema";

export type StageInsert = InferInsertModel<typeof stages>;
export type StageInsertWithMilestones = StageInsert & {
  milestones: Omit<InferInsertModel<typeof milestones>, "stageId" | "milestoneNumber">[];
};
export type StageUpdate = Partial<StageInsert>;
export type Stage = InferSelectModel<typeof stages>;
export type StageWithMilestones = Stage & {
  milestones: Milestone[];
};
export type Status = (typeof stagesStatusEnum.enumValues)[number];

export async function createStage(
  stage: StageInsertWithMilestones,
): Promise<{ stageId: number; createdMilestones: number[] }> {
  return await db.transaction(async tx => {
    const [createdStage] = await tx.insert(stages).values(stage).returning({ id: stages.id });

    // Prepare all milestone data with the correct stageId and milestoneNumber
    const milestoneData = stage.milestones.map((milestone, index) => ({
      ...milestone,
      stageId: createdStage.id,
      milestoneNumber: index + 1,
    }));

    // Bulk insert all milestones at once
    const createdMilestoneResults = await tx.insert(milestones).values(milestoneData).returning({ id: milestones.id });

    // Extract the IDs of the created milestones
    const createdMilestones = createdMilestoneResults.map(result => result.id);

    return { stageId: createdStage.id, createdMilestones };
  });
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

export async function updateStageMilestonesGrantedAmounts(
  stageId: number,
  milestoneAmounts: { grantedAmount: bigint }[],
): Promise<number[]> {
  return await db.transaction(async tx => {
    const milestoneIds = [];
    for (let index = 0; index < milestoneAmounts.length; index++) {
      const milestone = milestoneAmounts[index];
      const [updatedMilestone] = await tx
        .update(milestones)
        .set({ grantedAmount: milestone.grantedAmount, status: "approved" })
        .where(and(eq(milestones.stageId, stageId), eq(milestones.milestoneNumber, index + 1)))
        .returning({ id: milestones.id });
      milestoneIds.push(updatedMilestone.id);
    }
    return milestoneIds;
  });
}

export async function getStageWithMilestones(stageId: number) {
  return await db.query.stages.findFirst({
    where: eq(stages.id, stageId),
    with: {
      milestones: true,
    },
  });
}
