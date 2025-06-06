CREATE TABLE IF NOT EXISTS "reject_votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"voted_at" timestamp DEFAULT now(),
	"stage_id" integer NOT NULL,
	"author_address" varchar(42) NOT NULL,
	CONSTRAINT "reject_votes_stage_id_author_address_unique" UNIQUE("stage_id","author_address")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reject_votes" ADD CONSTRAINT "reject_votes_stage_id_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."stages"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reject_votes" ADD CONSTRAINT "reject_votes_author_address_users_address_fk" FOREIGN KEY ("author_address") REFERENCES "public"."users"("address") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
