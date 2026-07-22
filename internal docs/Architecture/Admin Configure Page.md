---
schema_version: 1
id: admin-configure-page
title: Admin Configure Page
type: architecture
status: authoritative
summary: Defines the shared FPB and PPB configure-page boundary and direct create, clone, edit, and save flows.
last_audited: 2026-07-23
owners:
  - engineering
domains:
  - admin
systems:
  - bundle-configure
source_paths:
  - app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/
  - app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/
  - app/routes/app/_shared/bundle-configure/
related_docs:
  - docs/app-nav-map/APP_NAVIGATION_MAP.md
tags:
  - architecture
  - configure
keywords:
  - fpb
  - ppb
---

# Admin Configure Page

The FPB configure page is the canonical Admin configure design. FPB and PPB keep separate route URLs, loaders, actions, save handlers, and storefront sync contracts, but shared visual primitives live under `app/routes/app/_shared/bundle-configure/`.

The only bundle configuration routes are the type-specific FPB and PPB configure pages. Bundle creation, cloning, and editing navigate directly to the appropriate configure route. The retired `/app/bundles/create/configure/:bundleId` configuration wizard and its route-specific state, actions, preview helper, and modal controllers are not part of the supported architecture.

Shared configure primitives should accept adapter props for route-owned state and actions. FPB continues to use `useConfigureBundleFlow()`, and PPB continues to use `usePpbConfigureFlow()`. Shared components must not read route loaders or submit forms directly.

Step Setup uses the same section rhythm for both bundle types:

1. Step Flow
2. Step Setup
3. Category
4. Rules Configuration
5. Step Config

PPB-only controls are explicit slots inside the shared rhythm. Category-level variant display controls update PPB `StepCategory.displayVariantsAsIndividualProducts` and `StepCategory.displayVariantsAsSwatches` fields; they are not step-wide FPB controls. Bundle Settings follows the same rule: shared rows cover overlapping settings, while FPB-only Product Slots / Slot Icon and PPB-only Variant Selector, discount display, banner, CSS, subscriptions, Bundle Embed, and Place Widget controls remain route-owned slots.

SaveBar semantics remain route-owned. Shared configure UI should mark drafts dirty through the adapter but must not introduce autosave, wrap the canvas in a broad form, or make Enter keypresses submit the configure page.
