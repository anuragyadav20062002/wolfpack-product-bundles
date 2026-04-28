# Issue: App Embed Banner + Readiness Score Integration

**Issue ID:** app-embed-banner-1
**Status:** In Progress
**Priority:** 🟡 Medium
**Created:** 2026-04-26
**Last Updated:** 2026-04-26 00:00

## Overview

Show a persistent amber warning banner on every bundle configure page (FPB + PPB) when the Wolfpack theme app extension is NOT enabled in the merchant's active theme. Add a 6th step to the SetupScoreCard on the dashboard for this. Competitor (EB) has this as a core onboarding feature.

## Related Documentation

- `docs/app-embed-banner/01-requirements.md`
- `docs/app-embed-banner/02-architecture.md`
- `docs/competitor-analysis/14-eb-addon-upsell-analysis.md` §1 and §2

## Phases Checklist

- [ ] Phase 1 — TOML: Register embed blocks in `shopify.extension.toml`
- [ ] Phase 2 — Service: Create `app/services/theme/app-embed-check.server.ts`
- [ ] Phase 3 — Tests: Unit tests for embed check service
- [ ] Phase 4 — Component: Create `app/components/AppEmbedBanner.tsx`
- [ ] Phase 5 — SetupScoreCard: Add `appEmbedEnabled` step
- [ ] Phase 6 — Dashboard loader: Wire embed check into setupScore
- [ ] Phase 7 — FPB configure route: Add banner (loader + JSX)
- [ ] Phase 8 — PPB configure route: Add banner (loader + JSX)
- [ ] Phase 9 — Deploy:SIT (manual)

## Progress Log

### 2026-04-26 00:00 - Architecture Complete
- Stage 1 requirements doc written: `docs/app-embed-banner/01-requirements.md`
- Stage 2 architecture doc written: `docs/app-embed-banner/02-architecture.md`
- Issue file created
- Next: Phase 1 — TOML registration
