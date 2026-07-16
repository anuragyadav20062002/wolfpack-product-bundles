---
schema_version: 1
id: wpb-admin-ui-frontend
title: Admin UI Frontend Architecture
type: architecture-diagram
status: authoritative
last_audited: 2026-07-14
summary: Embedded Shopify Admin frontend composition, provider hierarchy, Remix data flow, Polaris surface, and route-owned FPB and PPB configure adapters.
owners:
  - Engineering
domains:
  - admin-ui
  - frontend
  - bundle-configuration
systems:
  - Shopify Admin iframe
  - App Bridge
  - Polaris Web Components
  - Remix
  - React
  - Redux Toolkit
  - i18next
operations:
  - server-side loader
  - intent-based action
  - configure draft editing
  - dirty-state tracking
  - save and discard
  - preview and storefront sync
data_entities:
  - loader data
  - route draft state
  - Redux UI state
  - FormData save payload
  - compact configure response
data_classification:
  - authenticated merchant UI
  - merchant bundle configuration
  - client-only UI state
source_paths:
  - app/routes/app/app.tsx
  - app/store/ReduxProvider.tsx
  - app/store/
  - app/routes/app/_shared/bundle-configure/CommonConfigureShell.tsx
  - app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx
  - app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/useConfigureBundleFlow.ts
  - app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx
  - app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/usePpbConfigureFlow.ts
  - app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/PpbConfigureContext.tsx
related_docs:
  - ../Admin Configure Page.md
  - ../State Management.md
  - ../../Shopify Integration/Admin API.md
related_diagrams:
  - Backend Architecture.md
  - Storefront Frontend Architecture.md
graphify:
  communities:
    - App State Context and Providers
    - Bundle Configure Handlers
    - App Routes and Pages
  god_nodes:
    - usePpbConfigureContext
    - requireAdminSession
tags:
  - architecture
  - mermaid
  - admin-ui
  - app-bridge
  - polaris
keywords:
  - CommonConfigureShell
  - useConfigureBundleFlow
  - usePpbConfigureFlow
  - SaveBar
  - ReduxProvider
  - Polaris Web Components
---

# Admin UI Frontend Architecture

```mermaid
flowchart TB
    Admin[Merchant in Shopify Admin]
    Iframe[Cross-origin embedded app iframe]

    subgraph RouteShell[Authenticated Remix app shell]
        RootLoader[App loader: session, locale, API key]
        AppProvider[Shopify AppProvider and App Bridge]
        Redux[ReduxProvider]
        I18n[I18nextProvider]
        Nav[ui-nav-menu]
        Outlet[Remix Outlet]
    end

    subgraph RouteData[Route-owned server boundary]
        Loader[Authenticated route loader]
        Action[Authenticated intent-based route action]
        LoadSources[Prisma bundle plus Shopify Admin reads]
        Handlers[Save, sync, preview, placement, and template handlers]
    end

    subgraph Configure[FPB and PPB configure frontend]
        FpbFlow[FPB useConfigureBundleFlow controller composition]
        PpbFlow[PPB usePpbConfigureFlow plus context provider]
        SharedShell[CommonConfigureShell]
        Header[Route-owned canvas header]
        Sidebar[Route-owned sidebar]
        Sections[Polaris-first configuration sections]
        Overlays[Modals, pickers, and dialogs]
        SaveBar[App Bridge SaveBar]
        Draft[Route draft state and Redux client-only UI state]
    end

    subgraph ServerEffects[Save result]
        Persist[Persist canonical bundle in PostgreSQL]
        Sync[Run synchronous storefront sync]
        Compact[Return compact success or error response]
    end

    Admin --> Iframe
    Iframe --> RootLoader
    RootLoader --> AppProvider
    AppProvider --> Redux
    Redux --> I18n
    I18n --> Nav
    I18n --> Outlet
    Outlet --> Loader
    Loader --> LoadSources
    LoadSources --> FpbFlow
    LoadSources --> PpbFlow
    FpbFlow --> SharedShell
    PpbFlow --> SharedShell
    SharedShell --> SaveBar
    SharedShell --> Header
    SharedShell --> Sidebar
    SharedShell --> Sections
    SharedShell --> Overlays
    Header --> Draft
    Sidebar --> Draft
    Sections --> Draft
    Overlays --> Draft
    Draft -->|dirty state| SaveBar
    SaveBar -->|FormData with intent| Action
    Action --> Handlers
    Handlers --> Persist
    Persist --> Sync
    Sync --> Compact
    Compact -->|fetcher response| Draft
```

## Ownership boundaries

- The app shell owns authentication bootstrap, App Bridge, Redux, localization, and global navigation.
- Remix loaders/actions remain the route data boundary; Redux stores only client-side Admin state and selected standalone client calls.
- FPB and PPB keep separate route URLs, loaders, actions, save handlers, and storefront sync contracts.
- `CommonConfigureShell` owns shared shell composition only. FPB and PPB flows inject their own header, sidebar, sections, overlays, draft logic, and save semantics.
- Admin components use Polaris web components first; custom HTML is reserved for documented gaps such as the configure shell grid and specialized overlays.
