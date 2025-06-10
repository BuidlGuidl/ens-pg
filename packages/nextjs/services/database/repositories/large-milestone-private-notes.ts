import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { db } from "~~/services/database/config/postgresClient";
import { largeMilestonePrivateNotes } from "~~/services/database/config/schema";

export type MilestonePrivateNoteInsert = InferInsertModel<typeof largeMilestonePrivateNotes>;
export type MilestonePrivateNote = InferSelectModel<typeof largeMilestonePrivateNotes>;

export async function createLargeMilestonePrivateNote(privateNote: MilestonePrivateNoteInsert) {
  return await db
    .insert(largeMilestonePrivateNotes)
    .values(privateNote)
    .returning({ id: largeMilestonePrivateNotes.id });
}
