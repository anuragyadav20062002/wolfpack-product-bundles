---
title: LCP and CLS Playbook
type: operations
last_audited: 2026-06-27
---

# LCP and CLS Playbook

## Why this exists

This is a Wolfpack-specific adaptation of internal LCP/CLS notes used as a reference by other projects. It is directional, not a copy-paste spec.

## Targets

- Keep Admin app flows under LCP 2.5s on p75 for key routes.
- Keep CLS below 0.1.

## Guardrails (must not break behavior)

- Do not remove routes, auth gates, or API contracts without explicit behavior proof.
- Do not remove files blindly from dead-code output.
- Do not introduce third-party preloads without confirmed route-level value.
- Do not change user-visible copy or behavior.

## Process

### LCP baseline and ownership

- Start with existing route-level Web Vitals baselines before any payload or UI change.
- Use `internal docs/Operations/Admin Performance.md` as the current measurement baseline and source reference for LCP candidate capture.

### 1. Make homepage/bootstrap data minimal

- Use one explicit loader contract for homepage bootstrap data.
- Return only what is needed for first paint:
  - ids, titles, status flags, counts, and simple scalar values.
- Avoid loading bulky product/collection payload for table/list rows at first paint.
- Fetch full nested objects only when the user opens a row/action path.

### 2. Avoid redundant fetches

- Keep homepage bootstrap data server-side so the page can render on server-driven data.
- Avoid extra preflight/fallback calls that do not add new value for the first route render.
- On onboarding / pricing-like screens, reuse bootstrap data when fields exist.
- Add a dedicated API only when a field is genuinely missing and not available from existing bootstrap payload.

### 2a. Route reuse guardrails (deeper code-path pass, 2026-06-27)

- Reuse parent/ancestor loader data for child screens where auth and shop context already exist.
- For `app.onboarding`:
  - remove dedicated server loader that only returned `shop`, `apiKey`, and block handle.
  - read the parent `app` loader payload (`routes/app/app`) directly.
- For `app.pricing`:
  - avoid a fresh subscription call when cached homepage subscription data exists.
  - check `getCachedSubscriptionInfo(shopDomain)` from an in-process cache first.
  - fall back to one shared fetch path only when cache miss (`getSubscriptionInfoFromCache`).
- For shared billing guard/paths:
  - `app.billing`, `app.bundles.create`, `api.billing.status`, and `subscription-guard.server`
    use the same cache-first subscription helper so duplicate `BillingService.getSubscriptionInfo`
    calls are de-duplicated within a short TTL window.
- Keep both screens behavior-identical for normal navigation while reducing redundant load on route transitions.

### 3. Stabilize CLS

- Use loading placeholders that preserve final card/section geometry.
- Do not replace large layout groups in the same view in the first few render ticks.
- Defer branch-dependent UI flips (onboarding/pricing gating) until all required state is known.

### 4. Asset discipline

- Keep image surfaces on homepage-style paths on approved optimized formats (prefer WebP where app format contracts allow).
- Avoid adding GIFs to critical app screens.
- Reuse existing optimized image URLs/assets instead of generating duplicates unless necessary.

### 5. Safe dead-code cleanup with Knip

- Use Knip as a signal, not an authority:
  - `npm run knip`
  - `npm run knip --reporter json` for machine-readable triage.
- Review every removal candidate against:
  - runtime entry points (`server.js`, route loaders/actions, extensions),
  - scripts (`scripts/*`),
  - config files (`*.toml`, build tooling, tests),
  - and runtime asset paths.
- If removal is uncertain, keep the file and schedule follow-up verification.

## What to avoid (important)

- Do not add dynamic imports as a default optimization move.
- Do not delete build/tooling files (like image pipelines, script registries, route entry files) based only on static suggestions.
- Do not perform broad payload refactors without route-by-route verification.

## Working order

1. Establish baseline.
2. Reduce homepage payload scope.
3. Remove only proven redundant calls.
4. Apply loader/skeleton stabilization.
5. Run Knip and plan only low-risk removals with tests or direct route checks.
6. Re-measure and document regression/perf change.

## References

- [[Operations/Admin Performance]]
- [[Operations/Build Process]]
