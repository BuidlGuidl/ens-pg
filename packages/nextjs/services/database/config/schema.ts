import { relations, sql } from "drizzle-orm";
import { bigint, integer, pgEnum, pgTable, serial, text, timestamp, unique, varchar } from "drizzle-orm/pg-core";

// TODO: Define the right schema.

export const grants = pgTable("grants", {
  // TODO: Should ID be a UUID? Or is it fine as a serial?
  id: serial("id").primaryKey(),
  grantNumber: integer("grant_number").notNull().default(1),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  milestones: text("milestones").notNull(),
  showcaseVideoUrl: text("showcaseVideoUrl"),
  requestedFunds: bigint("requestedFunds", { mode: "bigint" }).notNull(),
  github: text("github").notNull(),
  email: text("email").notNull(),
  twitter: text("twitter"),
  telegram: text("telegram"),
  submitedAt: timestamp("submited_at").default(sql`now()`),
  builderAddress: varchar("builder_address", { length: 42 })
    .references(() => users.address)
    .notNull(),
});

export const grantsRelations = relations(grants, ({ many, one }) => ({
  stages: many(stages),
  user: one(users, {
    fields: [grants.builderAddress],
    references: [users.address],
  }),
}));

export const stagesStatusEnum = pgEnum("stage_status", ["proposed", "approved", "completed", "rejected"]);
export const stages = pgTable("stages", {
  // TODO: Should ID be a UUID?
  id: serial("id").primaryKey(),
  stageNumber: integer("stage_number").notNull().default(1),
  milestone: text("milestone"),
  submitedAt: timestamp("submited_at").default(sql`now()`),
  grantId: integer("grant_id")
    .references(() => grants.id)
    .notNull(),
  grantAmount: bigint("grantAmount", { mode: "bigint" }),
  status: stagesStatusEnum("status").notNull().default("proposed"),
  statusNote: text("statusNote"),
  approvedTx: varchar("approved_tx", { length: 66 }),
  approvedAt: timestamp("approved_at"),
});

export const approvalVotes = pgTable(
  "approval_votes",
  {
    id: serial("id").primaryKey(),
    amount: bigint("amount", { mode: "bigint" }).notNull(),
    votedAt: timestamp("voted_at").default(sql`now()`),
    stageId: integer("stage_id")
      .references(() => stages.id)
      .notNull(),
    authorAddress: varchar("author_address", { length: 42 })
      .references(() => users.address)
      .notNull(),
  },
  table => ({
    // Ensure each author can only vote once per stage
    uniqueVotePerStage: unique().on(table.stageId, table.authorAddress),
  }),
);

export const approvalVotesRelations = relations(approvalVotes, ({ one }) => ({
  stage: one(stages, {
    fields: [approvalVotes.stageId],
    references: [stages.id],
  }),
}));

export const privateNotes = pgTable("private_notes", {
  id: serial("id").primaryKey(),
  note: text("note").notNull(),
  writtenAt: timestamp("written_at").default(sql`now()`),
  stageId: integer("stage_id")
    .references(() => stages.id)
    .notNull(),
  authorAddress: varchar("author_address", { length: 42 })
    .references(() => users.address)
    .notNull(),
});

export const privateNotesRelations = relations(privateNotes, ({ one }) => ({
  stage: one(stages, {
    fields: [privateNotes.stageId],
    references: [stages.id],
  }),
}));

export const stagesRelations = relations(stages, ({ one, many }) => ({
  grant: one(grants, {
    fields: [stages.grantId],
    references: [grants.id],
  }),
  privateNotes: many(privateNotes),
  approvalVotes: many(approvalVotes),
}));

export const userRoleEnum = pgEnum("user_role", ["admin", "grantee"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  role: userRoleEnum("role").notNull().default("grantee"),
  address: varchar("address", { length: 42 }).unique().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  grants: many(grants),
}));
