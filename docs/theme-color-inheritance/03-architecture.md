# Architecture Decision Record: Theme Color Inheritance for Free Plan Bundle Widget

## Context

The bundle widget CSS is generated server-side from a `DesignSettings` DB record and served via `GET /api/design-settings/{shopDomain}?bundleType=...`. Color generation resolves 6 global color anchors, which are then referenced by ~80% of the widget's CSS variables. For Free plan merchants with no DCP customization, these anchors fall back to hardcoded values (`#000000`, `#FFFFFF`, `#6B7280`).

We need to substitute the store's active Shopify theme colors as those fallback values, so the widget looks integrated with the store without any merchant configuration.

---

## Constraints

- CSS endpoint is **unauthenticated and public** — called via `<link>` tag in Liquid. No Shopify session is available at CSS generation time. Cannot make Shopify API calls during the CSS request.
- Theme colors must be cached in DB and fetched via Admin API at a different time (install, sync).
- No plan-gating logic should be added to the CSS hot path — the endpoint is performance-critical (every storefront page load with a bundle widget hits it).
- Must not require DB migrations that affect existing data or change existing columns.
- The `generateCSSFromSettings` function signature change must be backward-compatible.

---

## Options Considered

### Option A: Theme colors as a fallback layer in `generateCSSFromSettings` (no plan check)

Store `themeColors` JSON on `DesignSettings`. In the CSS generation function, resolve each global anchor as:

```
DCP custom value → theme color fallback → hardcoded default
```

No plan check in the CSS endpoint. The cascade handles it naturally:
- Free plan: no DCP custom values → theme colors apply
- Grow plan (unstyled): no DCP custom values → theme colors apply (acceptable — same good default)
- Grow plan (DCP customized): DCP values present → theme colors ignored

**Pros:**
- Zero extra DB queries in CSS hot path (themeColors is on the same `DesignSettings` row)
- No plan detection logic in the public endpoint
- Grow plan merchants upgrading from Free get a smooth transition — their current theme colors persist as defaults until they customize
- Backward compatible: `themeColors: null` → falls through to hardcoded defaults (current behavior)

**Cons:**
- A Grow merchant who hasn't customized DCP yet sees theme colors, not our handcrafted defaults (orange `#FF9000` buttons etc. from `defaultSettings.ts`). This is arguably better UX, not worse.

**Verdict:** ✅ Recommended

---

### Option B: Plan-gated theme color injection in CSS endpoint

Add a subscription check in `api.design-settings.$shopDomain.tsx`. If plan === "free", override the global anchor defaults with stored theme colors.

**Pros:** Explicit plan gating; Grow merchants always see DCP defaults even without customization

**Cons:**
- Extra DB query (subscription table) on every CSS request — adds ~5–10ms to each storefront page load
- Adds plan-awareness to a public unauthenticated endpoint (security surface increase)
- If `ENFORCE_PLAN_GATES` is not set (SIT), the plan check becomes a no-op — complex conditional

**Verdict:** ❌ Rejected — adds latency and complexity with no meaningful benefit

---

### Option C: Liquid-side CSS variable injection

In the `.liquid` blocks, read `{{ settings.colors_accent_1 }}` and inject `<style>:root { --bundle-global-primary-button: ... }</style>`.

**Pros:** Zero server changes, always up-to-date with current theme

**Cons:**
- Cannot conditionally apply by plan (plan check is server-side)
- Shadow DOM in the widget means `:root` vars from the storefront aren't accessible inside the widget
- Theme color key names are not standardized across all themes

**Verdict:** ❌ Rejected — technically unsound

---

## Decision: Option A

No plan check in the CSS hot path. Theme colors stored as a JSON field on `DesignSettings`, fetched via Shopify Admin GraphQL at install time and on "Sync Bundle". Passed as a fallback layer to `generateCSSFromSettings` — theme colors are used only when no explicit DCP value is set for that anchor.

---

## Data Model

### New field on `DesignSettings`

```prisma
model DesignSettings {
  // ... existing fields ...
  themeColors Json?    // ← NEW: Cached Shopify theme colors for color inheritance
}
```

**Shape at runtime:**
```typescript
interface ThemeColors {
  globalPrimaryButton: string;  // e.g. "#1A56DB"
  globalButtonText: string;     // e.g. "#FFFFFF"
  globalPrimaryText: string;    // e.g. "#111827"
  globalSecondaryText: string;  // e.g. "#6B7280"
  globalFooterBg: string;       // e.g. "#F9FAFB"
  globalFooterText: string;     // e.g. "#111827"
  syncedAt: string;             // ISO 8601
}
```

`null` (existing rows) → falls through to hardcoded defaults. No migration.

---

## Shopify Admin GraphQL Queries

### Step 1 — Find active theme ID
```graphql
query GetActiveTheme {
  themes(first: 5, roles: [MAIN]) {
    nodes {
      id
    }
  }
}
```

### Step 2 — Fetch settings_data.json
```graphql
query GetThemeColors($themeId: ID!) {
  theme(id: $themeId) {
    files(filenames: ["config/settings_data.json"]) {
      nodes {
        filename
        body {
          ... on OnlineStoreThemeFileBodyText {
            content
          }
        }
      }
    }
  }
}
```

### Color key mapping from `settings_data.json > current`

| `settings_data.json` key | Bundle anchor | Hardcoded fallback |
|--------------------------|--------------|-------------------|
| `colors_accent_1` | `globalPrimaryButton` | `#000000` |
| `colors_solid_button_labels` | `globalButtonText` | `#FFFFFF` |
| `colors_text` | `globalPrimaryText` | `#000000` |
| `colors_secondary_button_labels` | `globalSecondaryText` | `#6B7280` |
| `colors_background_1` | `globalFooterBg` | `#FFFFFF` |
| `colors_text` | `globalFooterText` | `#000000` |

---

## Files to Modify

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `themeColors Json?` to `DesignSettings` model |
| `app/services/theme-colors.server.ts` | **CREATE** — `syncThemeColors(admin, shopDomain)` |
| `app/lib/css-generators/index.ts` | Add optional `themeColors` param to `generateCSSFromSettings`; use as fallback in anchor resolution |
| `app/routes/api/api.design-settings.$shopDomain.tsx` | Pass `designSettings.themeColors` to `generateCSSFromSettings` |
| `app/shopify.server.ts` | Call `syncThemeColors` in `afterAuth` hook |
| `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts` | Call `syncThemeColors` at end of `handleSyncBundle` |
| `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/handlers.server.ts` | Same |
| `shopify.app.toml` | Add `read_themes` to scopes |
| `shopify.app.wolfpack-product-bundles-sit.toml` | Add `read_themes` to scopes |
| `.env.example` | Add `read_themes` to SCOPES comment |

---

## `app/services/theme-colors.server.ts` — New Service

```typescript
import type { ShopifyAdmin } from "../lib/auth-guards.server";
import { prisma } from "../db.server";
import { AppLogger } from "../lib/logger";
import { BundleType } from "../constants/bundle";

export interface ThemeColors {
  globalPrimaryButton: string;
  globalButtonText: string;
  globalPrimaryText: string;
  globalSecondaryText: string;
  globalFooterBg: string;
  globalFooterText: string;
  syncedAt: string;
}

const COLOR_MAP: Record<string, keyof Omit<ThemeColors, "syncedAt">> = {
  colors_accent_1:               "globalPrimaryButton",
  colors_solid_button_labels:    "globalButtonText",
  colors_text:                   "globalPrimaryText",
  colors_secondary_button_labels:"globalSecondaryText",
  colors_background_1:           "globalFooterBg",
};

const HARDCODED_DEFAULTS: Record<keyof Omit<ThemeColors, "syncedAt">, string> = {
  globalPrimaryButton: "#000000",
  globalButtonText:    "#FFFFFF",
  globalPrimaryText:   "#000000",
  globalSecondaryText: "#6B7280",
  globalFooterBg:      "#FFFFFF",
  globalFooterText:    "#000000",
};

/** Validates a CSS hex color (3, 4, 6, or 8 hex chars, with or without alpha) */
function isValidHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9A-Fa-f]{3,8}$/.test(value.trim());
}

/**
 * Fetches the active Shopify theme's color settings and stores them
 * in the DesignSettings records for both bundle types for the shop.
 * Silent failure — never throws; errors are logged.
 */
export async function syncThemeColors(admin: ShopifyAdmin, shopDomain: string): Promise<void> {
  try {
    // Step 1: Find active (MAIN role) theme
    const themeListResult = await admin.graphql(`
      query GetActiveTheme {
        themes(first: 5, roles: [MAIN]) {
          nodes { id }
        }
      }
    `);
    const themeListData = await themeListResult.json();
    const themeId: string | undefined = themeListData?.data?.themes?.nodes?.[0]?.id;

    if (!themeId) {
      AppLogger.warn("syncThemeColors: no active theme found", { shopDomain });
      return;
    }

    // Step 2: Fetch settings_data.json from active theme
    const settingsResult = await admin.graphql(`
      query GetThemeColors($themeId: ID!) {
        theme(id: $themeId) {
          files(filenames: ["config/settings_data.json"]) {
            nodes {
              filename
              body {
                ... on OnlineStoreThemeFileBodyText { content }
              }
            }
          }
        }
      }
    `, { variables: { themeId } });
    const settingsData = await settingsResult.json();
    const fileContent: string | undefined =
      settingsData?.data?.theme?.files?.nodes?.[0]?.body?.content;

    if (!fileContent) {
      AppLogger.warn("syncThemeColors: settings_data.json not found", { shopDomain, themeId });
      return;
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(fileContent);
    } catch {
      AppLogger.warn("syncThemeColors: failed to parse settings_data.json", { shopDomain });
      return;
    }

    const current = (parsed?.current ?? {}) as Record<string, unknown>;

    // Build themeColors object — fallback per-key for missing/invalid values
    const themeColors: ThemeColors = { ...HARDCODED_DEFAULTS, syncedAt: new Date().toISOString() };
    for (const [shopifyKey, anchor] of Object.entries(COLOR_MAP)) {
      const val = current[shopifyKey];
      if (isValidHexColor(val)) {
        themeColors[anchor] = val;
      }
    }
    // globalFooterText mirrors globalPrimaryText (same key in Shopify: colors_text)
    themeColors.globalFooterText = themeColors.globalPrimaryText;

    // Step 3: Upsert themeColors on DesignSettings for both bundle types
    for (const bundleType of [BundleType.PRODUCT_PAGE, BundleType.FULL_PAGE]) {
      await prisma.designSettings.upsert({
        where: { shopId_bundleType: { shopId: shopDomain, bundleType } },
        create: { shopId: shopDomain, bundleType, themeColors },
        update: { themeColors },
      });
    }

    AppLogger.info("syncThemeColors: theme colors synced", { shopDomain, themeColors });
  } catch (error: unknown) {
    // Silent — never propagate; theme color sync is non-critical
    AppLogger.warn("syncThemeColors: unexpected error (non-critical)", { shopDomain }, error as Error);
  }
}
```

---

## `app/lib/css-generators/index.ts` — Updated Signature

```typescript
export function generateCSSFromSettings(
  settings: CSSDesignSettings,
  bundleType: string,
  customCss: string = "",
  themeColors?: ThemeColors | null  // ← new optional param
): string {
  // Resolve global anchors: DCP value → theme color → hardcoded default
  const globalPrimaryButton = settings.globalPrimaryButtonColor
    || themeColors?.globalPrimaryButton || '#000000';
  const globalButtonText = settings.globalButtonTextColor
    || themeColors?.globalButtonText || '#FFFFFF';
  const globalPrimaryText = settings.globalPrimaryTextColor
    || themeColors?.globalPrimaryText || '#000000';
  const globalSecondaryText = settings.globalSecondaryTextColor
    || themeColors?.globalSecondaryText || '#6B7280';
  const globalFooterBg = settings.globalFooterBgColor
    || themeColors?.globalFooterBg || '#FFFFFF';
  const globalFooterText = settings.globalFooterTextColor
    || themeColors?.globalFooterText || '#000000';
  // ... rest unchanged
}
```

---

## `api.design-settings.$shopDomain.tsx` — Theme Color Pass-Through

After reading `designSettings`, extract and pass `themeColors`:

```typescript
const themeColors = (designSettings as any)?.themeColors ?? null;
// ...
const css = generateCSSFromSettings(finalSettings, bundleTypeForCSS, customCss, themeColors);
```

No plan check. No extra DB query. Zero hot-path regression.

---

## Migration / Backward Compatibility Strategy

- **No data migration required.** The `themeColors Json?` field defaults to `null` in Prisma.
- Existing `DesignSettings` rows: `themeColors` is `null` → `generateCSSFromSettings` receives `null` → falls through to hardcoded defaults → zero behavior change.
- After first "Sync Bundle" or reinstall, `themeColors` is populated and takes effect.
- Grow plan merchants who have set DCP values: their `globalPrimaryButtonColor` etc. are non-null → `settings.globalPrimaryButtonColor || themeColors?.... || default` resolves to the DCP value → theme colors are bypassed.

---

## `read_themes` Scope Change

```toml
# shopify.app.toml and shopify.app.wolfpack-product-bundles-sit.toml
[access_scopes]
scopes = "read_products,write_products,read_orders,write_orders,read_inventory,read_themes"
```

Existing merchants will see a Shopify re-authorization prompt on next admin visit. This is standard Shopify OAuth behavior.

---

## Testing Strategy

### Test Files to Create

| Test File | Category | What It Covers |
|-----------|----------|----------------|
| `tests/unit/services/theme-colors.test.ts` | Unit | Color extraction, per-key fallback, invalid hex rejection, silent error handling |
| `tests/unit/lib/css-generators/theme-color-inheritance.test.ts` | Unit | `generateCSSFromSettings` with themeColors param: cascade order (DCP → theme → default) |

### Behaviors to Test

**`syncThemeColors`:**
- Given `settings_data.json` has all 5 expected keys → all 6 anchors populated (with `colors_text` copied to both `globalPrimaryText` and `globalFooterText`)
- Given some keys missing → missing keys fall back to hardcoded defaults; others use theme values
- Given a value is not a valid hex (e.g. `"rgb(26, 86, 219)"` or `""`) → that anchor falls back to hardcoded default
- Given no active theme → function returns without writing to DB
- Given `settings_data.json` is malformed JSON → function returns without writing to DB
- Given Admin API throws → function swallows error, logs warn, returns

**`generateCSSFromSettings` with `themeColors`:**
- Given `settings.globalPrimaryButtonColor` is non-null AND `themeColors.globalPrimaryButton` is set → DCP value is used (DCP wins)
- Given `settings.globalPrimaryButtonColor` is null/undefined AND `themeColors.globalPrimaryButton` is set → theme color is used (theme wins)
- Given `settings.globalPrimaryButtonColor` is null AND `themeColors` is null → hardcoded `#000000` default used
- Given `themeColors` is undefined (not passed) → same as null, falls to hardcoded default

### Mock Strategy

- **Mock:** `admin.graphql` (Shopify Admin API client), Prisma `designSettings.upsert`
- **Do NOT mock:** `isValidHexColor` pure function, color mapping logic, JSON parsing
- **Do NOT test:** UI rendering, Liquid blocks

### TDD Exceptions (no tests required)

- `prisma/schema.prisma` field addition
- `shopify.app.toml` scope change
- `afterAuth` hook wiring (one-line call)
- `handleSyncBundle` wiring (one-line call)
