# Issue: Documentation Refactor and Enhancement

**Issue ID:** docs-refactor-and-enhancement-3
**Status:** In Progress
**Priority:** 🟡 Medium
**Created:** 2026-01-14
**Last Updated:** 2026-01-14 15:00

## Overview

Comprehensive documentation cleanup and enhancement to:
1. Archive outdated/completed documentation files
2. Remove duplicate files
3. Create new comprehensive documentation for current features
4. Organize docs for better discoverability

## Progress Log

### 2026-01-14 15:00 - Phase 0: Issue Tracking Setup
- ✅ Created issue file
- ✅ Analyzed current docs directory (93 files)
- ✅ Categorized files into keep/archive/delete
- Next: Phase 1 - Cleanup and archival

## Related Documentation
- `CLAUDE.md` - Issue tracking guidelines
- Current `/docs` directory

## Phases Checklist

### Phase 0: Issue Tracking Setup ✅
- [x] Create issue file
- [x] Analyze current docs
- [x] Categorize files

### Phase 1: Cleanup and Archival (30 min)
- [ ] Create `/docs/archive/2024-2025-migrations/` subdirectory
- [ ] Move 25+ outdated planning/migration docs to archive
- [ ] Delete duplicate files (.md copy files)
- [ ] Organize archive by category
- [ ] Commit cleanup

### Phase 2: Create Core Documentation (2 hours)
- [ ] ARCHITECTURE_OVERVIEW.md - System architecture
- [ ] FEATURE_GUIDE.md - Features and how they work
- [ ] DATABASE_SCHEMA.md - Database models reference
- [ ] API_ENDPOINTS.md - All API routes
- [ ] DEPLOYMENT.md - Deployment procedures
- [ ] Commit core docs

### Phase 3: Create Feature-Specific Docs (1.5 hours)
- [ ] CART_TRANSFORM_FUNCTION.md - Cart transform deep dive
- [ ] DESIGN_CONTROL_PANEL.md - DCP architecture
- [ ] BUNDLE_TYPES.md - Product-page vs full-page
- [ ] FUNCTIONS_REFERENCE.md - Key functions reference
- [ ] SUBSCRIPTION_BILLING.md - Billing system overview
- [ ] Commit feature docs

### Phase 4: Update README and Index (30 min)
- [ ] Update `/docs/README.md` with new structure
- [ ] Create docs navigation guide
- [ ] Add links to all main docs
- [ ] Final commit

## Files to Archive

### Migration/Cleanup Docs (move to archive/2024-2025-migrations/):
- ADMIN_PERFORMANCE_OPTIMIZATION_REPORT.md
- BUNDLE_TYPE_SEPARATION_SUMMARY.md
- COLUMN_REMOVAL_ANALYSIS.md
- LEGACY_METAFIELD_CLEANUP.md
- METAFIELD_DATABASE_MIGRATION_PLAN.md
- MIGRATION_COMPLETE.md
- MIGRATION_REVIEW.md
- READY_TO_REMOVE_SUMMARY.md
- SHOPIFY_METAFIELD_COMPLIANCE_REPORT.md
- UNIFIED_FLOW_COMPLETE_INTEGRATION.md
- UNUSED_COLUMNS_ANALYSIS.md

### Full-Page Planning Docs (move to archive/2024-2025-full-page-planning/):
- FULL_PAGE_BUNDLE_IMPLEMENTATION_PLAN.md
- FULL_PAGE_BUNDLE_UNIFIED_FLOW.md
- FULL_PAGE_BUTTON_REMOVAL.md
- FULL_PAGE_CUSTOMIZATION.md
- FULL_PAGE_DESIGN_GAP_ANALYSIS.md
- FULL_PAGE_IMPLEMENTATION_PLAN_2026.md
- FULL_PAGE_PREVIEW_FIX.md
- FULL_PAGE_WIDGET_DETECTION_FIX.md
- FULL_PAGE_WIDGET_FIXES.md

### Feature Implementation Docs (move to archive/2024-2025-features/):
- GLOBAL_COLORS_MAPPING.md
- LOCALE_TRANSLATIONS_UPDATE.md
- TRANSLATION_IMPLEMENTATION.md
- WIDGET_INSTALLATION_REFACTOR_PLAN.md
- WIDGET_LOADING_UPGRADE.md
- PLACE_WIDGET_MODAL_PAGES_FIX.md

### Operational Docs (move to archive/operational/):
- STAGING_TO_PROD_MERGE_CHECKLIST.md
- PROMPT_ENGINEERING_GUIDE.md
- GITHUB_README.md

### Duplicate Files (delete):
- DCP_IMPLEMENTATION_SUMMARY copy.md
- DCP_TESTING_GUIDE copy.md

## Files to Keep in Root

### Current Active Docs:
- APPLICATION_ARCHITECTURE.md
- TECHNICAL_DOCUMENTATION.md
- DCP_IMPLEMENTATION_SUMMARY.md
- DCP_TESTING_GUIDE.md
- shopify_subscription_billing_guide.md
- shopify_subscription_architecture_guide.md
- deployment_guide_subscription_billing.md
- google_cloud_pubsub_setup.md
- README.md
- issues-prod/ directory

## New Docs to Create

### Phase 2 - Core Documentation:
1. **ARCHITECTURE_OVERVIEW.md** - High-level system architecture
2. **FEATURE_GUIDE.md** - All features and capabilities
3. **DATABASE_SCHEMA.md** - Prisma schema documentation
4. **API_ENDPOINTS.md** - All API routes reference
5. **DEPLOYMENT.md** - Deployment guide

### Phase 3 - Feature-Specific Documentation:
1. **CART_TRANSFORM_FUNCTION.md** - How cart transform works
2. **DESIGN_CONTROL_PANEL.md** - DCP architecture guide
3. **BUNDLE_TYPES.md** - Product-page vs full-page bundles
4. **FUNCTIONS_REFERENCE.md** - Key functions documentation
5. **SUBSCRIPTION_BILLING.md** - Billing system overview

## Estimated Time
- Phase 0: 10 minutes ✅
- Phase 1: 30 minutes (cleanup)
- Phase 2: 2 hours (core docs)
- Phase 3: 1.5 hours (feature docs)
- Phase 4: 30 minutes (index/navigation)
- **Total:** ~4.5 hours

## Success Criteria
- [ ] All outdated docs moved to organized archive
- [ ] No duplicate files
- [ ] 10 new comprehensive docs created
- [ ] README.md updated with navigation
- [ ] Clear documentation structure
- [ ] Easy to find information
