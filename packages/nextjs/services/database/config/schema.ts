import { relations, sql } from "drizzle-orm";
import { bigint, date, integer, pgEnum, pgTable, serial, text, timestamp, unique, varchar } from "drizzle-orm/pg-core";

export const milestonesStatusEnum = pgEnum("milestones_status", [
  "proposed",
  "approved",
  "completed",
  "verified",
  "paid",
  "rejected",
]);

export type MilestoneStatus = (typeof milestonesStatusEnum.enumValues)[number];

export const grants = pgTable("grants", {
  // TODO: Should ID be a UUID? Or is it fine as a serial?
  id: serial("id").primaryKey(),
  grantNumber: integer("grant_number").notNull().default(1),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  milestones: text("milestones"),
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

export const milestones = pgTable("milestones", {
  id: serial("id").primaryKey(),
  milestoneNumber: integer("milestone_number").notNull().default(1),
  stageId: integer("stage_id")
    .references(() => stages.id)
    .notNull(),
  description: text("description").notNull(),
  proposedDeliverables: text("proposed_deliverables").notNull(),
  completionProof: text("completion_proof"),
  completedAt: timestamp("completed_at"),
  requestedAmount: bigint("requested_amount", { mode: "bigint" }).notNull(),
  grantedAmount: bigint("granted_amount", { mode: "bigint" }),
  status: milestonesStatusEnum("status").notNull().default("proposed"),
  statusNote: text("statusNote"),
  paymentTx: varchar("payment_tx", { length: 66 }),
  paidAt: timestamp("paid_at"),
});

export const milestonesRelations = relations(milestones, ({ one }) => ({
  stage: one(stages, {
    fields: [milestones.stageId],
    references: [stages.id],
  }),
}));

export const approvalVotes = pgTable(
  "approval_votes",
  {
    id: serial("id").primaryKey(),
    amount: bigint("amount", { mode: "bigint" }),
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

export const rejectVotes = pgTable(
  "reject_votes",
  {
    id: serial("id").primaryKey(),
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

export const rejectVotesRelations = relations(rejectVotes, ({ one }) => ({
  stage: one(stages, {
    fields: [rejectVotes.stageId],
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
  milestones: many(milestones),
  privateNotes: many(privateNotes),
  approvalVotes: many(approvalVotes),
  rejectVotes: many(rejectVotes),
}));

export const largeGrants = pgTable("large_grants", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  showcaseVideoUrl: text("showcaseVideoUrl"),
  github: text("github").notNull(),
  email: text("email").notNull(),
  twitter: text("twitter"),
  telegram: text("telegram"),
  submitedAt: timestamp("submited_at").default(sql`now()`),
  builderAddress: varchar("builder_address", { length: 42 })
    .references(() => users.address)
    .notNull(),
});

export const largeGrantsRelations = relations(largeGrants, ({ many, one }) => ({
  stages: many(largeStages),
  user: one(users, {
    fields: [largeGrants.builderAddress],
    references: [users.address],
  }),
}));

export const largeStages = pgTable("large_stages", {
  id: serial("id").primaryKey(),
  stageNumber: integer("stage_number").notNull().default(1),
  submitedAt: timestamp("submited_at").default(sql`now()`),
  grantId: integer("grant_id")
    .references(() => largeGrants.id)
    .notNull(),
  status: stagesStatusEnum("status").notNull().default("proposed"),
  statusNote: text("statusNote"),
  approvedTx: varchar("approved_tx", { length: 66 }),
  approvedAt: timestamp("approved_at"),
});

export const largeMilestones = pgTable("large_milestones", {
  id: serial("id").primaryKey(),
  milestoneNumber: integer("milestone_number").notNull().default(1),
  stageId: integer("stage_id")
    .references(() => largeStages.id)
    .notNull(),
  description: text("description").notNull(),
  proposedDeliverables: text("proposed_deliverables").notNull(),
  proposedCompletionDate: date("proposed_completion_date", { mode: "date" }).notNull(),
  completionProof: text("completion_proof"),
  completedAt: timestamp("completed_at"),
  amount: integer("amount").notNull(),
  status: milestonesStatusEnum("status").notNull().default("proposed"),
  statusNote: text("statusNote"),
  verifiedTx: varchar("verified_tx", { length: 66 }),
  verifiedAt: timestamp("verified_at"),
  verifiedBy: varchar("verified_by", { length: 42 }),
  paymentTx: varchar("payment_tx", { length: 66 }),
  paidAt: timestamp("paid_at"),
  paidBy: varchar("paid_by", { length: 42 }),
});

export const largeMilestonesRelations = relations(largeMilestones, ({ one, many }) => ({
  stage: one(largeStages, {
    fields: [largeMilestones.stageId],
    references: [largeStages.id],
  }),
  privateNotes: many(largeMilestonePrivateNotes),
}));

export const largeApprovalVotes = pgTable(
  "large_approval_votes",
  {
    id: serial("id").primaryKey(),
    votedAt: timestamp("voted_at").default(sql`now()`),
    stageId: integer("stage_id")
      .references(() => largeStages.id)
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

export const largeApprovalVotesRelations = relations(largeApprovalVotes, ({ one }) => ({
  stage: one(largeStages, {
    fields: [largeApprovalVotes.stageId],
    references: [largeStages.id],
  }),
}));

export const largeRejectVotes = pgTable(
  "large_reject_votes",
  {
    id: serial("id").primaryKey(),
    votedAt: timestamp("voted_at").default(sql`now()`),
    stageId: integer("stage_id")
      .references(() => largeStages.id)
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

export const largeRejectVotesRelations = relations(largeRejectVotes, ({ one }) => ({
  stage: one(largeStages, {
    fields: [largeRejectVotes.stageId],
    references: [largeStages.id],
  }),
}));

export const largePrivateNotes = pgTable("large_private_notes", {
  id: serial("id").primaryKey(),
  note: text("note").notNull(),
  writtenAt: timestamp("written_at").default(sql`now()`),
  stageId: integer("stage_id")
    .references(() => largeStages.id)
    .notNull(),
  authorAddress: varchar("author_address", { length: 42 })
    .references(() => users.address)
    .notNull(),
});

export const largePrivateNotesRelations = relations(largePrivateNotes, ({ one }) => ({
  stage: one(largeStages, {
    fields: [largePrivateNotes.stageId],
    references: [largeStages.id],
  }),
}));

export const largeMilestonePrivateNotes = pgTable("large_milestone_private_notes", {
  id: serial("id").primaryKey(),
  note: text("note").notNull(),
  writtenAt: timestamp("written_at").default(sql`now()`),
  milestoneId: integer("milestone_id")
    .references(() => largeMilestones.id)
    .notNull(),
  authorAddress: varchar("author_address", { length: 42 })
    .references(() => users.address)
    .notNull(),
});

export const largeMilestonePrivateNotesRelations = relations(largeMilestonePrivateNotes, ({ one }) => ({
  milestone: one(largeMilestones, {
    fields: [largeMilestonePrivateNotes.milestoneId],
    references: [largeMilestones.id],
  }),
}));

export const largeStagesRelations = relations(largeStages, ({ one, many }) => ({
  grant: one(largeGrants, {
    fields: [largeStages.grantId],
    references: [largeGrants.id],
  }),
  milestones: many(largeMilestones),
  privateNotes: many(largePrivateNotes),
  approvalVotes: many(largeApprovalVotes),
  rejectVotes: many(largeRejectVotes),
}));

export const userRoleEnum = pgEnum("user_role", ["admin", "grantee"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  role: userRoleEnum("role").notNull().default("grantee"),
  address: varchar("address", { length: 42 }).unique().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  grants: many(grants),
  largeGrants: many(largeGrants),
}));
