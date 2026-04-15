# Research: Full-Page Bundle — Inheriting Store Header & Footer

**Date:** 2026-04-07
**Status:** Research Complete

---

## Current Architecture

The full-page bundle (FPB) widget is delivered as a **theme app extension** with two blocks:

1. **`bundle-full-page-embed.liquid`** — An **app embed block** (`target: "body"`) that auto-renders on any Shopify `page` that has the `custom.bundle_id` metafield set.
2. **`bundle-full-page.liquid`** — An **app block** (`target: "section"`) for manual placement inside sections via the theme editor.

The embed block renders the widget inside the `<body>` tag, **floating over** the page content. It does NOT participate in the normal template/section flow.

### How it gets header/footer today

Because the embed block is injected into the `<body>` of pages rendered via `theme.liquid` layout, the store's header and footer **already exist on the page**. They are rendered by the layout's `{% sections 'header-group' %}` and `{% sections 'footer-group' %}` tags.

**The widget itself does NOT need to import/include the header or footer — the Shopify layout already provides them.**

---

## How Shopify Renders Header & Footer

### Layout → Template → Section Architecture

```
layout/theme.liquid
├── {% sections 'header-group' %}     ← header (announcement bar, nav)
├── <main>{{ content_for_layout }}</main>  ← JSON template content goes here
└── {% sections 'footer-group' %}     ← footer
```

### Section Groups

- `sections/header-group.json` — defines which sections render in the header area
- `sections/footer-group.json` — defines which sections render in the footer area
- These are **layout-level** constructs — every page using `theme.liquid` automatically gets them
- Merchants customize them in **Theme Editor > Header/Footer**

### JSON Templates

- Located in `templates/*.json` (e.g., `templates/page.json`, `templates/page.bundle.json`)
- Define only the **main content area** (what goes inside `{{ content_for_layout }}`)
- Have an optional `layout` attribute — defaults to `theme.liquid`
- **Do NOT reference header/footer** — that comes from the layout

### Key Insight

Any content that renders inside a JSON template **automatically gets the store's header and footer** because the layout wraps it. The only way to NOT get header/footer is to set `"layout": false` in the template.

---

## Three Approaches Analyzed

### Approach 1: App Embed Block (Current)

**How it works:** The embed block is activated globally in Theme Settings > App Embeds. It injects content before `</body>` on every page template that matches `enabled_on.templates: ["page"]`. It reads `page.metafields.custom.bundle_id` to decide whether to render.

**Header/Footer:** ✅ Present — the page is rendered with `theme.liquid` layout, which includes header-group and footer-group.

**Problem:** The embed content is injected into the DOM **after** the main content area, not **within** it. This means:
- It floats at the bottom of the `<body>`, not inside `<main>`
- The page's own content (title, body HTML) renders first, then the widget appears below
- The widget is not in the normal document flow relative to the page's section structure
- CSS positioning must be used to make it look like part of the page

**Verdict:** Header/footer ARE present. The issue may be that the widget renders outside the main content area, making it feel disconnected from the page layout.

### Approach 2: App Block in Section (Available but requires manual placement)

**How it works:** `bundle-full-page.liquid` with `target: "section"` can be dragged into any section within a JSON template via the theme editor.

**Header/Footer:** ✅ Present — it's inside a template section, which is inside `{{ content_for_layout }}`, which is inside the layout.

**Problem:** Requires the merchant to manually:
1. Create a Shopify page
2. Open the theme editor
3. Navigate to that page
4. Add the "Wolfpack Bundle Full Page" block to a section
5. Configure settings

**Verdict:** Header/footer present. Best integration with the page layout. But manual setup is a friction point.

### Approach 3: App Proxy with `Content-Type: application/liquid`

**How it works:** The app serves Liquid content at a proxy URL (e.g., `https://store.com/apps/product-bundles/bundle/123`). When the response has `Content-Type: application/liquid`, Shopify renders the Liquid code **within the theme's layout**, providing header and footer automatically.

**Header/Footer:** ✅ Present — Shopify wraps proxy-served Liquid in the active theme's layout.

**Key Details:**
- The proxy URL is already configured: `prefix: "apps"`, `subpath: "product-bundles"`
- So the URL would be: `https://store.com/apps/product-bundles/bundles/{handle}`
- The server returns Liquid template code with `Content-Type: application/liquid`
- Shopify's proxy renderer evaluates the Liquid within the theme context (has access to `shop`, `cart`, etc.)
- The content renders inside `{{ content_for_layout }}` — exactly where normal page content goes

**Limitations:**
- Depends on the app server being available (cold-start risk)
- Limited Liquid objects available (no `page` object — it's not a real page)
- Liquid processing adds latency compared to a static page
- Cannot be customized per-page via theme editor (no schema settings)

**Verdict:** Gives the cleanest "native page" experience with header/footer, but has performance and customization trade-offs.

---

## Approach Comparison Matrix

| Factor | Embed Block (Current) | App Block in Section | App Proxy (Liquid) |
|--------|----------------------|---------------------|-------------------|
| Header/Footer | ✅ Present | ✅ Present | ✅ Present |
| In-flow with content | ❌ Injected at body end | ✅ Inside section | ✅ Inside content_for_layout |
| Setup effort (merchant) | Low (one-time embed toggle) | Medium (per-page editor setup) | None (URL-based) |
| Theme editor settings | ✅ Via embed settings | ✅ Via block settings | ❌ None |
| Server dependency | ❌ No (uses metafield) | ❌ No (uses metafield) | ✅ Yes (server must respond) |
| Cold-start risk | Low (metafield cache) | Low (metafield cache) | High (full page from server) |
| SEO/URL control | Uses Shopify page URL | Uses Shopify page URL | Custom proxy URL |
| Access to Liquid objects | ✅ Full (page, shop, cart) | ✅ Full (page, shop, cart) | ⚠️ Partial (shop, cart, no page) |

---

## Recommended Strategy

### The header/footer is NOT the real problem

Based on this research, all three approaches already provide the store's header and footer. The Shopify layout system automatically wraps any page content with the theme's header and footer sections.

### The real question is: content flow integration

If the concern is that the widget doesn't feel like it's "part of the page" — sitting between header and footer in the normal content flow — then the issue is likely:

1. **Embed block positioning** — renders at `</body>`, not inside `<main>`
2. **Page content interference** — the Shopify page's own title/body renders alongside or above the widget
3. **CSS isolation** — the widget may not inherit the theme's typography, colors, spacing

### Recommended Next Steps

1. **Clarify the actual problem** — Is the header/footer literally missing? Or does the widget just not feel "part of" the store's design?
2. **If the widget needs to be inside the content flow** — the App Block approach (already available) is the most integrated option
3. **If we want zero-setup with content flow** — the App Proxy approach gives native placement but adds server dependency
4. **If the embed is fine but needs better visual integration** — CSS inheritance improvements may be sufficient

---

## Shopify Platform Constraints

- **Theme app extensions CANNOT provide JSON templates** — only blocks, snippets, assets, and locales
- **App blocks CANNOT self-install into a template** — the merchant must add them via theme editor (or the app can use the Asset API to write templates, but this is fragile and theme-dependent)
- **App embed blocks inject at `<body>` level** — not inside `{{ content_for_layout }}`
- **App proxy Liquid rendering** wraps content in the theme layout automatically when `Content-Type: application/liquid` is set
- **Section groups** (header/footer) are layout-level and automatic — no action needed to include them

---

## References

- [Shopify Section Groups](https://shopify.dev/docs/storefronts/themes/architecture/section-groups)
- [Shopify JSON Templates](https://shopify.dev/docs/storefronts/themes/architecture/templates/json-templates)
- [Theme App Extension Configuration](https://shopify.dev/docs/apps/build/online-store/theme-app-extensions/configuration)
- [App Blocks](https://shopify.dev/docs/storefronts/themes/architecture/blocks/app-blocks)
- [App Proxies](https://shopify.dev/docs/apps/build/online-store/app-proxies)
- [Dawn theme.liquid](https://github.com/Shopify/dawn/blob/main/layout/theme.liquid)
