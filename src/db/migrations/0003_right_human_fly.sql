CREATE TABLE "report_submissions" (
	"id" text PRIMARY KEY NOT NULL,
	"player_case_id" text NOT NULL,
	"submission_token" text NOT NULL,
	"suspect_id" text NOT NULL,
	"motive_id" text NOT NULL,
	"method_id" text NOT NULL,
	"attempt_number" integer NOT NULL,
	"next_status" text NOT NULL,
	"feedback" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "report_submissions_submission_token_unique" UNIQUE("submission_token")
);
--> statement-breakpoint
ALTER TABLE "player_cases" ADD COLUMN "terminal_debrief_title" text;--> statement-breakpoint
ALTER TABLE "player_cases" ADD COLUMN "terminal_debrief_summary" text;--> statement-breakpoint
ALTER TABLE "report_submissions" ADD CONSTRAINT "report_submissions_player_case_id_player_cases_id_fk" FOREIGN KEY ("player_case_id") REFERENCES "public"."player_cases"("id") ON DELETE cascade ON UPDATE no action;