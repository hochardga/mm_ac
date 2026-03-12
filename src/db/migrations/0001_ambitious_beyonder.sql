CREATE TABLE "analytics_events" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"player_id" text NOT NULL,
	"session_id" text NOT NULL,
	"case_definition_id" text,
	"case_revision" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_player_id_users_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_case_definition_id_case_definitions_id_fk" FOREIGN KEY ("case_definition_id") REFERENCES "public"."case_definitions"("id") ON DELETE cascade ON UPDATE no action;