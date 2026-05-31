# Issue: Dashboard App Embeds Card Title Copy Update
**Issue ID:** dashboard-app-embeds-copy-1
**Status:** Completed
**Priority:** 🟢 Low
**Created:** 2026-06-01
**Last Updated:** 2026-06-01 00:00

## Overview
Update the App Embeds card heading on the dashboard to include "(Turn ON to make bundle visible on store)" — text inside brackets should be light yellow highlighted and lighter font weight. Update locale file accordingly.

## Progress Log
### 2026-06-01 00:00 - Implementation
- Split `dashboard.appEmbeds.heading` locale key into `headingMain` + `headingHint` in `en.json`
- Added `.appEmbedHeadingHint` CSS class (light yellow `#fef9c3` bg, `font-weight: 400`) in `dashboard.module.css`
- Updated `route.tsx` heading to render `headingMain` + `<span className={appEmbedHeadingHint}>headingHint</span>`
- Linted — no new errors

## Related Documentation
N/A

## Phases Checklist
- [ ] Update locale en.json
- [ ] Add CSS class for hint text
- [ ] Update route.tsx heading render
- [ ] Commit
