import { LargeMilestone } from "./large-milestones";
import { InferInsertModel, InferSelectModel, eq } from "drizzle-orm";
import { db } from "~~/services/database/config/postgresClient";
import { largeMilestones, largeStages, stagesStatusEnum } from "~~/services/database/config/schema";

export type LargeStageInsert = InferInsertModel<typeof largeStages>;
export type LargeStageInsertWithMilestones = LargeStageInsert & {
  milestones: Omit<InferInsertModel<typeof largeMilestones>, "stageId" | "milestoneNumber">[];
};
export type LargeStageUpdate = Partial<LargeStageInsert>;
export type LargeStage = InferSelectModel<typeof largeStages>;
export type LargeStageWithMilestones = LargeStage & {
  milestones: LargeMilestone[];
};

export type Status = (typeof stagesStatusEnum.enumValues)[number];

export async function createStage(
  stage: LargeStageInsertWithMilestones,
): Promise<{ stageId: number; createdMilestones: number[] }> {
  return await db.transaction(async tx => {
    const [createdStage] = await tx.insert(largeStages).values(stage).returning({ id: largeStages.id });

    // Prepare all milestone data with the correct stageId and milestoneNumber
    const milestoneData = stage.milestones.map((milestone, index) => ({
      ...milestone,
      stageId: createdStage.id,
      milestoneNumber: index + 1,
    }));

    // Bulk insert all milestones at once
    const createdMilestoneResults = await tx
      .insert(largeMilestones)
      .values(milestoneData)
      .returning({ id: largeMilestones.id });

    // Extract the IDs of the created milestones
    const createdMilestones = createdMilestoneResults.map(result => result.id);

    return { stageId: createdStage.id, createdMilestones };
  });
}

export async function updateStage(stageId: Required<LargeStageUpdate>["id"], stage: LargeStageUpdate) {
  return await db.update(largeStages).set(stage).where(eq(largeStages.id, stageId));
}

export async function approveStage(stageId: Required<LargeStageUpdate>["id"], stage: LargeStageUpdate) {
  stage.status = "approved";

  return await db.transaction(async tx => {
    const result = await tx.update(largeStages).set(stage).where(eq(largeStages.id, stageId));

    await tx.update(largeMilestones).set({ status: "approved" }).where(eq(largeMilestones.stageId, stageId));

    return result;
  });
}

export async function getStageByIdWithGrantAndVotes(stageId: number) {
  return await db.query.largeStages.findFirst({
    where: eq(largeStages.id, stageId),
    with: {
      grant: true,
      approvalVotes: true,
      rejectVotes: true,
    },
  });
}

export async function getStageWithMilestones(stageId: number) {
  return await db.query.largeStages.findFirst({
    where: eq(largeStages.id, stageId),
    with: {
      milestones: true,
    },
  });
}

export async function updateStageStatusToCompleted(stageId: number) {
  return await db.update(largeStages).set({ status: "completed" }).where(eq(largeStages.id, stageId));
}
