---
schema_version: 1
id: internal-docs-index
title: Wolfpack Product Bundles Internal Docs
type: index
status: authoritative
summary: Index of durable Wolfpack Product Bundles architecture, integration, feature, and operations documentation.
last_audited: 2026-07-14
owners:
  - engineering
domains:
  - documentation
systems:
  - internal-docs
source_paths:
  - internal docs/
related_docs: []
tags:
  - index
keywords:
  - architecture
  - operations
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
- [[Architecture/Cart Transform Function]] — Rust Shopify Function cart transform and checkout discount contract
- [[Architecture/Widget Architecture]] — FPB + PDP widgets, load strategy, versioning
- [[Architecture/Product Card Layout Contract]] — Hard rule for row-level card size behavior across all templates and interaction states
- [[Architecture/Admin Configure Page]] — shared FPB/PPB Admin configure-page adapter boundary, section rhythm, route-owned save semantics
- [[Architecture/Bundle Parent Product]] — shared neutral FPB/PPB Shopify parent contract, merchant metadata ownership, sync invariants, and host separation
- [[Architecture/FPB Host Evaluation]] — accepted signed app-proxy FPB document host, preview-token contract, and Page retirement sequence
- [[Architecture/State Management]] — Redux Toolkit slices, RTK Query endpoint boundaries, and AppStateService migration rules
- [[Architecture/Diagrams/index|Architecture Diagram Catalog]] — indexed Mermaid diagrams for Cart Transform, metafield ownership/consumption, storefront runtime, backend layers, and embedded Admin UI
- [[Shopify Integration/Admin API]] — Rate limits, GraphQL patterns, session handling
- [[Shopify Integration/Storefront API]] — Storefront GraphQL field gotchas, including product description HTML handling
- [[Shopify Integration/Cart Transform API]] — Operations, targets, API versions (2025-10)
- [[Shopify Integration/Checkout UI Extension]] — Preact targets, build rules
- [[Shopify Integration/Metafields]] — Bundle config metafield sync strategy
- [[Shopify Integration/Theme App Extensions]] — Theme app extension handles, app embed detection, and MAIN-theme status rules
- [[Shopify Integration/Web Pixels]] — UTM Web Pixel settings payload rules, including nonblank custom-parameter sentinel behavior
- [[Shopify Integration/Webhooks]] — Subscribed webhook topics, removed broad topics, and delivery-volume rationale
- [[Features/Bundle Types]] — FPB vs PDP, layout modes, step config
- [[Features/Pricing Pipeline]] — UI → DB → Metafield → Cart Transform units
- [[Features/Bundle Instance Tracking]] — EB `_wolfpackProductBundle:OfferId`, MERGE dedup, unique titles
- [[Operations/Deployment]] — Render + Shopify deploy process
- [[Operations/Deployment Backfill]] — guarded deploy-time DB-to-Shopify resync script and approval rules
- [[Operations/Development]] — SIT Shopify dev command and direct configure sync flow
- [[Operations/Build Process]] — Widget bundles, WASM, CSS size limits
- [[Operations/App Events Taxonomy]] — Shopify App Events taxonomy, flow tracing, feature usage, error events, and `wpb:*` migration boundaries
- [[Operations/Mantle Integration]] — Admin Mantle provider bootstrap, required env vars, and the `MANTLE_API_KEY` vs Shopify client id gotcha
- [[Operations/Admin Performance]] — App Bridge Web Vitals source, retired custom telemetry, Admin loader critical path
- [[Operations/LCP and CLS Playbook]] — Home bootstrap strategy, CLS stabilization order, and Knip-guided dead-code cleanup
- [[Operations/Knip Prune Guardrails]] — known Knip false positives, convention-loaded runtime assets, and required skip rules for future dead-code pruning
- [[Operations/Knip Candidate Inventory]] — exhaustive current Knip candidate list from the 2026-07-13 report; use with the guardrails before pruning
- [[Operations/Storefront Parity Placement Board]] — Chrome DevTools MCP placement-board method for EB/WPB storefront responsiveness proof across narrow, column, mobile, and wide widget contexts
