CREATE TABLE IF NOT EXISTS "milestones" (
	"id" serial PRIMARY KEY NOT NULL,
	"milestone_number" integer DEFAULT 1 NOT NULL,
	"stage_id" integer NOT NULL,
	"description" text NOT NULL,
	"proposed_deliverables" text NOT NULL,
	"completion_proof" text,
	"completed_at" timestamp,
	"requested_amount" bigint NOT NULL,
	"granted_amount" bigint,
	"status" "milestones_status" DEFAULT 'proposed' NOT NULL,
	"statusNote" text,
	"payment_tx" varchar(66),
	"paid_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "grants" ALTER COLUMN "milestones" DROP NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "milestones" ADD CONSTRAINT "milestones_stage_id_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."stages"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
