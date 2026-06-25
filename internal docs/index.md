---
title: Wolfpack Product Bundles — Internal Docs
type: index
last_audited: 2026-04-16
---

# Wolfpack Product Bundles — Internal Docs

This vault contains audited, authoritative documentation for the Wolfpack Product Bundles app. All files have been cross-referenced against the actual codebase, Prisma schema, extension TOMLs, and the Shopify Dev MCP before writing.

> **Not for version control.** This vault is gitignored. It is a living reference for Claude Code and the development team.

---

## EB Implementation Reference

> **Start here for any EB porting question.** Grounded truth for admin API shapes, data contracts, template IDs, storefront runtime globals, cart add payloads, box selection enforcement, and Wolfpack DB/DTO targets — all captured live from `yash-wolfpack.myshopify.com`.

- [[EB Implementation Reference]] — Admin endpoints, FPB/PPB step-category payloads, Discount & Pricing contracts, Bundle Visibility widget/embed help references, template ID enums, cart integration, box selection, text config, mixAndMatchBundleSettings schema, Wolfpack DB alignment
- [[EB Settings Design Reference]] — Settings -> Design pageCustomization save contract, control-to-field mappings, FPB/PPB storefront propagation, stylePresets, and PPB CSS variables
- [[EB Settings Language Reference]] — Settings -> Language save/read contract, field roots, FPB/PPB storefront globals, and active-locale runtime mappings
- [[EB Integrations Reference]] — Integrations page UI contract, live quick setup link findings, and WPB supportability notes for Stoq, Zapiet, subscriptions, Judge.me, page builders, and checkout apps
- [[EB Free Gift Add Ons Behavior Spec]] — FPB Free Gift & Add Ons Admin controls, personalization/add-on tier data contract, storefront eligibility messaging, scenario matrix, and replication requirements
- [[EB Edit Settings Gap Audit 2026-06-04]] — live edit-page and Settings-page pass covering visibility modal, create tour signal, Settings Design/Language/Controls UI, and Controls runtime wiring gaps

Full evidence record: `docs/competitor-analysis/16-eb-full-data-flow-investigation.md`

---

## Vault Structure

- [[Audit Report]] — What was stale or incorrect in the original `docs/` folder
- [[Architecture/System Overview]] — App stack, services, deployment
- [[Architecture/Database Schema]] — Authoritative Prisma schema summary
- [[Architecture/Cart Transform Function]] — TypeScript WASM cart transform (corrected)
- [[Architecture/Widget Architecture]] — FPB + PDP widgets, load strategy, versioning
- [[Architecture/State Management]] — Redux Toolkit slices, RTK Query endpoint boundaries, and AppStateService migration rules
- [[Shopify Integration/Admin API]] — Rate limits, GraphQL patterns, session handling
- [[Shopify Integration/Cart Transform API]] — Operations, targets, API versions (2025-10)
- [[Shopify Integration/Checkout UI Extension]] — Preact targets, build rules
- [[Shopify Integration/Metafields]] — Bundle config metafield sync strategy
- [[Features/Bundle Types]] — FPB vs PDP, layout modes, step config
- [[Features/Pricing Pipeline]] — UI → DB → Metafield → Cart Transform units
- [[Features/Bundle Instance Tracking]] — EB `_easyBundle:OfferId`, MERGE dedup, unique titles
- [[Operations/Deployment]] — Render + Shopify deploy process
- [[Operations/Build Process]] — Widget bundles, WASM, CSS size limits
- [[Operations/App Events Taxonomy]] — Shopify App Events taxonomy, flow tracing, feature usage, error events, and `wpb:*` migration boundaries
- [[Operations/Admin Performance]] — App Bridge Web Vitals source, retired custom telemetry, Admin loader critical path
