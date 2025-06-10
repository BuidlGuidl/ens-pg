import {
  approvalVotes,
  grants,
  largeApprovalVotes,
  largeGrants,
  largeMilestonePrivateNotes,
  largeMilestones,
  largePrivateNotes,
  largeRejectVotes,
  largeStages,
  privateNotes,
  stages,
  users,
} from "./config/schema";
import * as schema from "./config/schema";
import * as dotenv from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import * as path from "path";
import { Pool } from "pg";
import { parseEther } from "viem";

dotenv.config({ path: path.resolve(__dirname, "../../.env.development") });

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

// TODO: protect, only for dev.
// TODO: fix: When you seed again, the ids start from previous deleted databse
async function seed() {
  const db = drizzle(pool, { schema });

  await db.delete(privateNotes).execute(); // Delete private notes first
  await db.delete(approvalVotes).execute();
  await db.delete(stages).execute(); // Ensure stages are deleted before grants
  await db.delete(grants).execute(); // Delete grants

  await db.delete(largeMilestonePrivateNotes).execute();
  await db.delete(largeMilestones).execute();
  await db.delete(largePrivateNotes).execute();
  await db.delete(largeApprovalVotes).execute();
  await db.delete(largeRejectVotes).execute();
  await db.delete(largeStages).execute();
  await db.delete(largeGrants).execute();

  await db.delete(users).execute();

  await db.insert(users).values([
    {
      address: "0x55b9CB0bCf56057010b9c471e7D42d60e1111EEa",
      role: "admin",
    },
    {
      address: "0x60583563D5879C2E59973E5718c7DE2147971807",
      role: "admin",
    },
    {
      address: "0xB4F53bd85c00EF22946d24Ae26BC38Ac64F5E7B1",
      role: "admin",
    },
    {
      address: "0xb8224dfCf3C174331a8e6a841AEEa7dF321f6D8E",
      role: "admin",
    },
  ]);

  const insertedGrants = await db
    .insert(grants)
    .values([
      {
        title: "Grant 1",
        description: "Description for grant 1",
        builderAddress: "0x55b9CB0bCf56057010b9c471e7D42d60e1111EEa",
        milestones: "Milestones 1",
        showcaseVideoUrl: "Video url 1",
        requestedFunds: parseEther("0.25"),
        github: "github-account-1",
        twitter: "twitter-account-1",
        telegram: "telegram-account-1",
        email: "email1@email.com",
      },
      {
        title: "Grant 2",
        description: "Description for grant 2",
        builderAddress: "0x60583563D5879C2E59973E5718c7DE2147971807",
        milestones: "Milestones 2",
        showcaseVideoUrl: "Video url 2",
        requestedFunds: parseEther("0.5"),
        github: "github-account-2",
        twitter: "twitter-account-2",
        telegram: null,
        email: "email2@email.com",
      },
      {
        title: "Grant 3",
        description: "Description for grant 3",
        builderAddress: "0xB4F53bd85c00EF22946d24Ae26BC38Ac64F5E7B1",
        milestones: "Milestones 3",
        showcaseVideoUrl: null,
        requestedFunds: parseEther("1"),
        github: "github-account-3",
        twitter: null,
        telegram: "telegram-account-3",
        email: "email3@email.com",
      },
    ])
    .returning({ id: grants.id })
    .execute();

  await db
    .insert(stages)
    .values([
      {
        milestone: "Milestone of stage 1 for Grant 1",
        stageNumber: 1,
        grantId: insertedGrants[0].id,
        status: "completed",
      },
      {
        milestone: "Milesotne of stage 2 for Grant 1",
        stageNumber: 2,
        grantId: insertedGrants[0].id,
      },
      {
        milestone: "Milestone of stage 1 for Grant 2",
        stageNumber: 1,
        grantId: insertedGrants[1].id,
      },
      {
        milestone: "Milestone of stage 1 for Grant 3",
        stageNumber: 1,
        grantId: insertedGrants[2].id,
      },
    ])
    .execute();

  const insertedLargeGrants = await db
    .insert(largeGrants)
    .values([
      {
        title: "Large Grant 1",
        description: "Description for grant 1",
        builderAddress: "0x55b9CB0bCf56057010b9c471e7D42d60e1111EEa",
        showcaseVideoUrl: "Video url 1",
        github: "github-account-1",
        twitter: "twitter-account-1",
        telegram: "telegram-account-1",
        email: "email1@email.com",
      },
      {
        title: "Large Grant 2",
        description: "Description for grant 2",
        builderAddress: "0x60583563D5879C2E59973E5718c7DE2147971807",
        showcaseVideoUrl: "Video url 2",
        github: "github-account-2",
        twitter: "twitter-account-2",
        telegram: null,
        email: "email2@email.com",
      },
      {
        title: "Large Grant 3",
        description: "Description for grant 3",
        builderAddress: "0xB4F53bd85c00EF22946d24Ae26BC38Ac64F5E7B1",
        showcaseVideoUrl: null,
        github: "github-account-3",
        twitter: null,
        telegram: "telegram-account-3",
        email: "email3@email.com",
      },
      {
        title: "Large Grant 4",
        description: "Description for grant 4",
        builderAddress: "0xB4F53bd85c00EF22946d24Ae26BC38Ac64F5E7B1",
        showcaseVideoUrl: null,
        github: "github-account-4",
        twitter: null,
        telegram: "telegram-account-4",
        email: "email3@email.com",
      },
    ])
    .returning({ id: largeGrants.id })
    .execute();

  const insertedLargeStages = await db
    .insert(largeStages)
    .values([
      {
        stageNumber: 1,
        grantId: insertedLargeGrants[0].id,
        status: "completed",
      },
      {
        stageNumber: 2,
        grantId: insertedLargeGrants[0].id,
        status: "approved",
      },
      {
        stageNumber: 1,
        grantId: insertedLargeGrants[1].id,
        status: "completed",
      },
      {
        stageNumber: 2,
        grantId: insertedLargeGrants[1].id,
      },
      {
        stageNumber: 1,
        grantId: insertedLargeGrants[2].id,
        status: "completed",
      },
      {
        stageNumber: 2,
        grantId: insertedLargeGrants[2].id,
        status: "completed",
      },
      {
        stageNumber: 3,
        grantId: insertedLargeGrants[2].id,
      },
      {
        stageNumber: 1,
        grantId: insertedLargeGrants[3].id,
      },
    ])
    .returning({ id: largeStages.id })
    .execute();

  await db
    .insert(largeMilestones)
    .values([
      {
        description: "Milestone 1 - Stage 1 - Large Grant 1",
        milestoneNumber: 1,
        stageId: insertedLargeStages[0].id,
        status: "paid",
        amount: 10,
        proposedDeliverables: "Deliverables 1",
        proposedCompletionDate: new Date("2025-01-01"),
        completedAt: new Date("2025-01-02"),
        completionProof: "Proof 1",
        paymentTx: "0xb7c61529aa31e3703ee9a9c54237cc1693531b95675152671a7cc4bcf92b0fcd",
        paidAt: new Date("2025-01-03"),
      },
      {
        description: "Milestone 2 - Stage 1 - Large Grant 1",
        milestoneNumber: 2,
        stageId: insertedLargeStages[0].id,
        status: "paid",
        amount: 20,
        proposedDeliverables: "Deliverables 2",
        proposedCompletionDate: new Date("2025-02-01"),
        completedAt: new Date("2025-02-01"),
        completionProof: "Proof 2",
        paymentTx: "0xb7c61529aa31e3703ee9a9c54237cc1693531b95675152671a7cc4bcf92b0fcd",
        paidAt: new Date("2025-02-02"),
      },
      {
        description: "Milestone 1 - Stage 2 - Large Grant 1",
        milestoneNumber: 1,
        stageId: insertedLargeStages[1].id,
        status: "paid",
        amount: 100,
        proposedDeliverables: "Deliverables 3",
        proposedCompletionDate: new Date("2025-03-01"),
        completedAt: new Date("2025-02-25"),
        completionProof: "Proof 2b",
        paymentTx: "0xb7c61529aa31e3703ee9a9c54237cc1693531b95675152671a7cc4bcf92b0fcd",
        paidAt: new Date("2025-02-26"),
      },
      {
        description: "Milestone 2 - Stage 2 - Large Grant 1",
        milestoneNumber: 2,
        stageId: insertedLargeStages[1].id,
        status: "approved",
        amount: 100,
        proposedDeliverables: "Deliverables 3b",
        proposedCompletionDate: new Date("2025-03-01"),
      },
      {
        description: "Milestone 3 - Stage 2 - Large Grant 1",
        milestoneNumber: 3,
        stageId: insertedLargeStages[1].id,
        status: "completed",
        amount: 100,
        proposedDeliverables: "Deliverables 3b",
        proposedCompletionDate: new Date("2025-03-01"),
        completedAt: new Date("2025-02-25"),
        completionProof: "Proof 2c",
      },
      {
        description: "Milestone 1 - Stage 1 - Large Grant 2",
        milestoneNumber: 1,
        stageId: insertedLargeStages[2].id,
        status: "completed",
        amount: 10,
        proposedDeliverables: "Deliverables 4",
        proposedCompletionDate: new Date("2025-04-01"),
        completedAt: new Date(),
        completionProof: "Proof 3",
      },
      {
        description: "Milestone 2 - Stage 1 - Large Grant 2",
        milestoneNumber: 2,
        stageId: insertedLargeStages[2].id,
        status: "completed",
        amount: 10,
        proposedDeliverables: "Deliverables 5",
        proposedCompletionDate: new Date("2025-05-01"),
        completedAt: new Date(),
        completionProof: "Proof 4",
      },
      {
        description: "Milestone 1 - Stage 2 - Large Grant 2",
        milestoneNumber: 1,
        stageId: insertedLargeStages[3].id,
        status: "proposed",
        amount: 10,
        proposedDeliverables: "Deliverables 6",
        proposedCompletionDate: new Date("2025-06-01"),
      },
      {
        description: "Milestone 1 - Stage 1 - Large Grant 3",
        milestoneNumber: 1,
        stageId: insertedLargeStages[4].id,
        status: "completed",
        amount: 200,
        proposedDeliverables: "Deliverables 7",
        proposedCompletionDate: new Date("2025-07-01"),
        completedAt: new Date(),
        completionProof: "Proof 7",
      },
      {
        description: "Milestone 1 - Stage 2 - Large Grant 3",
        milestoneNumber: 1,
        stageId: insertedLargeStages[5].id,
        status: "completed",
        amount: 30,
        proposedDeliverables: "Deliverables 8",
        proposedCompletionDate: new Date("2025-08-01"),
        completedAt: new Date(),
        completionProof: "Proof 8",
      },
      {
        description: "Milestone 1 - Stage 3 - Large Grant 3",
        milestoneNumber: 1,
        stageId: insertedLargeStages[6].id,
        status: "proposed",
        amount: 40,
        proposedDeliverables: "Deliverables 9",
        proposedCompletionDate: new Date("2025-09-01"),
      },
      {
        description: "Milestone 1 - Stage 1 - Large Grant 4",
        milestoneNumber: 1,
        stageId: insertedLargeStages[7].id,
        status: "proposed",
        amount: 4000,
        proposedDeliverables: "Deliverables 10",
        proposedCompletionDate: new Date("2025-10-01"),
      },
      {
        description: "Milestone 2 - Stage 1 - Large Grant 4",
        milestoneNumber: 2,
        stageId: insertedLargeStages[7].id,
        status: "proposed",
        amount: 2000,
        proposedDeliverables: "Deliverables 11",
        proposedCompletionDate: new Date("2025-11-01"),
      },
    ])
    .execute();

  console.log("Database seeded successfully");
}

seed()
  .catch(error => {
    console.error("Error seeding database:", error);
  })
  .finally(async () => {
    await pool.end();
    process.exit();
  });
