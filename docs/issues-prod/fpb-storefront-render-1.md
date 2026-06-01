# Issue: FPB storefront render fails after SIT deploy
**Issue ID:** fpb-storefront-render-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-06-02
**Last Updated:** 2026-06-02 01:10

## Overview
FPB storefront page has the bundle marker and app-proxy endpoints return 200, but the visible full-page bundle UI does not render after SIT deploy. Network inspection shows the app embed block may not request the FPB widget script on fresh load.

## Progress Log
### 2026-06-02 01:10 - Started network-grounded storefront fix
- Inspected SIT storefront network for FPB preview page.
- Found page document 200, app-proxy bundle config 200 on prior load, and FPB marker present in DOM.
- Fresh reload showed app embed block only setting embed-active global, with no FPB widget script requested.
- Next: align app embed storefront script loading with EB-style runtime marker behavior and rebuild widget assets if required.

## Related Documentation
- internal docs/EB Implementation Reference.md
- docs/competitor-analysis/16-eb-full-data-flow-investigation.md

## Phases Checklist
- [ ] Inspect FPB storefront asset/config network behavior
- [ ] Patch app embed/widget loading path
- [ ] Rebuild required extension assets
- [ ] Smoke verify on SIT storefront

### 2026-06-02 01:13 - Patched FPB marker hydration in app embed
- Updated the single app embed to scan for `[data-wpb-full-page-bundle][data-bundle-id]` markers.
- The embed now creates the `#bundle-builder-app` full-page widget container and loads FPB CSS/JS assets when a marker is present.
- This follows EB's storefront practice of loading the full-page renderer from the bundle page context, while preserving Wolfpack's proxy/metafield config transport.
- Next: deploy the theme app extension and smoke the storefront network tab for FPB asset/config/render behavior.
