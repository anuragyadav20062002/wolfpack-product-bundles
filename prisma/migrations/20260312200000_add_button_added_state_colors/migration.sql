-- Add selected-state button colour columns to DesignSettings
-- Default values match the previous hardcoded CSS values for backward compatibility

ALTER TABLE "DesignSettings"
  ADD COLUMN IF NOT EXISTS "buttonAddedBgColor"   TEXT DEFAULT '#10B981',
  ADD COLUMN IF NOT EXISTS "buttonAddedTextColor"  TEXT DEFAULT '#FFFFFF';
