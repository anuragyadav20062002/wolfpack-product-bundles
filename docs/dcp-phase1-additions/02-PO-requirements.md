# Product Owner Requirements: DCP Phase 1 Additions

## New DCP Sections & Fields

### Section A: Search Input (full-page widget)
New panel "Search Input" under Product Card group.
| Field | Type | Default (product-page) | Default (full-page) |
|-------|------|----------------------|---------------------|
| searchInputBgColor | string | #F8F8F8 | #F8F8F8 |
| searchInputBorderColor | string | #E0E0E0 | #E0E0E0 |
| searchInputFocusBorderColor | string | #5C6AC4 | #7132FF |
| searchInputTextColor | string | #333333 | #333333 |
| searchInputPlaceholderColor | string | #999999 | #999999 |
| searchClearButtonBgColor | string | rgba(0,0,0,0.08) | rgba(0,0,0,0.08) |
| searchClearButtonColor | string | #666666 | #666666 |

### Section B: Skeleton Loading
New panel "Skeleton Loading" under Product Card group.
| Field | Type | Default |
|-------|------|---------|
| skeletonBaseBgColor | string | #F0F0F0 |
| skeletonShimmerColor | string | #E8E8E8 |
| skeletonHighlightColor | string | #FFFFFF |

### Section C: Card Hover & Transitions
Extend existing Product Card panel with "Hover & Animation" subsection.
| Field | Type | Default |
|-------|------|---------|
| productCardHoverTranslateY | number | 2 (px) |
| productCardTransitionDuration | number | 200 (ms) |

### Section D: Tile Quantity Badge
New panel "Quantity Badge" under Bundle Footer group.
| Field | Type | Default (product-page) | Default (full-page) |
|-------|------|----------------------|---------------------|
| tileQuantityBadgeBgColor | string | #000000 | #7132FF |
| tileQuantityBadgeTextColor | string | #FFFFFF | #FFFFFF |

### Section E: Modal Close Button
Extend existing Modal panel with "Close Button" subsection.
| Field | Type | Default |
|-------|------|---------|
| modalCloseButtonColor | string | #777777 |
| modalCloseButtonBgColor | string | rgba(255,255,255,0.9) |
| modalCloseButtonHoverColor | string | #333333 |

### Section F: Loading Overlay
New panel "Loading State" under General group.
| Field | Type | Default |
|-------|------|---------|
| loadingOverlayBgColor | string | #E3F2FD |
| loadingOverlayTextColor | string | #1976D2 |

### Section G: Typography
New panel "Typography" at top level.
| Field | Type | Options | Default |
|-------|------|---------|---------|
| buttonTextTransform | string | none, uppercase, capitalize | none |
| buttonLetterSpacing | number | 0–10 (tenths of em) | 0 |

### Section H: Progress Bar Shape
Extend Footer Discount & Progress panel.
| Field | Type | Default |
|-------|------|---------|
| progressBarHeight | number | 4 (px, range 2–12) |
| progressBarBorderRadius | number | 2 (px, range 0–12) |

### Section I: Focus / Accessibility
New panel "Accessibility" under General group.
| Field | Type | Default |
|-------|------|---------|
| focusOutlineColor | string | #5C6AC4 |
| focusOutlineWidth | number | 2 (px) |

## Acceptance Criteria
- [ ] Each new field appears in the DCP sidebar with correct label, picker/slider, and default value
- [ ] Changing a field saves to DB and immediately updates the preview
- [ ] DCP loads existing merchants with no visual regression (NULL in DB → code default used)
- [ ] Widget CSS uses CSS variables that resolve to the newly set values
- [ ] Widget rebuilt — storefront reflects changes after deploy
- [ ] Zero ESLint errors

## Backward Compatibility
All new Prisma fields are nullable with @default — existing records have NULL and code falls back to the same hardcoded value that was there before, so no merchant sees a change until they explicitly edit the setting.
