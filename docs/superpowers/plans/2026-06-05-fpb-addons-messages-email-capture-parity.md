# FPB Add-ons and Messages Email Capture EB Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild FPB `Free Gift & Add Ons` and `Messages` so Admin, SaveBar, storefront capture, and cart properties match EB for Landing Page bundles, with email capture but no outbound delivery.

**Architecture:** Keep the FPB configure route as the Admin source of truth and persist direct `personalizationData` through the existing `saveBundle` handler. Extend the FPB widget to render and validate email capture fields from `personalizationData.giftMessage`, then include the captured values on the gift-message cart line.

**Tech Stack:** Remix route module, Shopify App Bridge SaveBar, Polaris web components, raw FPB storefront widget JS, Jest/ts-jest unit tests, Chrome DevTools MCP.

---

## File Structure

- Modify: `docs/issues-prod/fpb-addons-messages-email-capture-parity-1.md`
  - Progress log and completion notes.
- Create: `test-spec/fpb-addons-messages-email-capture-parity.spec.md`
  - TDD session contract and acceptance checklist.
- Modify: `tests/unit/routes/fpb-addons-admin-layout.test.ts`
  - Admin source-contract tests for EB card/control markers and SaveBar dirty wiring.
- Modify: `tests/unit/routes/fpb-save-bundle.test.ts`
  - Handler-level persistence test for direct `personalizationData.giftMessage.isEmailEnabled`.
- Modify: `tests/unit/services/bundle-product-metafield.test.ts`
  - Metafield/config emission test for email-enabled `personalizationData.giftMessage`.
- Modify: `tests/unit/assets/bundle-widget-full-page-messages.test.ts`
  - Widget source-contract tests for email capture fields, validation, and cart properties.
- Modify: `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`
  - Admin draft state, serialization, Messages UI, Add-ons UI polish, and SaveBar dirty/discard behavior.
- Modify: `app/styles/routes/full-page-bundle-configure.module.css`
  - EB-specific layout styles only where Polaris web components cannot match the current EB visual evidence.
- Modify: `app/assets/bundle-widget-full-page.js`
  - Storefront gift-message email capture state, render, validation, and cart property emission.
- Modify after widget build: `extensions/bundle-builder/assets/bundle-widget-full-page.js`
  - Built FPB widget output from `npm run build:widgets`.
- Modify if CSS changes: `extensions/bundle-builder/assets/bundle-widget-full-page.css`
  - Minified FPB widget CSS output from `npm run minify:assets css`.
- Modify if widget source changes: `scripts/build-widget-bundles.js`
  - Patch bump `WIDGET_VERSION` before widget deploy-ready assets are built.
- Modify if fresh EB facts are learned: `internal docs/EB Implementation Reference.md`
  - Add the email capture field/property names discovered during Chrome audit.

## Task 1: Fresh EB Evidence Gate

**Files:**
- Modify if new facts are discovered: `internal docs/EB Implementation Reference.md`
- Modify: `docs/issues-prod/fpb-addons-messages-email-capture-parity-1.md`

- [ ] **Step 1: Open EB FPB Messages in Chrome DevTools**

Navigate to the authenticated EB Landing Page bundle configure flow and open `Messages`.

Required evidence to capture:
- Admin labels and control order.
- `Send message through email` toggle behavior.
- Any recipient email, delivery date, or template controls exposed after toggling email.
- `Customize Emails` click behavior.
- Network payload for saving with email enabled.
- Storefront DOM/runtime field names after save.
- Cart payload/property names after shopper enters message/email data.

- [ ] **Step 2: Read all visible EB help links**

Click every visible `How to setup`, `Learn More`, `?`, or similar help link in these sections before implementation:
- `Free Gift & Add Ons`
- `Messages`
- Email-related controls under `Messages`

If a popup opens, capture and read the popup content. If a new tab opens, fetch/read the page content and summarize the behavior in the issue log.

- [ ] **Step 3: Update EB reference if the audit finds new facts**

Add a concise note under `FPB Messages Personalization Contract` in `internal docs/EB Implementation Reference.md`.

Expected note content:

```markdown
2026-06-05 email-capture update:
- Admin controls observed: Send message through email toggle, Customize Emails action, and any recipient-email/date controls found during the audit.
- Saved keys observed: list the exact `personalizationData.giftMessage` keys copied from the network payload.
- Storefront classes/properties observed: list the exact DOM classes and runtime keys copied from the storefront capture.
- Cart properties observed: list the exact private cart properties emitted for message/email/date values.
- Help content observed: summarize each visible Messages/Add-ons help popup or linked page.
Outbound delivery was not implemented in WPB; this slice captures data only.
```

- [ ] **Step 4: Update issue progress**

Append the EB audit result to `docs/issues-prod/fpb-addons-messages-email-capture-parity-1.md`.

Expected entry:

```markdown
### 2026-06-05 <current local time from `date '+%H:%M'`> - EB evidence captured
- Captured current EB Add-ons and Messages email behavior.
- Confirmed exact email capture fields and cart property names.
- Updated internal docs if new facts were found.
- Next: write failing tests.
```

## Task 2: Test Spec and RED Tests

**Files:**
- Create: `test-spec/fpb-addons-messages-email-capture-parity.spec.md`
- Modify: `tests/unit/routes/fpb-addons-admin-layout.test.ts`
- Modify: `tests/unit/routes/fpb-save-bundle.test.ts`
- Modify: `tests/unit/services/bundle-product-metafield.test.ts`
- Modify: `tests/unit/assets/bundle-widget-full-page-messages.test.ts`
- Modify: `docs/issues-prod/fpb-addons-messages-email-capture-parity-1.md`

- [ ] **Step 1: Create the test spec**

Create `test-spec/fpb-addons-messages-email-capture-parity.spec.md`:

```markdown
# Test Spec: FPB Add-ons and Messages Email Capture Parity
**Spec ID:** fpb-addons-messages-email-capture-parity  **Issue:** [fpb-addons-messages-email-capture-parity-1]  **Created:** 2026-06-05

## Purpose
Prove FPB Add-ons and Messages match EB's Admin capture, SaveBar, persistence, storefront validation, and cart data behavior. Email capture is stored only; no outbound email is sent.

## Test Cases
### AdminParity
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Messages section exposes EB email capture controls | Route source | Source contains email toggle, recipient email/date markers, and Customize Emails entry | No provider/send code |
| 2 | Free Gift & Add Ons uses EB card/control markers | Route + CSS source | Source/CSS contain all required markers | Existing test extended |
| 3 | Messages/Add-ons controls dirty SaveBar | Route source | Every update path calls dirty helper or uses updater that marks dirty | Prevent silent changes |

### Persistence
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Save persists email-enabled giftMessage | FormData personalizationData | `db.bundle.update.data.personalizationData.giftMessage.isEmailEnabled` is true | Direct JSON contract |
| 2 | Metafield emits email-enabled giftMessage | Bundle config | `bundle_ui_config.personalizationData.giftMessage.isEmailEnabled` is true | Storefront config source |

### Storefront
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Widget renders email capture fields | Email-enabled giftMessage | Recipient email/date field markers present | Exact names from EB evidence |
| 2 | Required validation blocks missing email | Email enabled + required state | Validation helper rejects empty/invalid recipient email | No cart add |
| 3 | Cart line includes captured email values | Shopper enters message/email/date | Gift-message item properties include captured fields | No outbound email |

## Acceptance Criteria
- [ ] All listed unit tests pass.
- [ ] FPB raw widget JS passes `node --check`.
- [ ] Widget build succeeds after version bump.
- [ ] Chrome verifies EB/WPB Admin parity.
- [ ] Chrome verifies WPB storefront desktop and mobile capture behavior.
```

- [ ] **Step 2: Add failing Admin tests**

Append tests to `tests/unit/routes/fpb-addons-admin-layout.test.ts`:

```ts
it("renders EB Messages email capture controls without delivery code", () => {
  [
    "Send message through email to the customer",
    "Customize Emails",
    "isEmailEnabled",
    "recipientEmail",
    "deliveryDate",
  ].forEach((marker) => {
    expect(routeSource).toContain(marker);
  });

  expect(routeSource).not.toContain("sendGiftMessageEmail");
  expect(routeSource).not.toContain("emailProvider");
});

it("keeps Messages and Add-ons updates wired to dirty state", () => {
  [
    "updateAddonDraft",
    "updateGiftMessageDraft",
    "setRuleMessages(prev =>",
    "markAsDirty();",
  ].forEach((marker) => {
    expect(routeSource).toContain(marker);
  });
});
```

- [ ] **Step 3: Add failing save handler test**

Append to `tests/unit/routes/fpb-save-bundle.test.ts` in the main `handleSaveBundle` describe block:

```ts
it("persists email-enabled direct gift message personalization data", async () => {
  getDb().bundle.findUnique.mockResolvedValue({ shopifyProductId: null });
  getDb().bundle.update.mockResolvedValue(makeUpdatedBundle());

  const personalizationData = {
    isPersonalizationEnabled: true,
    giftMessage: {
      isGiftMessageEnabled: true,
      isSenderAndRecipientNameEnabled: true,
      giftMessageCharacterLimit: "120",
      isGiftMessageMandatory: true,
      isVideoMessageEnabled: false,
      isEmailEnabled: true,
      messageProduct: {
        isMessageProductEnabled: true,
        status: "unlisted",
        product: {
          id: "gid://shopify/Product/8600867012804",
          title: "Message",
          variants: [{ id: "gid://shopify/ProductVariant/46177973534916", price: "0.00" }],
        },
      },
    },
  };

  const res = await handleSaveBundle(
    MOCK_ADMIN,
    MOCK_SESSION,
    "bundle-1",
    makeFormData({ personalizationData: JSON.stringify(personalizationData) }),
  );

  expect(res.status).toBe(200);
  expect(getDb().bundle.update).toHaveBeenCalledWith(expect.objectContaining({
    data: expect.objectContaining({ personalizationData }),
  }));
});
```

- [ ] **Step 4: Add failing metafield test**

Extend `tests/unit/services/bundle-product-metafield.test.ts` by changing the existing direct message personalization test fixture to use `isEmailEnabled: true`, and add assertions:

```ts
expect(parsed.personalizationData.giftMessage.isEmailEnabled).toBe(true);
expect(parsed.personalizationData.giftMessage.isVideoMessageEnabled).toBe(false);
```

- [ ] **Step 5: Add failing widget tests**

Append to `tests/unit/assets/bundle-widget-full-page-messages.test.ts`:

```ts
it("renders EB email capture fields when message email is enabled", () => {
  const source = widgetSource();

  expect(source).toContain("giftMessage.isEmailEnabled === true");
  expect(source).toContain("gbbGiftMessageV2EmailField");
  expect(source).toContain("gbbGiftMessageV2DeliveryDateField");
  expect(source).toContain("Enter a recipient email address here...");
});

it("validates required recipient email before cart add when email capture is enabled", () => {
  const source = widgetSource();

  expect(source).toContain("validateGiftMessageEmailBeforeCart()");
  expect(source).toContain("Please enter a valid email address");
  expect(source).toContain("this.setGiftMessageEmailValidationError(true)");
});

it("adds captured recipient email and delivery date to the message cart line", () => {
  const source = widgetSource();

  expect(source).toContain("'_gift_recipient_email'");
  expect(source).toContain("'_gift_delivery_date'");
  expect(source).not.toContain("fetch('/apps/product-bundles/email");
});
```

- [ ] **Step 6: Verify RED**

Run:

```bash
npx jest --selectProjects unit tests/unit/routes/fpb-addons-admin-layout.test.ts tests/unit/routes/fpb-save-bundle.test.ts tests/unit/services/bundle-product-metafield.test.ts tests/unit/assets/bundle-widget-full-page-messages.test.ts
```

Expected: FAIL because route/widget do not yet contain email capture state, validation, or cart property markers.

## Task 3: Admin Draft State and Save Serialization

**Files:**
- Modify: `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`
- Modify: `tests/unit/routes/fpb-addons-admin-layout.test.ts`
- Modify: `tests/unit/routes/fpb-save-bundle.test.ts`

- [ ] **Step 1: Expand gift message draft helpers**

In `route.tsx`, update `buildGiftMessageDraftFromPersonalizationData()` to include:

```ts
isEmailEnabled: giftMessage?.isEmailEnabled === true,
recipientEmailRequired: giftMessage?.recipientEmailRequired !== false,
deliveryDateEnabled: giftMessage?.deliveryDateEnabled === true,
customizeEmailsEnabled: giftMessage?.customizeEmailsEnabled === true,
```

Use the exact keys from Task 1 EB evidence if different.

- [ ] **Step 2: Serialize email capture fields**

In `buildGiftMessageConfigFromDraft()`, replace `isEmailEnabled: false` with:

```ts
isEmailEnabled: giftMessageDraft.isEmailEnabled === true,
recipientEmailRequired: giftMessageDraft.recipientEmailRequired !== false,
deliveryDateEnabled: giftMessageDraft.deliveryDateEnabled === true,
customizeEmailsEnabled: giftMessageDraft.customizeEmailsEnabled === true,
```

Keep `isVideoMessageEnabled: false`.

- [ ] **Step 3: Ensure dirty dependencies include expanded draft**

Confirm `giftMessageDraft` remains in the `handleSave` dependency list and the dirty/discard comparison path. If any new state is split outside `giftMessageDraft`, move it back into `giftMessageDraft` so `updateGiftMessageDraft()` is the single dirtying path.

- [ ] **Step 4: Run focused tests**

Run:

```bash
npx jest --selectProjects unit tests/unit/routes/fpb-save-bundle.test.ts tests/unit/routes/fpb-addons-admin-layout.test.ts
```

Expected: PASS for save serialization, still FAIL for widget email capture until Task 5.

## Task 4: Admin UI Parity and SaveBar Wiring

**Files:**
- Modify: `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`
- Modify: `app/styles/routes/full-page-bundle-configure.module.css`
- Modify: `tests/unit/routes/fpb-addons-admin-layout.test.ts`

- [ ] **Step 1: Replace checkbox-like toggles with EB-matched switch treatment**

For `Free Gift & Add Ons` and `Messages`, use Polaris `s-switch` where it matches EB closely enough. Use custom switch CSS only if fresh EB screenshots show Polaris spacing/state cannot match.

Every control path must call one of:

```ts
updateAddonDraft({ fieldName: nextValue });
updateGiftMessageDraft({ fieldName: nextValue });
markAsDirty();
```

Do not rely on implicit form submit or hidden inputs.

- [ ] **Step 2: Rework `Messages` card**

Keep the existing EB order and add email capture controls:
- Enable Messages.
- Message preview row and Edit button.
- Enable Sender and Recipient Fields.
- Make Gift Message mandatory.
- Enable Message Limit (Characters).
- Enter Message Limit.
- Send message through email to the customer.
- Recipient email/date capture controls if EB shows them in Admin.
- Customize Emails visual entry.

Do not add provider configuration or send actions.

- [ ] **Step 3: Rework `Free Gift & Add Ons` card polish**

Keep the current three-card structure, then align exact EB control behavior from Task 1:
- Add-ons step toggle.
- Icon picker.
- Step Name.
- Step Title.
- Add-ons section toggle.
- Tier add/delete.
- Product picker.
- Variant display toggle.
- Tier rule controls.
- Footer messaging fields.

- [ ] **Step 4: Verify Admin tests**

Run:

```bash
npx jest --selectProjects unit tests/unit/routes/fpb-addons-admin-layout.test.ts
```

Expected: PASS.

- [ ] **Step 5: Validate Polaris component code**

Use Shopify MCP validation for any generated JSX/TSX containing Polaris web components:

```text
validate_component_codeblocks(api="polaris-app-home", extensionTarget omitted, conversationId="419a4f41-9b6d-4dfe-b52f-d1e2cb2baae6")
```

Expected: validation passes. If it fails, fix props/component names and re-run validation.

## Task 5: Storefront Email Capture Runtime

**Files:**
- Modify: `app/assets/bundle-widget-full-page.js`
- Modify: `tests/unit/assets/bundle-widget-full-page-messages.test.ts`

- [ ] **Step 1: Expand widget message state**

Change constructor state from:

```js
this.giftMessageState = { message: '', from: '', to: '', error: false };
```

to:

```js
this.giftMessageState = {
  message: '',
  from: '',
  to: '',
  recipientEmail: '',
  deliveryDate: '',
  error: false,
  emailError: false
};
```

- [ ] **Step 2: Render email capture fields**

In `renderGiftMessageSection(container)`, after sender/recipient name fields and before the message textarea, render email/date inputs when:

```js
giftMessage.isEmailEnabled === true
```

Use EB field class names from Task 1. If EB evidence does not provide a date field, render only recipient email.

- [ ] **Step 3: Add email validation helper**

Add:

```js
validateGiftMessageEmailBeforeCart() {
  const giftMessage = this.getGiftMessageConfig();
  if (giftMessage?.isEmailEnabled !== true) return true;

  const value = (this.giftMessageState.recipientEmail || '').trim();
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  if (isValid) return true;

  this.setGiftMessageEmailValidationError(true);
  return false;
}
```

Use EB validation text from Task 1 if different from `Please enter a valid email address`.

- [ ] **Step 4: Call validation before cart add**

Find the add-to-cart path that currently calls `validateGiftMessageBeforeCart()` and require both validators:

```js
if (!this.validateGiftMessageBeforeCart()) return;
if (!this.validateGiftMessageEmailBeforeCart()) return;
```

- [ ] **Step 5: Add cart properties**

In `buildGiftMessageCartItem()`, add captured properties when email is enabled:

```js
if (giftMessage.isEmailEnabled === true) {
  if (this.giftMessageState.recipientEmail.trim()) {
    properties['_gift_recipient_email'] = this.giftMessageState.recipientEmail.trim();
  }
  if (this.giftMessageState.deliveryDate.trim()) {
    properties['_gift_delivery_date'] = this.giftMessageState.deliveryDate.trim();
  }
}
```

Use EB property names from Task 1 if different.

- [ ] **Step 6: Verify widget tests**

Run:

```bash
npx jest --selectProjects unit tests/unit/assets/bundle-widget-full-page-messages.test.ts
```

Expected: PASS.

## Task 6: Metafield and Full Focused Test Pass

**Files:**
- Modify as needed from previous tasks.

- [ ] **Step 1: Run focused unit suite**

Run:

```bash
npx jest --selectProjects unit tests/unit/routes/fpb-addons-admin-layout.test.ts tests/unit/routes/fpb-save-bundle.test.ts tests/unit/services/bundle-product-metafield.test.ts tests/unit/assets/bundle-widget-full-page-messages.test.ts tests/unit/assets/bundle-widget-full-page-addons.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run raw JS syntax check**

Run:

```bash
node --check app/assets/bundle-widget-full-page.js
```

Expected: no syntax errors.

- [ ] **Step 3: Run ESLint on modified files**

Run:

```bash
npx eslint --max-warnings 9999 app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx app/assets/bundle-widget-full-page.js tests/unit/routes/fpb-addons-admin-layout.test.ts tests/unit/routes/fpb-save-bundle.test.ts tests/unit/services/bundle-product-metafield.test.ts tests/unit/assets/bundle-widget-full-page-messages.test.ts
```

Expected: zero ESLint errors. Warnings are acceptable only if pre-existing.

## Task 7: Widget Build and Version Bump

**Files:**
- Modify: `scripts/build-widget-bundles.js`
- Modify: `extensions/bundle-builder/assets/bundle-widget-full-page.js`
- Modify if CSS changed: `extensions/bundle-builder/assets/bundle-widget-full-page.css`

- [ ] **Step 1: Bump widget version**

In `scripts/build-widget-bundles.js`, increment `WIDGET_VERSION` with a minor version bump because this adds storefront capture behavior.

- [ ] **Step 2: Build widget bundles**

Run:

```bash
npm run build:widgets
```

Expected: build succeeds and updates `extensions/bundle-builder/assets/bundle-widget-full-page.js`.

- [ ] **Step 3: Minify CSS if CSS changed**

Run if `app/styles` or widget CSS changed:

```bash
npm run minify:assets css
```

Expected: CSS remains under Shopify's 100,000 B app-block asset limit.

## Task 8: Chrome DevTools Verification

**Files:**
- Modify: `docs/issues-prod/fpb-addons-messages-email-capture-parity-1.md`

- [ ] **Step 1: Verify Admin parity**

Use Chrome DevTools MCP on:

```text
https://admin.shopify.com/store/wolfpack-store-test-1/apps/wolfpack-product-bundles-sit/app
```

Verify:
- From the SIT app, open an existing Full Page / Landing Page bundle through the bundle list if the direct configure URL is not already known.
- FPB configure page loads through Shopify Admin, not tunnel URL.
- `Free Gift & Add Ons` card order, labels, spacing, toggles, disabled language controls, tier behavior, and footer messaging match EB.
- `Messages` card order, labels, email controls, and `Customize Emails` visual behavior match EB.
- Every toggle/field opens SaveBar.
- Discard restores the previous state.
- Save persists and hides SaveBar.

- [ ] **Step 2: Verify storefront desktop and mobile**

Use desktop 1280x800+ and mobile 390x844.

Verify:
- Add-ons render and unlock/validate as configured.
- Gift message fields render.
- Email capture fields render only when enabled.
- Required message/email validation blocks add-to-cart.
- Cart payload contains captured properties.
- No network request attempts outbound email delivery.

- [ ] **Step 3: Add verification notes to the issue**

Append:

```markdown
### 2026-06-05 <current local time from `date '+%H:%M'`> - Chrome verification complete
- Admin EB/WPB parity checked for Add-ons and Messages.
- Storefront desktop/mobile email capture checked.
- SaveBar open/save/discard checked for all section controls.
- Cart properties checked.
- Outbound email delivery intentionally absent.
```

## Task 9: Graph, Final Status, and Commit

**Files:**
- Modify: `docs/issues-prod/fpb-addons-messages-email-capture-parity-1.md`
- Modify: `graphify-out/GRAPH_REPORT.md`
- Modify: `graphify-out/graph.json`

- [ ] **Step 1: Rebuild graph**

Run:

```bash
python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"
```

Expected: graph rebuild completes. If graphify reports known extraction warnings, note them but do not block unless the graph files are missing/corrupt.

- [ ] **Step 2: Final issue update**

Set issue status to `Completed` only after tests, build, lint, Chrome Admin, and storefront checks pass.

- [ ] **Step 3: Commit**

Stage only files touched by this issue:

```bash
git add docs/issues-prod/fpb-addons-messages-email-capture-parity-1.md test-spec/fpb-addons-messages-email-capture-parity.spec.md tests/unit/routes/fpb-addons-admin-layout.test.ts tests/unit/routes/fpb-save-bundle.test.ts tests/unit/services/bundle-product-metafield.test.ts tests/unit/assets/bundle-widget-full-page-messages.test.ts app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx app/styles/routes/full-page-bundle-configure.module.css app/assets/bundle-widget-full-page.js extensions/bundle-builder/assets/bundle-widget-full-page.js scripts/build-widget-bundles.js graphify-out/GRAPH_REPORT.md graphify-out/graph.json
```

If CSS output changed, also add:

```bash
git add extensions/bundle-builder/assets/bundle-widget-full-page.css
```

Commit:

```bash
git commit -m "[fpb-addons-messages-email-capture-parity-1] feat: match FPB add-ons and messages email capture" -m "Impact: touches FPB configure Admin, direct personalizationData persistence, FPB storefront widget runtime, and widget bundle output" -m "Affected: app/routes/app/app.bundles.full-page-bundle.configure.\$bundleId/route.tsx, app/assets/bundle-widget-full-page.js, extensions/bundle-builder/assets/bundle-widget-full-page.js" -m "Tested by: npx jest --selectProjects unit tests/unit/routes/fpb-addons-admin-layout.test.ts tests/unit/routes/fpb-save-bundle.test.ts tests/unit/services/bundle-product-metafield.test.ts tests/unit/assets/bundle-widget-full-page-messages.test.ts tests/unit/assets/bundle-widget-full-page-addons.test.ts; node --check app/assets/bundle-widget-full-page.js; npx eslint --max-warnings 9999 app/routes/app/app.bundles.full-page-bundle.configure.\$bundleId/route.tsx app/assets/bundle-widget-full-page.js tests/unit/routes/fpb-addons-admin-layout.test.ts tests/unit/routes/fpb-save-bundle.test.ts tests/unit/services/bundle-product-metafield.test.ts tests/unit/assets/bundle-widget-full-page-messages.test.ts; npm run build:widgets; Chrome DevTools Admin/storefront verification"
```

Expected: commit succeeds with the required issue prefix.
