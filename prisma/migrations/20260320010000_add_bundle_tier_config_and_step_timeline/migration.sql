-- Migration: add_bundle_tier_config_and_step_timeline
-- Applied to SIT via prisma db push; this migration backfills PROD.
-- IF NOT EXISTS guards make it safe to re-run.

ALTER TABLE "Bundle"
  ADD COLUMN IF NOT EXISTS "tierConfig"       JSONB,
  ADD COLUMN IF NOT EXISTS "showStepTimeline" BOOLEAN;
