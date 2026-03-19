-- Migration: add_designsettings_missing_columns
-- Applied to SIT via prisma db push; this migration backfills PROD.
-- All statements use IF NOT EXISTS — safe if columns already exist.

ALTER TABLE "DesignSettings"

  -- Button added/selected state
  ADD COLUMN IF NOT EXISTS "buttonAddedBgColor"            TEXT             DEFAULT '#10B981',
  ADD COLUMN IF NOT EXISTS "buttonAddedTextColor"          TEXT             DEFAULT '#FFFFFF',

  -- Search Input Styling
  ADD COLUMN IF NOT EXISTS "searchInputBgColor"            TEXT             DEFAULT '#F8F8F8',
  ADD COLUMN IF NOT EXISTS "searchInputBorderColor"        TEXT             DEFAULT '#E0E0E0',
  ADD COLUMN IF NOT EXISTS "searchInputFocusBorderColor"   TEXT             DEFAULT '#5C6AC4',
  ADD COLUMN IF NOT EXISTS "searchInputTextColor"          TEXT             DEFAULT '#333333',
  ADD COLUMN IF NOT EXISTS "searchInputPlaceholderColor"   TEXT             DEFAULT '#999999',
  ADD COLUMN IF NOT EXISTS "searchClearButtonBgColor"      TEXT             DEFAULT 'rgba(0,0,0,0.08)',
  ADD COLUMN IF NOT EXISTS "searchClearButtonColor"        TEXT             DEFAULT '#666666',

  -- Skeleton Loading
  ADD COLUMN IF NOT EXISTS "skeletonBaseBgColor"           TEXT             DEFAULT '#F0F0F0',
  ADD COLUMN IF NOT EXISTS "skeletonShimmerColor"          TEXT             DEFAULT '#E8E8E8',
  ADD COLUMN IF NOT EXISTS "skeletonHighlightColor"        TEXT             DEFAULT '#FFFFFF',

  -- Card Hover & Transitions
  ADD COLUMN IF NOT EXISTS "productCardHoverTranslateY"    INTEGER          DEFAULT 2,
  ADD COLUMN IF NOT EXISTS "productCardTransitionDuration" INTEGER          DEFAULT 200,

  -- Tile Quantity Badge
  ADD COLUMN IF NOT EXISTS "tileQuantityBadgeBgColor"      TEXT             DEFAULT '#000000',
  ADD COLUMN IF NOT EXISTS "tileQuantityBadgeTextColor"    TEXT             DEFAULT '#FFFFFF',

  -- Modal Close Button
  ADD COLUMN IF NOT EXISTS "modalCloseButtonColor"         TEXT             DEFAULT '#777777',
  ADD COLUMN IF NOT EXISTS "modalCloseButtonBgColor"       TEXT             DEFAULT 'rgba(255,255,255,0.9)',
  ADD COLUMN IF NOT EXISTS "modalCloseButtonHoverColor"    TEXT             DEFAULT '#333333',

  -- Typography
  ADD COLUMN IF NOT EXISTS "buttonTextTransform"           TEXT             DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS "buttonLetterSpacing"           INTEGER          DEFAULT 0,

  -- Focus / Accessibility
  ADD COLUMN IF NOT EXISTS "focusOutlineColor"             TEXT             DEFAULT '#5C6AC4',
  ADD COLUMN IF NOT EXISTS "focusOutlineWidth"             INTEGER          DEFAULT 2,

  -- Toast Notifications (extended)
  ADD COLUMN IF NOT EXISTS "toastBorderRadius"             INTEGER          DEFAULT 8,
  ADD COLUMN IF NOT EXISTS "toastBorderColor"              TEXT             DEFAULT '#FFFFFF',
  ADD COLUMN IF NOT EXISTS "toastBorderWidth"              INTEGER          DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "toastFontSize"                 INTEGER          DEFAULT 13,
  ADD COLUMN IF NOT EXISTS "toastFontWeight"               INTEGER          DEFAULT 500,
  ADD COLUMN IF NOT EXISTS "toastAnimationDuration"        INTEGER          DEFAULT 300,
  ADD COLUMN IF NOT EXISTS "toastBoxShadow"                TEXT             DEFAULT '0 4px 12px rgba(0, 0, 0, 0.15)',
  ADD COLUMN IF NOT EXISTS "toastEnterFromBottom"          BOOLEAN NOT NULL DEFAULT false,

  -- Pricing Tier Pills
  ADD COLUMN IF NOT EXISTS "tierPillActiveBgColor"         TEXT             DEFAULT '#111111',
  ADD COLUMN IF NOT EXISTS "tierPillActiveTextColor"       TEXT             DEFAULT '#FFFFFF',
  ADD COLUMN IF NOT EXISTS "tierPillInactiveBgColor"       TEXT             DEFAULT '#F2FAE6',
  ADD COLUMN IF NOT EXISTS "tierPillInactiveTextColor"     TEXT             DEFAULT '#333333',
  ADD COLUMN IF NOT EXISTS "tierPillHoverBgColor"          TEXT             DEFAULT '#DCF5D2',
  ADD COLUMN IF NOT EXISTS "tierPillBorderColor"           TEXT             DEFAULT '#000000',
  ADD COLUMN IF NOT EXISTS "tierPillBorderRadius"          INTEGER          DEFAULT 8,
  ADD COLUMN IF NOT EXISTS "tierPillHeight"                INTEGER          DEFAULT 52,
  ADD COLUMN IF NOT EXISTS "tierPillGap"                   INTEGER          DEFAULT 12,
  ADD COLUMN IF NOT EXISTS "tierPillFontSize"              INTEGER          DEFAULT 14,
  ADD COLUMN IF NOT EXISTS "tierPillFontWeight"            INTEGER          DEFAULT 600,

  -- Loading Overlay
  ADD COLUMN IF NOT EXISTS "loadingOverlayBgColor"         TEXT             DEFAULT 'rgba(255,255,255,0.85)',
  ADD COLUMN IF NOT EXISTS "loadingOverlayTextColor"       TEXT             DEFAULT '#333333',

  -- Widget Style & Bottom Sheet
  ADD COLUMN IF NOT EXISTS "widgetStyle"                   TEXT             DEFAULT 'classic',
  ADD COLUMN IF NOT EXISTS "bottomSheetOverlayOpacity"     DOUBLE PRECISION DEFAULT 0.5,
  ADD COLUMN IF NOT EXISTS "bottomSheetAnimationDuration"  INTEGER          DEFAULT 400,
  ADD COLUMN IF NOT EXISTS "emptySlotBorderStyle"          TEXT             DEFAULT 'dashed',
  ADD COLUMN IF NOT EXISTS "emptySlotBorderColor"          TEXT             DEFAULT '#007AFF',
  ADD COLUMN IF NOT EXISTS "freeGiftBadgeUrl"              TEXT             DEFAULT '';
