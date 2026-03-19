-- Migration: Add productTitleVisibility and variantSelector* fields to DesignSettings
-- These fields existed in the TypeScript types and DCP settings panels but were
-- never persisted to the DB (BUG-01 and BUG-02 from DCP bugs audit).

ALTER TABLE "DesignSettings"
  ADD COLUMN IF NOT EXISTS "productTitleVisibility"      BOOLEAN   DEFAULT true,
  ADD COLUMN IF NOT EXISTS "variantSelectorBgColor"      VARCHAR   DEFAULT '#FFFFFF',
  ADD COLUMN IF NOT EXISTS "variantSelectorTextColor"    VARCHAR   DEFAULT '#000000',
  ADD COLUMN IF NOT EXISTS "variantSelectorBorderRadius" INTEGER   DEFAULT 8;
