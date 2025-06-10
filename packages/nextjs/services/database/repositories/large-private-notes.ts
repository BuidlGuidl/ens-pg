import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { db } from "~~/services/database/config/postgresClient";
import { largePrivateNotes } from "~~/services/database/config/schema";

export type PrivateNoteInsert = InferInsertModel<typeof largePrivateNotes>;
export type PrivateNote = InferSelectModel<typeof largePrivateNotes>;

export async function createLargePrivateNote(privateNote: PrivateNoteInsert) {
  return await db.insert(largePrivateNotes).values(privateNote).returning({ id: largePrivateNotes.id });
}
