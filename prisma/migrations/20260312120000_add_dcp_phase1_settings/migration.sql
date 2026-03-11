-- AlterTable: Add DCP Phase 1 settings columns to DesignSettings
-- All columns are nullable with defaults so existing rows are unaffected.

ALTER TABLE "DesignSettings"
  -- Search Input
  ADD COLUMN IF NOT EXISTS "searchInputBgColor"          TEXT DEFAULT '#F8F8F8',
  ADD COLUMN IF NOT EXISTS "searchInputBorderColor"      TEXT DEFAULT '#E0E0E0',
  ADD COLUMN IF NOT EXISTS "searchInputFocusBorderColor" TEXT DEFAULT '#5C6AC4',
  ADD COLUMN IF NOT EXISTS "searchInputTextColor"        TEXT DEFAULT '#333333',
  ADD COLUMN IF NOT EXISTS "searchInputPlaceholderColor" TEXT DEFAULT '#999999',
  ADD COLUMN IF NOT EXISTS "searchClearButtonBgColor"    TEXT DEFAULT 'rgba(0,0,0,0.08)',
  ADD COLUMN IF NOT EXISTS "searchClearButtonColor"      TEXT DEFAULT '#666666',

  -- Skeleton Loading
  ADD COLUMN IF NOT EXISTS "skeletonBaseBgColor"         TEXT DEFAULT '#F0F0F0',
  ADD COLUMN IF NOT EXISTS "skeletonShimmerColor"        TEXT DEFAULT '#E8E8E8',
  ADD COLUMN IF NOT EXISTS "skeletonHighlightColor"      TEXT DEFAULT '#FFFFFF',

  -- Card Hover & Transitions
  ADD COLUMN IF NOT EXISTS "productCardHoverTranslateY"    INTEGER DEFAULT 2,
  ADD COLUMN IF NOT EXISTS "productCardTransitionDuration" INTEGER DEFAULT 200,

  -- Tile Quantity Badge
  ADD COLUMN IF NOT EXISTS "tileQuantityBadgeBgColor"    TEXT DEFAULT '#000000',
  ADD COLUMN IF NOT EXISTS "tileQuantityBadgeTextColor"  TEXT DEFAULT '#FFFFFF',

  -- Modal Close Button
  ADD COLUMN IF NOT EXISTS "modalCloseButtonColor"       TEXT DEFAULT '#777777',
  ADD COLUMN IF NOT EXISTS "modalCloseButtonBgColor"     TEXT DEFAULT 'rgba(255,255,255,0.9)',
  ADD COLUMN IF NOT EXISTS "modalCloseButtonHoverColor"  TEXT DEFAULT '#333333',

  -- Loading Overlay
  ADD COLUMN IF NOT EXISTS "loadingOverlayBgColor"       TEXT DEFAULT '#E3F2FD',
  ADD COLUMN IF NOT EXISTS "loadingOverlayTextColor"     TEXT DEFAULT '#1976D2',

  -- Typography
  ADD COLUMN IF NOT EXISTS "buttonTextTransform"         TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS "buttonLetterSpacing"         INTEGER DEFAULT 0,

  -- Progress Bar Shape
  ADD COLUMN IF NOT EXISTS "progressBarHeight"           INTEGER DEFAULT 4,
  ADD COLUMN IF NOT EXISTS "progressBarBorderRadius"     INTEGER DEFAULT 2,

  -- Focus / Accessibility
  ADD COLUMN IF NOT EXISTS "focusOutlineColor"           TEXT DEFAULT '#5C6AC4',
  ADD COLUMN IF NOT EXISTS "focusOutlineWidth"           INTEGER DEFAULT 2;
