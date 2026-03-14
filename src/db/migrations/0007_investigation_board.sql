CREATE TABLE "player_case_evidence_bookmarks" (
	"id" text PRIMARY KEY NOT NULL,
	"player_case_id" text NOT NULL,
	"evidence_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "player_case_evidence_bookmarks_player_case_id_evidence_id_unique" UNIQUE("player_case_id","evidence_id")
);
--> statement-breakpoint
ALTER TABLE "player_case_evidence_bookmarks" ADD CONSTRAINT "player_case_evidence_bookmarks_player_case_id_player_cases_id_fk" FOREIGN KEY ("player_case_id") REFERENCES "public"."player_cases"("id") ON DELETE cascade ON UPDATE no action;