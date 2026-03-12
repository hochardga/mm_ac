CREATE TABLE "report_drafts" (
	"id" text PRIMARY KEY NOT NULL,
	"player_case_id" text NOT NULL,
	"suspect_id" text NOT NULL,
	"motive_id" text NOT NULL,
	"method_id" text NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "report_drafts_player_case_id_unique" UNIQUE("player_case_id")
);
--> statement-breakpoint
ALTER TABLE "report_drafts" ADD CONSTRAINT "report_drafts_player_case_id_player_cases_id_fk" FOREIGN KEY ("player_case_id") REFERENCES "public"."player_cases"("id") ON DELETE cascade ON UPDATE no action;