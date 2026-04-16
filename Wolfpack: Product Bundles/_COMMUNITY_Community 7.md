---
type: community
cohesion: 0.05
members: 49
---

# Community 7

**Cohesion:** 0.05 - loosely connected
**Members:** 49 nodes

## Members
- [[--bundle-promo-banner-bg-image CSS Variable Applied via Widget JS]] - document - docs/bundle-images-gifs/03-architecture.md
- [[.bundle-loading-overlay CSS Component]] - code - docs/loading-gif-overlay/03-architecture.md
- [[Add Bundle to Cart Button]] - concept - docs/loading-gif-overlay/00-BR.md
- [[BUNDLE_SYNC_VERSION Environment Variable (triggers bundle re-sync when bumped)]] - document - docs/bundle-auto-resync/00-requirements.md
- [[Beco BYOB Expandable Floating Footer — Architecture Decision Record]] - document - docs/beco-layout-redesign/03-architecture.md
- [[Beco BYOB Expandable Floating Footer — Business Requirement]] - document - docs/beco-layout-redesign/00-BR.md
- [[Beco BYOB Expandable Floating Footer — PO Requirements]] - document - docs/beco-layout-redesign/02-PO-requirements.md
- [[Beco BYOB Expandable Floating Footer — SDE Implementation Plan]] - document - docs/beco-layout-redesign/04-SDE-implementation.md
- [[Bundle Auto Re-sync — Requirements & Discussion Notes]] - document - docs/bundle-auto-resync/00-requirements.md
- [[BundleUiConfig Types (metafield-synctypes.ts)]] - code - docs/loading-gif-overlay/03-architecture.md
- [[CSS is-open Class Toggle for Footer ExpandCollapse (no inline style manipulation)]] - document - docs/beco-layout-redesign/03-architecture.md
- [[Compact Sticky Footer Bar (72px height, fixed to bottom of viewport)]] - document - docs/beco-layout-redesign/00-BR.md
- [[Cron Endpoint POST apicronsync-bundles (shared secret auth)]] - document - docs/bundle-auto-resync/00-requirements.md
- [[DCP CSS Variables Mapping for New Beco Footer Elements]] - document - docs/beco-layout-redesign/03-architecture.md
- [[Deal-Unlock Callout Banner (green, appears when bundle goal met)]] - document - docs/beco-layout-redesign/00-BR.md
- [[DesignSettings DB Table]] - concept - docs/promo-banner-bg-image/03-architecture.md
- [[DesignSettings.promoBannerSettings Json Column]] - concept - docs/promo-banner-bg-image/03-architecture.md
- [[Expandable Product List Panel (upward-expanding, max-height 60vh)]] - document - docs/beco-layout-redesign/00-BR.md
- [[Full-Page Bundle Configure Handler (handlers.server.ts)]] - code - docs/loading-gif-overlay/03-architecture.md
- [[Full-Page Bundle Widget (FPB)]] - concept - docs/loading-gif-overlay/00-BR.md
- [[Loading GIF Overlay - SDE Implementation Plan]] - document - docs/loading-gif-overlay/04-SDE-implementation.md
- [[Loading GIF Overlay Feature]] - document - docs/loading-gif-overlay/00-BR.md
- [[Per-Bundle Images & GIFs — Architecture Decision Record]] - document - docs/bundle-images-gifs/03-architecture.md
- [[Per-Bundle Images & GIFs — Business Requirement]] - document - docs/bundle-images-gifs/00-BR.md
- [[Per-Bundle Images & GIFs — PO Requirements]] - document - docs/bundle-images-gifs/02-PO-requirements.md
- [[Per-Bundle Images & GIFs — SDE Implementation Plan]] - document - docs/bundle-images-gifs/04-SDE-implementation.md
- [[Prisma Bundle Model]] - concept - docs/loading-gif-overlay/03-architecture.md
- [[Product-Page Bundle Widget (PDP)]] - concept - docs/loading-gif-overlay/00-BR.md
- [[PromoBannerSettings TypeScript Interface]] - code - docs/promo-banner-bg-image/03-architecture.md
- [[Rationale Rejected BundleMedia Table as Premature Abstraction]] - document - docs/bundle-images-gifs/03-architecture.md
- [[Rationale Rejected Storing promoBannerBgImage in BundlePricing.messages JSON (wrong semantic home)]] - document - docs/bundle-images-gifs/03-architecture.md
- [[Soft Sync Operation (re-writes metafields without deleting Shopify page)]] - document - docs/bundle-auto-resync/00-requirements.md
- [[Step Transition Loading State]] - concept - docs/loading-gif-overlay/00-BR.md
- [[Version-Gated Lazy Migration Pattern (syncedAtVersion vs BUNDLE_SYNC_VERSION)]] - document - docs/bundle-auto-resync/00-requirements.md
- [[Widget Version Bump 1.6.0 → 1.7.0 for Beco Footer Feature]] - document - docs/beco-layout-redesign/04-SDE-implementation.md
- [[Widget-Scoped Absolute Overlay (Approach B)]] - concept - docs/loading-gif-overlay/00-BR.md
- [[appassetsbundle-widget-full-page.js (FPB Widget Source)]] - code - docs/beco-layout-redesign/03-architecture.md
- [[approutesappapp.bundles.full-page-bundle.configure.$bundleIdroute.tsx]] - code - docs/bundle-images-gifs/03-architecture.md
- [[bundle_ui_config Metafield]] - concept - docs/loading-gif-overlay/03-architecture.md
- [[extensionsbundle-builderassetsbundle-widget-full-page.css]] - code - docs/beco-layout-redesign/03-architecture.md
- [[hideLoadingOverlay() Method]] - code - docs/loading-gif-overlay/03-architecture.md
- [[loadingGif DB Field (Bundle model)]] - concept - docs/loading-gif-overlay/03-architecture.md
- [[npm run buildwidgets Command]] - concept - docs/loading-gif-overlay/04-SDE-implementation.md
- [[promoBannerBgImage Field (PromoBannerSettings)]] - concept - docs/promo-banner-bg-image/03-architecture.md
- [[promoBannerBgImageCrop DB Field]] - document - docs/promo-banner-crop/03-architecture.md
- [[renderFullPageFooter() In-Place Rewrite (Option A chosen over new method)]] - document - docs/beco-layout-redesign/03-architecture.md
- [[showLoadingOverlay() Method]] - code - docs/loading-gif-overlay/03-architecture.md
- [[syncedAtVersion Field on Bundle Model (tracks last synced code version)]] - document - docs/bundle-auto-resync/00-requirements.md
- [[useBundleForm.ts pageSlug State + hasManuallyEditedSlug Flag]] - code - docs/custom-bundle-url-slugs/03-architecture.md

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Community_7
SORT file.name ASC
```

## Connections to other communities
- 4 edges to [[_COMMUNITY_Community 0]]
- 2 edges to [[_COMMUNITY_Community 4]]
- 1 edge to [[_COMMUNITY_Community 2]]
- 1 edge to [[_COMMUNITY_Community 21]]
- 1 edge to [[_COMMUNITY_Community 10]]
- 1 edge to [[_COMMUNITY_Community 13]]
- 1 edge to [[_COMMUNITY_Community 5]]
- 1 edge to [[_COMMUNITY_Community 8]]
- 1 edge to [[_COMMUNITY_Community 24]]

## Top bridge nodes
- [[promoBannerBgImageCrop DB Field]] - degree 6, connects to 4 communities
- [[bundle_ui_config Metafield]] - degree 8, connects to 3 communities
- [[loadingGif DB Field (Bundle model)]] - degree 7, connects to 2 communities
- [[promoBannerBgImage Field (PromoBannerSettings)]] - degree 7, connects to 1 community
- [[showLoadingOverlay() Method]] - degree 5, connects to 1 community