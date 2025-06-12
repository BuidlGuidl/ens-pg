import { InferInsertModel, InferSelectModel, desc, eq, or } from "drizzle-orm";
import { db } from "~~/services/database/config/postgresClient";
import { largeMilestones } from "~~/services/database/config/schema";

export type LargeMilestoneInsert = InferInsertModel<typeof largeMilestones>;
export type LargeMilestoneUpdate = Partial<LargeMilestoneInsert>;
export type LargeMilestone = InferSelectModel<typeof largeMilestones>;

// Note: not used yet
export async function createMilestone(milestone: LargeMilestoneInsert) {
  return await db.insert(largeMilestones).values(milestone).returning({ id: largeMilestones.id });
}

export async function updateMilestone(
  milestoneId: Required<LargeMilestoneUpdate>["id"],
  milestone: LargeMilestoneUpdate,
) {
  return await db.update(largeMilestones).set(milestone).where(eq(largeMilestones.id, milestoneId));
}

// Note: not used yet
export async function updateMilestoneStatusToCompleted(milestoneId: number) {
  return await db.update(largeMilestones).set({ status: "completed" }).where(eq(largeMilestones.id, milestoneId));
}

export async function getCompletedOrVerifiedMilestones() {
  return await db.query.largeMilestones.findMany({
    where: or(eq(largeMilestones.status, "completed"), eq(largeMilestones.status, "verified")),
    orderBy: [desc(largeMilestones.completedAt)],
    with: {
      stage: {
        with: {
          grant: true,
        },
      },
      privateNotes: true,
    },
  });
}

export async function getMilestoneByIdWithRelatedData(milestoneId: number) {
  return await db.query.largeMilestones.findFirst({
    where: eq(largeMilestones.id, milestoneId),
    with: {
      stage: {
        with: {
          grant: true,
        },
      },
    },
  });
}
