import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { db } from "~~/services/database/config/postgresClient";
import { largeApprovalVotes } from "~~/services/database/config/schema";

export type LargeApprovalVoteInsert = InferInsertModel<typeof largeApprovalVotes>;
export type LargeApprovalVote = InferSelectModel<typeof largeApprovalVotes>;

export async function createLargeApprovalVote(approvalVote: LargeApprovalVoteInsert) {
  return await db.insert(largeApprovalVotes).values(approvalVote).returning({ id: largeApprovalVotes.id });
}
