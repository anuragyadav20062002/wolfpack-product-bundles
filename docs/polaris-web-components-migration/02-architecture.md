# Architecture: Migrate Admin UI to Polaris Web Components

## Impact Analysis

- **Communities touched:** Dashboard, DCP, BundleConfig (FPB + PDP), Attribution, Pricing, Events, Billing, Onboarding, Shared Components
- **God nodes affected:** `useBundleConfigurationState`, `useBundleForm`, `useBundlePricing`, `useDashboardState`, `getDCPConfig` — these hooks drive all UI state; they are NOT removed but their JSX consumers change
- **Blast radius:** Every admin route file; all 70+ component files under `app/components/`
- **Auth / server layer:** Not affected — `@shopify/shopify-app-remix`, Prisma, `authenticate.admin()` are untouched

## Hard Constraint Discovered

`@shopify/shopify-app-remix`'s `AppProvider` **directly imports and wraps** `@shopify/polaris`'s own `AppProvider`:

```js
// node_modules/@shopify/shopify-app-remix/dist/esm/react/components/AppProvider/AppProvider.mjs
import { AppProvider as AppProvider$1 } from '@shopify/polaris';
import englishI18n from '@shopify/polaris/locales/en.json';
```

**Consequence:** `@shopify/polaris` MUST remain installed. We cannot `npm uninstall` it.

**What we can do:** Remove all **our own** `import { ... } from '@shopify/polaris'` across all route and component files, replacing them with `<s-*>` web components. The package stays as an indirect dependency of `shopify-app-remix`.

## Decision

**Approach: In-place UI layer swap, phased by page complexity.**

Keep Remix + `@shopify/shopify-app-remix` + `@shopify/polaris` (as indirect dep). Add `polaris.js` CDN for web components. Replace every `import from '@shopify/polaris'` in OUR code with `<s-*>` elements. Migrate page by page to contain risk.

We do NOT:
- Migrate to React Router / new App Home scaffold
- Remove `@shopify/polaris` from `package.json` (it's a required peer dep)
- Touch server-side auth or data loading

## CDN Script Loading — Corrected

**App Bridge is already injected.** `@shopify/shopify-app-remix`'s `AppProvider` injects `<script src="https://cdn.shopify.com/shopifycloud/app-bridge.js" data-api-key="...">` automatically. Do NOT add it again.

**polaris.js must be added manually.** Remix's `links()` export only produces `<link>` HTML elements — it cannot emit `<script>` tags. The correct place is `app/root.tsx`, directly inside `<head>`:

```tsx
// app/root.tsx — add inside <head>:
<script src="https://cdn.shopify.com/shopifycloud/polaris.js" />
```

**polarisStyles CSS — keep during migration.** `@shopify/polaris`'s `AppProvider` (wrapped by `shopify-app-remix`) needs its CSS for any React Polaris components still in use on un-migrated pages. Remove it only after every page is fully migrated (Phase 6 complete).

> `polaris.js` web component styles are scoped to Shadow DOM / `:host` and do not conflict with `.Polaris-*` classes.

## TypeScript Setup

```bash
npm install @shopify/polaris-types@latest
```

`@shopify/polaris-types` ships a `.d.ts` that augments `JSX.IntrinsicElements` to include all `<s-*>` elements. It is a dev-only type package — it adds no runtime code.

No `tsconfig.json` change is needed as long as the package is installed and `typeRoots` is not explicitly set. If it is set, add `"./node_modules/@shopify/polaris-types"` to the array.

## React 18 + Custom Elements — Known Limitation

This app uses React `^18.2.0`. React 18 passes string/number attributes to custom elements correctly, but has two gaps:
1. **Object/array props** cannot be set via JSX — must use `ref` + `.setAttribute()` / direct property assignment.
2. **Event names**: React 18 wires `onChange` to the native `change` event on custom elements. Polaris web components fire a `change` CustomEvent — this works correctly in React 18.

**In practice**: Polaris `<s-*>` components only require string/number attributes in JSX (e.g., `heading="..."`, `tone="success"`, `variant="primary"`). The React 18 limitation is not hit in normal usage. All event handlers use standard DOM events.

## Event Handling Pattern

Web components fire native DOM events (`input`, `change`, `s-change`), not React synthetic events. Pattern for controlled inputs:

```tsx
// React Polaris:
<TextField value={val} onChange={(v) => setVal(v)} />

// Web component — use ref + useEffect:
const ref = useRef<HTMLElement>(null);
useEffect(() => {
  const el = ref.current;
  if (!el) return;
  const handler = (e: Event) => setVal((e as CustomEvent).detail.value ?? (e.target as HTMLInputElement).value);
  el.addEventListener('change', handler);
  return () => el.removeEventListener('change', handler);
}, []);
<s-text-field ref={ref} value={val} label="Name" />

// Or — for Remix <Form> submits, use uncontrolled (name attribute only):
<s-text-field name="bundleName" label="Bundle Name" value={loaderData.name} />
```

Prefer uncontrolled / Remix Form submissions where possible — they work naturally with web components' native form participation.

## i18n

Remove the `polarisTranslations` loader and `useEffect` from `app.tsx` — `polaris.js` reads locale from `<html lang>` automatically. `AppProvider`'s `i18n` prop becomes a no-op (the React Polaris AppProvider still receives it but no React Polaris components are visible).

## AppProvider Simplification

`shopify-app-remix`'s `AppProvider` defaults `i18n` to `englishI18n` when no prop is passed — that's fine once we have no visible React Polaris components. Remove our entire locale-loading system:

```tsx
// BEFORE (app.tsx):
const [i18n, setI18n] = useState(polarisTranslations);
// ...useEffect watching locale...
return <AppProvider isEmbeddedApp apiKey={apiKey} i18n={i18n}>

// AFTER (Phase 1 of migration only):
return <AppProvider isEmbeddedApp apiKey={apiKey}>
// No i18n prop, no useState, no useEffect, no locale JSON imports
// polaris.js reads locale from Shopify admin automatically
```

**Loader simplification**: Remove `polarisTranslations` from the loader return and the dynamic import chain in `app.tsx`.

## Nav Menu

```tsx
// BEFORE:
import { NavMenu } from "@shopify/app-bridge-react";
<NavMenu>
  <a href="/app/dashboard" rel="home">Dashboard</a>
  ...
</NavMenu>

// AFTER (App Bridge web component — same syntax, different import):
// NavMenu from @shopify/app-bridge-react already renders as <ui-nav-menu>
// Keep as-is — no change needed here
```

## Phased File Plan

### Phase 1 — Infrastructure (1 session)

| File | Action | Change |
|---|---|---|
| `package.json` | modify | Add `@shopify/polaris-types` |
| `tsconfig.json` | modify | Add `@shopify/polaris-types` to `types` array |
| `app/routes/app/app.tsx` | modify | Remove `polarisStyles` link + i18n logic; add polaris.js CDN link; simplify `AppProvider` |

### Phase 2 — Dashboard (1–2 sessions)

| File | Action | Change |
|---|---|---|
| `app/routes/app/app.dashboard/route.tsx` | rewrite | Replace all `@shopify/polaris` imports with `<s-*>` components |
| `app/routes/app/app.dashboard/dashboard.module.css` | prune | Remove CSS classes now handled by `<s-stack>`, `<s-grid>`, `<s-box>`; keep custom/brand styles |

### Phase 3 — Simple pages (1 session)

| File | Action | Change |
|---|---|---|
| `app/routes/app/app.events.tsx` | migrate | Low complexity |
| `app/routes/app/app.attribution.tsx` | migrate | Charts may stay as custom HTML |
| `app/routes/app/app.billing.tsx` | migrate | |
| `app/routes/app/app.onboarding.tsx` | migrate | |
| `app/components/ErrorPage.tsx` | migrate | |
| `app/components/UpgradePromptBanner.tsx` | migrate | |
| `app/components/AppEmbedBanner.tsx` | migrate | |
| `app/components/ProxyHealthBanner.tsx` | migrate | |
| `app/components/billing/*.tsx` (8 files) | migrate | |

### Phase 4 — Pricing (1 session)

| File | Action | Change |
|---|---|---|
| `app/routes/app/app.pricing.tsx` | migrate | Complex but isolated |
| `app/components/PricingTiersSection.tsx` | migrate | |

### Phase 5 — Bundle Config pages (2–3 sessions)

| File | Action | Change |
|---|---|---|
| `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` | migrate | Very high complexity: tabs, modals, multi-step form |
| `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx` | migrate | Same |
| `app/components/BundleSetupInstructions.tsx` | migrate | |
| `app/components/AccordionItem.tsx` | migrate | |
| `app/components/CartPropertyFixCard.tsx` | migrate | |

### Phase 6 — DCP (3–5 sessions)

| File | Action | Change |
|---|---|---|
| `app/routes/app/app.design-control-panel/route.tsx` | migrate | Most complex page |
| `app/components/design-control-panel/**` (50+ files) | migrate | Complex settings, previews, color pickers |

## Component Mapping Reference

| React Polaris | Web Component | Notes |
|---|---|---|
| `<Page title>` | `<s-page heading>` | |
| `<Card>` / `<LegacyCard>` | `<s-section>` | |
| `<BlockStack>` | `<s-stack direction="block">` | |
| `<InlineStack>` | `<s-stack direction="inline">` | |
| `<Grid>` | `<s-grid>` | |
| `<Box>` | `<s-box>` | |
| `<Text variant="headingMd">` | `<s-heading>` | |
| `<Text variant="bodyMd">` | `<s-paragraph>` | |
| `<Text>` (inline) | `<s-text>` | |
| `<Button variant="primary">` | `<s-button variant="primary">` | |
| `<ButtonGroup>` | `<s-button-group>` | |
| `<Badge tone="success">` | `<s-badge tone="success">` | |
| `<Banner tone="warning">` | `<s-banner tone="warning">` | |
| `<Select>` | `<s-select><s-option>` | |
| `<TextField>` | `<s-text-field>` | |
| `<Checkbox>` | `<s-checkbox>` | |
| `<Spinner>` | `<s-spinner>` | |
| `<Icon source={X}>` | `<s-icon type="x">` | Icon name mapping needed |
| `<Thumbnail>` | `<s-thumbnail>` | |
| `<Avatar>` | `<s-avatar>` | |
| `<Divider>` | `<s-divider>` | |
| `<Link>` | `<s-link>` | |
| `<Modal>` | `<s-modal>` | Open/close via `open` attr |
| `<Popover>` | `<s-popover>` | |
| `<Tooltip>` | `<s-tooltip>` + `interest-for` attr | |
| `<DataTable>` | `<s-table>` | thead hidden via CSS |
| `<Pagination>` | Custom `<s-button-group>` | No equivalent |
| `<Tabs>` | Custom `<s-button>` tab bar | No equivalent |
| `<Toast>` | `shopify.toast.show()` | App Bridge API |

## Test Plan

| Test scope | Approach | Key validations |
|---|---|---|
| Phase 1 smoke test | Chrome DevTools MCP screenshot of every page | No broken layouts, no console errors |
| Dashboard interactivity | Click all CTAs, open modals, test search/filter | All interactions work |
| Bundle config tabs | Navigate through all tabs | State preserved |
| Form submission | Submit forms on bundle config + DCP | Server actions receive correct data |
| Language | Select French in dropdown | Polaris web components show French strings automatically |

**No unit tests needed** for this migration — it's a UI layer swap with no logic changes.

## Total Scope Estimate

| Phase | Files | Complexity | Effort |
|---|---|---|---|
| 1 — Infrastructure | 3 | Low | ~30 min |
| 2 — Dashboard | 2 | High | ~2–3 hrs |
| 3 — Simple pages | ~15 | Low–Medium | ~2–3 hrs |
| 4 — Pricing | 2 | Medium | ~1 hr |
| 5 — Bundle Config | ~8 | Very High | ~4–6 hrs |
| 6 — DCP | ~55 | Very High | ~8–12 hrs |
| **Total** | **~85 files** | | **~18–26 hrs** |

> **Recommendation:** Do phases 1–2 in this session to prove the approach on the dashboard. Phases 3–6 are follow-on work. Each phase ships independently and does not break the app for un-migrated pages since React Polaris still works for any route not yet touched.
