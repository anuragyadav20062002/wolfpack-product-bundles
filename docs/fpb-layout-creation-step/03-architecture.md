# Architecture Decision Record: FPB Layout Selection at Creation Step

## Context
The `fullPageLayout` selection (Floating Cart Card vs Sidebar Panel) lives in the FPB configure page left sidebar (`route.tsx` lines 1516–1623). The Create Bundle modal's server handler (`handlers.server.ts:480`) already reads `fullPageLayout` from formData but the field is never submitted — the UI doesn't exist there yet. We need to move the SVG picker into the Create Bundle modal and remove it from the configure page.

## Constraints
- No Prisma schema changes — `Bundle.fullPageLayout` already exists, has a DB default of `footer_bottom`
- No widget JS changes — widget reads `fullPageLayout` from bundle config, unaffected
- No configure page tab/nav structural changes
- Must work for existing bundles (no migration)
- Modal must remain within Polaris `Modal.Section` constraints (single scrollable section)

## Options Considered

### Option A: Inline SVG cards directly in dashboard modal (Recommended)
Add the layout picker as a new conditional `BlockStack` directly inside the existing `Modal.Section` in `app/routes/app/app.dashboard/route.tsx`. State managed with a new `useState` hook (`fullPageLayout`). Hidden `<input>` passes value to form. Remove Card block from configure page.

**Pros:**
- Minimal scope — two files touched (dashboard route + FPB configure route)
- No new components, no new files — consistent with how bundle type selection is done (also inline in the modal)
- Hidden input pattern already used for `bundleType`
- Conditional rendering (`bundleType[0] === BundleType.FULL_PAGE`) keeps it non-intrusive for PDP bundle creation

**Cons:**
- Dashboard route file gets slightly longer (~90 lines)
- SVG markup is duplicated from configure page until configure page block is deleted (brief, during the same commit)

**Verdict: ✅ Recommended**

---

### Option B: Extract shared `LayoutPicker` React component
Create `app/components/LayoutPicker.tsx`, use it in both places during transition, then remove from configure page.

**Pros:** DRY — single source of SVG markup

**Cons:** Creates a component used in exactly one place (over-engineering; CLAUDE.md explicitly says "Don't create helpers for one-time operations"). The configure page card is deleted in the same change, so there's no lasting duplication.

**Verdict: ❌ Rejected — premature abstraction**

---

### Option C: New dedicated modal step with a stepper UI
Redesign the create modal to have distinct numbered steps (Name → Type → Layout).

**Cons:** Much larger scope; modal stepper pattern requires Polaris `Stepper` workaround (not native); PO requirements don't ask for a stepper.

**Verdict: ❌ Rejected — out of scope**

---

## Decision: Option A — Inline in dashboard modal

The layout picker flows naturally as a `BlockStack` appended after the bundle type selection, conditional on Full Page being selected. Same pattern as type selection cards already in the modal.

## Data Model

No changes. Existing field:
```prisma
// prisma/schema.prisma
fullPageLayout   FullPageLayout?   @default(footer_bottom)

enum FullPageLayout {
  footer_bottom
  footer_side
}
```

TypeScript constant (unchanged):
```typescript
// app/constants/bundle.ts
export enum FullPageLayout {
  FOOTER_BOTTOM = "footer_bottom",
  FOOTER_SIDE = "footer_side",
}
```

## Files to Modify

| File | Change |
|------|--------|
| `app/routes/app/app.dashboard/route.tsx` | Add `fullPageLayout` useState, add SVG picker UI after type selection (conditional on FULL_PAGE), add hidden input |
| `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` | Remove layout Card block (lines 1516–1623) |

No server-side changes needed — `handleCreateBundle` in `handlers.server.ts` already reads `fullPageLayout` from formData at line 410.

## State Changes in Dashboard Route

```typescript
// New state — default matches DB default
const [fullPageLayout, setFullPageLayout] = useState<string>(FullPageLayout.FOOTER_BOTTOM);

// Reset on modal close (alongside existing state resets)
setFullPageLayout(FullPageLayout.FOOTER_BOTTOM);
```

Hidden input added inside `<Form>`:
```tsx
{bundleType[0] === BundleType.FULL_PAGE && (
  <input type="hidden" name="fullPageLayout" value={fullPageLayout} />
)}
```

## Layout Picker UI (in modal, after bundle type selection)

```tsx
{bundleType[0] === BundleType.FULL_PAGE && (
  <BlockStack gap="300">
    <Text variant="headingSm" as="h4">Page Layout</Text>
    <Text variant="bodySm" as="p" tone="subdued">
      Choose where the bundle summary and navigation appears
    </Text>
    <InlineGrid columns={2} gap="300">
      {/* footer_bottom card — SVG from configure page lines 1543–1564 */}
      {/* footer_side card   — SVG from configure page lines 1592–1611 */}
    </InlineGrid>
  </BlockStack>
)}
```

The two cards use `InlineGrid columns={2}` (side-by-side) instead of the configure page's vertical `BlockStack` — better use of modal horizontal space.

## Migration / Backward Compatibility Strategy

No migration needed:
- All existing FPB bundles have `fullPageLayout` set in DB (default `footer_bottom`)
- The configure page removal only removes a UI control — the saved value is unaffected
- Widget continues reading `fullPageLayout` from bundle config metafield — no changes

## Testing Strategy

### TDD Exceptions (no tests required)
- UI-only changes in React/Remix route files (Polaris component rendering)
- CSS/style changes
- SVG markup

### What to verify manually
1. Create a new FPB → layout picker appears after selecting Full Page type
2. Select Sidebar Panel → bundle is created with `fullPageLayout = "footer_side"` (check DB or configure page)
3. Create a new FPB without changing layout selection → bundle created with `fullPageLayout = "footer_bottom"`
4. Create a new PDP bundle → layout picker does NOT appear
5. Load FPB configure page → layout Card is gone
6. Existing FPB bundles still render correctly on storefront (no regression)

### Test Files to Create
None required — this is a pure UI relocation with no new business logic. The server handler already has `fullPageLayout` handling covered.
