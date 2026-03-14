CREATE TABLE "objective_submissions" (
	"id" text PRIMARY KEY NOT NULL,
	"player_case_id" text NOT NULL,
	"objective_id" text NOT NULL,
	"submission_token" text NOT NULL,
	"answer_payload" jsonb NOT NULL,
	"is_correct" boolean NOT NULL,
	"feedback" text NOT NULL,
	"next_status" text NOT NULL,
	"attempt_number" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "objective_submissions_submission_token_unique" UNIQUE("submission_token"),
	CONSTRAINT "objective_submissions_player_case_id_objective_id_attempt_number_unique" UNIQUE("player_case_id","objective_id","attempt_number")
);
--> statement-breakpoint
CREATE TABLE "player_case_objectives" (
	"id" text PRIMARY KEY NOT NULL,
	"player_case_id" text NOT NULL,
	"stage_id" text NOT NULL,
	"objective_id" text NOT NULL,
	"status" text NOT NULL,
	"draft_payload" jsonb,
	"solved_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "player_case_objectives_player_case_id_objective_id_unique" UNIQUE("player_case_id","objective_id")
);
--> statement-breakpoint
ALTER TABLE "player_cases" ADD COLUMN "graded_failure_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "objective_submissions" ADD CONSTRAINT "objective_submissions_player_case_id_player_cases_id_fk" FOREIGN KEY ("player_case_id") REFERENCES "public"."player_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_case_objectives" ADD CONSTRAINT "player_case_objectives_player_case_id_player_cases_id_fk" FOREIGN KEY ("player_case_id") REFERENCES "public"."player_cases"("id") ON DELETE cascade ON UPDATE no action;
