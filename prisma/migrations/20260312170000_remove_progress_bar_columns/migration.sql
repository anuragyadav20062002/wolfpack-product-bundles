-- AlterTable: Remove progress bar shape columns from DesignSettings.
-- These settings are no longer exposed in the DCP (no progress bar in the widget).
-- IF EXISTS guards make this safe to run on any DB state.

ALTER TABLE "DesignSettings"
  DROP COLUMN IF EXISTS "progressBarHeight",
  DROP COLUMN IF EXISTS "progressBarBorderRadius";
