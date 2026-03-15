ALTER TABLE "player_cases" ADD COLUMN "viewed_evidence_ids" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
UPDATE "player_cases"
SET "viewed_evidence_ids" = CASE
  WHEN "last_viewed_evidence_id" IS NOT NULL THEN (
    SELECT COALESCE(
      jsonb_agg(deduped.evidence_id ORDER BY deduped.first_seen),
      '[]'::jsonb
    )
    FROM (
      SELECT seen.evidence_id, MIN(seen.ordinality) AS first_seen
      FROM jsonb_array_elements_text(
        COALESCE("player_cases"."viewed_evidence_ids", '[]'::jsonb) || jsonb_build_array("player_cases"."last_viewed_evidence_id")
      ) WITH ORDINALITY AS seen(evidence_id, ordinality)
      GROUP BY seen.evidence_id
    ) AS deduped
  )
  ELSE "player_cases"."viewed_evidence_ids"
END;
