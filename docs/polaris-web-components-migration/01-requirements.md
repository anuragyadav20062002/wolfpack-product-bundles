# Requirements: Migrate Admin UI from @shopify/polaris React to Polaris Web Components

## Context

Shopify now provides a framework-agnostic set of web components (`<s-*>`) as the canonical way to build Admin app UIs. These components ship as a CDN script (`cdn.shopify.com/shopifycloud/polaris.js`) and work as native HTML custom elements inside any framework — including React/Remix JSX. Migrating removes the heavy `@shopify/polaris` npm bundle, ensures our app UI is always on the latest Polaris design tokens without npm upgrades, and brings us in line with Shopify's "Built for Shopify" guidelines.

## Research Findings (from shopify-dev-mcp + docs)

| Fact | Detail |
|---|---|
| Web components prefix | `<s-*>` (e.g., `<s-page>`, `<s-button>`, `<s-table>`) |
| Loaded from | `cdn.shopify.com/shopifycloud/polaris.js` (always latest) |
| TypeScript types | `@shopify/polaris-types` npm package |
| App Bridge UI (nav, title bar) | `<ui-nav-menu>`, `<ui-title-bar>`, `<ui-save-bar>` via `cdn.shopify.com/shopifycloud/app-bridge.js` |
| Scaffolded framework | React Router — but web components work in ANY framework |
| Remix compatibility | ✅ — `<s-*>` elements are valid JSX; Remix server-side auth stays unchanged |
| i18n | Handled by the CDN script automatically (reads browser/Shopify locale); no AppProvider i18n prop needed |
| `@shopify/shopify-app-remix` AppProvider | Must be kept — handles session token, exit-iframe, auth flow. Its `i18n` prop becomes a no-op after migration |

## Gaps — No Direct Web Component Equivalent

| React Polaris | Web Component | Gap / Workaround |
|---|---|---|
| `<Tabs>` | ❌ None | Custom `<s-button>`-based tab bar with state, or `<s-choice-list>` |
| `<Pagination>` | ❌ None | Custom `<s-button-group>` + `<s-text>` |
| `<DataTable>` | `<s-table>` ✅ | Different API; thead is hidden pattern |
| `<Toast>` | ❌ React Polaris | Use `shopify.toast.show()` App Bridge API |
| `<Frame>` | ❌ Not needed | Web components handle their own frame |
| `<Filters>` | `<s-popover>` + `<s-choice-list>` ✅ | Index table composition pattern |
| `<ContextualSaveBar>` | `<ui-save-bar>` ✅ | App Bridge web component |
| `<InlineStack>` / `<BlockStack>` | `<s-stack direction="inline/block">` ✅ | Exact equivalent |
| `<Grid>` | `<s-grid>` ✅ | CSS grid-template-columns attribute |
| `<Text>` | `<s-text>` / `<s-paragraph>` / `<s-heading>` ✅ | Split into three components |
| `<Card>` | `<s-section>` ✅ | Closest equivalent |
| `<Page>` | `<s-page>` ✅ | Exact equivalent |
| `<Badge>` | `<s-badge>` ✅ | Exact |
| `<Banner>` | `<s-banner>` ✅ | Exact |
| `<Button>` | `<s-button>` ✅ | Exact |
| `<Select>` | `<s-select>` + `<s-option>` ✅ | Different child syntax |
| `<TextField>` | `<s-text-field>` ✅ | Exact |
| `<Checkbox>` | `<s-checkbox>` ✅ | Exact |
| `<Modal>` | `<s-modal>` ✅ | Different open/close mechanism |
| `<Icon>` | `<s-icon type="...">` ✅ | Icon names differ from Polaris React |
| Custom CSS modules | ⚠️ Partial | Keep where layout isn't covered by web components |

## Pages / Files in Scope

### Requires full Polaris migration
| File | Complexity | Notes |
|---|---|---|
| `app/routes/app/app.tsx` | Low | Remove i18n/AppProvider Polaris bits; load CDN scripts |
| `app/routes/app/app.dashboard/route.tsx` | High | Dashboard — biggest file, complex layout |
| `app/routes/app/app.dashboard/dashboard.module.css` | Medium | Some custom styles become unnecessary |
| `app/routes/app/app.design-control-panel/route.tsx` | Very High | DCP is the most complex page |
| `app/routes/app/app.attribution.tsx` | Medium | Analytics charts + tables |
| `app/routes/app/app.pricing.tsx` | Medium | Pricing UI |
| `app/routes/app/app.events.tsx` | Low | Simple content page |
| `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` | Very High | Bundle config — tabs, modals, forms |
| `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx` | Very High | Same |
| `app/routes/app/app.billing.tsx` | Medium | |
| `app/routes/app/app.onboarding.tsx` | Medium | |
| `app/components/*` (all shared components) | High | Must audit each |

### Out of scope
- All `api/*` routes (server-only, no UI)
- `auth/*` routes (auth flow, not Polaris UI)
- Widget JS / Liquid files (storefront, separate system)
- Prisma schema, server services

## Functional Requirements

- **FR-01:** Load `polaris.js` and `app-bridge.js` from Shopify CDN in the Remix HTML shell.
- **FR-02:** Install `@shopify/polaris-types` and configure JSX to recognise `<s-*>` custom elements.
- **FR-03:** Remove `@shopify/polaris` React component imports from every admin route and replace with equivalent `<s-*>` elements.
- **FR-04:** Replace `<NavMenu>` from `@shopify/app-bridge-react` with `<ui-nav-menu>` web component.
- **FR-05:** Replace `shopify.toast.show()` calls currently delegated through React Polaris toasts — they already use App Bridge; verify they still work post-migration.
- **FR-06:** Replace all `<Tabs>` usage with a web-component-compatible tab pattern (custom `<s-button>` tab bar or `<s-choice-list>`).
- **FR-07:** Replace all `<Pagination>` usage with `<s-button>` prev/next + `<s-text>` count display.
- **FR-08:** Remove `@shopify/polaris/build/esm/styles.css` import — `polaris.js` injects its own styles.
- **FR-09:** Remove `polarisTranslations` / `i18n` logic from `app.tsx` — CDN polaris.js handles locale automatically.
- **FR-10:** All custom CSS module classes that replicate layout now covered by `<s-stack>`, `<s-grid>`, `<s-box>` must be removed. CSS modules are retained only for app-specific styling not covered by web components.
- **FR-11:** Zero regressions on all existing pages — every page must render correctly after migration.

## Out of Scope

- Migrating from Remix to React Router (the new App Home scaffolded framework). We keep Remix.
- Migrating server-side auth (`@shopify/shopify-app-remix`, Prisma, `authenticate.admin()`).
- Storefront widget JS / CSS.
- Cart transform, checkout UI extensions.
- Any new features — this is a pure UI layer swap.

## Acceptance Criteria

### FR-01
- [ ] `polaris.js` script tag is present in every HTML response (verify in browser devtools).
- [ ] `<s-button>` renders correctly on the dashboard without any console errors.

### FR-02
- [ ] `tsc --noEmit` passes with zero errors after adding `@shopify/polaris-types`.
- [ ] JSX can use `<s-page>` without TypeScript `JSX.IntrinsicElements` errors.

### FR-03 / FR-10
- [ ] Zero `import ... from '@shopify/polaris'` statements remain in any `app/routes/app/` file.
- [ ] All pages render visually correct in Chrome DevTools MCP screenshot.

### FR-04
- [ ] Navigation menu appears in Shopify Admin (Dashboard, DCP, Analytics, Pricing, Updates links).

### FR-06 / FR-07
- [ ] Tabs on bundle config pages switch content correctly.
- [ ] Bundle list pagination works (page forward/back, per-page select).

### FR-08 / FR-09
- [ ] No Polaris CSS link tag in HTML source.
- [ ] No `polarisTranslations` loader export in `app.tsx`.

## Risks

| Risk | Mitigation |
|---|---|
| `@shopify/shopify-app-remix` AppProvider may break if `@shopify/polaris` is removed (peer dep) | Test removing `@shopify/polaris` incrementally; keep the package if it's a hard peer dep |
| `<s-*>` event API differs from React synthetic events (no `onChange`, uses `input` / `change` DOM events) | Wrap event handlers with `useRef` + `addEventListener` or use Remix's `<Form>` native submit |
| No Tabs web component — complex tab state in bundle config pages needs custom implementation | Use `<s-button>` tab pattern with React `useState` |
| CDN dependency — polaris.js won't load if CDN is unreachable | Acceptable; Shopify's own CDN is highly available |
| Icon names differ between React Polaris and web components (`ExternalSmallIcon` → `type="external"`) | Map all icon names during migration |
| `@shopify/polaris-types` may lag behind CDN polaris.js | Use `@latest` tag in package.json |
| Scope is very large — risk of partial migration breaking pages | Migrate page-by-page; deploy incrementally |
