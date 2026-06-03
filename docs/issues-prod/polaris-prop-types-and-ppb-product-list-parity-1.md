# Issue: Polaris Prop Types and PPB Product List Storefront Parity
**Issue ID:** polaris-prop-types-and-ppb-product-list-parity-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-06-04
**Last Updated:** 2026-06-04 03:10

## Overview
Resolve Polaris web component prop type errors across Admin UI surfaces, then match the PPB Product List storefront template UI to the EB reference.

## Progress Log
### 2026-06-04 02:54 - Start targeted type and storefront parity work
- Reproduced TypeScript failures with `npx tsc --noEmit --pretty false`.
- Confirmed many non-Polaris TypeScript errors already exist; Phase 1 is scoped to `s-*` prop issues only.
- Loaded Shopify Polaris App Home documentation through Shopify MCP for current valid prop shapes.
- Next: fix invalid `s-*` props, validate with a filtered typecheck, then audit and implement PPB Product List storefront parity.

### 2026-06-04 03:10 - Resolve Polaris prop value failures
- Replaced invalid Admin web component prop values and slots, including banner dismissal props, modal control props, text tones, badge tones, button sizing, select options, number field min/max values, and `autocomplete` casing.
- Updated checkout UI extension `s-text` usage to remove unsupported `type="small"` values for the checkout target.
- Validated representative Admin and checkout `s-*` snippets with Shopify MCP component validation.
- Ran `npx tsc --noEmit --pretty false`; remaining failures are non-Polaris project/test type issues and no `s-*` prop failures remain in the compiler output.
- Ran `npx eslint --max-warnings 9999` on the touched application and checkout files; completed with 0 errors and existing warning volume.

## Related Documentation
- `internal docs/EB Implementation Reference.md`
- `docs/competitor-analysis/16-eb-full-data-flow-investigation.md`
- `docs/select-template/eb-ppb-cascade-storefront.png`
- `docs/select-template/wpb-ppb-cascade-storefront.png`

## Phases Checklist
- [x] Phase 1: Resolve Polaris `s-*` prop type errors.
- [ ] Phase 2: Audit EB PPB Product List storefront reference.
- [ ] Phase 3: Implement PPB Product List storefront UI parity.
- [ ] Phase 4: Build/minify modified storefront assets and verify.
