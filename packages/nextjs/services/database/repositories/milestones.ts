import { InferInsertModel, InferSelectModel, eq } from "drizzle-orm";
import { db } from "~~/services/database/config/postgresClient";
import { milestones } from "~~/services/database/config/schema";

export type MilestoneInsert = InferInsertModel<typeof milestones>;
export type MilestoneUpdate = Partial<MilestoneInsert>;
export type Milestone = InferSelectModel<typeof milestones>;

export async function updateMilestoneStatusToPaid({
  milestoneId,
  paymentTx,
  completionProof,
}: {
  milestoneId: number;
  paymentTx: string;
  completionProof: string;
}) {
  return await db
    .update(milestones)
    .set({ status: "paid", paymentTx, completionProof, completedAt: new Date() })
    .where(eq(milestones.id, milestoneId));
}

export async function getMilestoneByIdWithRelatedData(milestoneId: number) {
  return await db.query.milestones.findFirst({
    where: eq(milestones.id, milestoneId),
    with: {
      stage: {
        with: {
          grant: true,
        },
      },
    },
  });
}
