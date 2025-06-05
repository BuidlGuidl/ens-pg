import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { db } from "~~/services/database/config/postgresClient";
import { rejectVotes } from "~~/services/database/config/schema";

export type RejectVoteInsert = InferInsertModel<typeof rejectVotes>;
export type RejectVote = InferSelectModel<typeof rejectVotes>;

export async function createRejectVote(rejectVote: RejectVoteInsert) {
  return await db.insert(rejectVotes).values(rejectVote).returning({ id: rejectVotes.id });
}
