DO $$ BEGIN
 CREATE TYPE "public"."milestones_status" AS ENUM('proposed', 'approved', 'completed', 'verified', 'paid', 'rejected');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "large_approval_votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"voted_at" timestamp DEFAULT now(),
	"stage_id" integer NOT NULL,
	"author_address" varchar(42) NOT NULL,
	CONSTRAINT "large_approval_votes_stage_id_author_address_unique" UNIQUE("stage_id","author_address")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "large_grants" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar NOT NULL,
	"description" text NOT NULL,
	"showcaseVideoUrl" text,
	"github" text NOT NULL,
	"email" text NOT NULL,
	"twitter" text,
	"telegram" text,
	"submited_at" timestamp DEFAULT now(),
	"builder_address" varchar(42) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "large_milestone_private_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"note" text NOT NULL,
	"written_at" timestamp DEFAULT now(),
	"milestone_id" integer NOT NULL,
	"author_address" varchar(42) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "large_milestones" (
	"id" serial PRIMARY KEY NOT NULL,
	"milestone_number" integer DEFAULT 1 NOT NULL,
	"stage_id" integer NOT NULL,
	"description" text NOT NULL,
	"proposed_deliverables" text NOT NULL,
	"proposed_completion_date" date NOT NULL,
	"completion_proof" text,
	"completed_at" timestamp,
	"amount" integer NOT NULL,
	"status" "milestones_status" DEFAULT 'proposed' NOT NULL,
	"statusNote" text,
	"verified_tx" varchar(66),
	"verified_at" timestamp,
	"verified_by" varchar(42),
	"payment_tx" varchar(66),
	"paid_at" timestamp,
	"paid_by" varchar(42)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "large_private_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"note" text NOT NULL,
	"written_at" timestamp DEFAULT now(),
	"stage_id" integer NOT NULL,
	"author_address" varchar(42) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "large_reject_votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"voted_at" timestamp DEFAULT now(),
	"stage_id" integer NOT NULL,
	"author_address" varchar(42) NOT NULL,
	CONSTRAINT "large_reject_votes_stage_id_author_address_unique" UNIQUE("stage_id","author_address")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "large_stages" (
	"id" serial PRIMARY KEY NOT NULL,
	"stage_number" integer DEFAULT 1 NOT NULL,
	"submited_at" timestamp DEFAULT now(),
	"grant_id" integer NOT NULL,
	"status" "stage_status" DEFAULT 'proposed' NOT NULL,
	"statusNote" text,
	"approved_tx" varchar(66),
	"approved_at" timestamp
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "large_approval_votes" ADD CONSTRAINT "large_approval_votes_stage_id_large_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."large_stages"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "large_approval_votes" ADD CONSTRAINT "large_approval_votes_author_address_users_address_fk" FOREIGN KEY ("author_address") REFERENCES "public"."users"("address") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "large_grants" ADD CONSTRAINT "large_grants_builder_address_users_address_fk" FOREIGN KEY ("builder_address") REFERENCES "public"."users"("address") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "large_milestone_private_notes" ADD CONSTRAINT "large_milestone_private_notes_milestone_id_large_milestones_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "public"."large_milestones"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "large_milestone_private_notes" ADD CONSTRAINT "large_milestone_private_notes_author_address_users_address_fk" FOREIGN KEY ("author_address") REFERENCES "public"."users"("address") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "large_milestones" ADD CONSTRAINT "large_milestones_stage_id_large_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."large_stages"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "large_private_notes" ADD CONSTRAINT "large_private_notes_stage_id_large_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."large_stages"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "large_private_notes" ADD CONSTRAINT "large_private_notes_author_address_users_address_fk" FOREIGN KEY ("author_address") REFERENCES "public"."users"("address") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "large_reject_votes" ADD CONSTRAINT "large_reject_votes_stage_id_large_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."large_stages"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "large_reject_votes" ADD CONSTRAINT "large_reject_votes_author_address_users_address_fk" FOREIGN KEY ("author_address") REFERENCES "public"."users"("address") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "large_stages" ADD CONSTRAINT "large_stages_grant_id_large_grants_id_fk" FOREIGN KEY ("grant_id") REFERENCES "public"."large_grants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
