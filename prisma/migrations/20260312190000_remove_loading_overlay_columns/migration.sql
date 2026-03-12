-- Remove loading overlay color columns from DesignSettings.
-- These were controlled by DCP "Loading State" panel which has been removed.
-- The overlay is now handled by the bundle configuration's custom loading GIF.
ALTER TABLE "DesignSettings"
  DROP COLUMN IF EXISTS "loadingOverlayBgColor",
  DROP COLUMN IF EXISTS "loadingOverlayTextColor";
