# Product Owner Requirements: Analytics Pixel Toggle

## User Stories with Acceptance Criteria

### Story 1: View pixel status on Analytics page

**As a** merchant
**I want** to see whether UTM pixel tracking is currently enabled
**So that** I know if attribution data is being collected for my store

**Acceptance Criteria:**
- [ ] Given the analytics page loads, when the pixel IS active, then the toggle displays in the ON position with a green "Active" badge
- [ ] Given the analytics page loads, when the pixel is NOT active, then the toggle displays in the OFF position with a grey "Not active" badge
- [ ] Given the analytics page loads, the pixel status is fetched server-side (in the loader) — no client-side flash of wrong state
- [ ] Given the Shopify API returns an error on the status query, then the toggle defaults to OFF with no crash

---

### Story 2: Enable UTM tracking

**As a** merchant
**I want** to enable UTM attribution tracking with one click
**So that** I can start capturing UTM data without developer help

**Acceptance Criteria:**
- [ ] Given the toggle is OFF, when the merchant clicks it, then the toggle enters a loading/disabled state immediately
- [ ] Given the activation succeeds, then the toggle flips to ON with a success toast: "UTM tracking enabled successfully"
- [ ] Given the activation fails because the extension is not deployed, then the toggle stays OFF and shows an error toast: "Tracking could not be enabled. Please deploy the app extension first."
- [ ] Given the activation fails for any other reason, then the toggle stays OFF and shows an error toast: "Failed to enable tracking. Please try again."
- [ ] Given activation is in progress, the toggle must not be clickable a second time

---

### Story 3: Disable UTM tracking

**As a** merchant
**I want** to disable UTM tracking
**So that** I can pause data collection or comply with privacy requirements

**Acceptance Criteria:**
- [ ] Given the toggle is ON, when the merchant clicks it, then the toggle enters a loading/disabled state immediately
- [ ] Given deactivation succeeds, then the toggle flips to OFF with a success toast: "UTM tracking disabled"
- [ ] Given deactivation fails, then the toggle stays ON and shows an error toast: "Failed to disable tracking. Please try again."

---

### Story 4: Remove automatic pixel activation on install

**As a** merchant
**I want** my store not to have tracking activated without my knowledge
**So that** I maintain control over what data is collected

**Acceptance Criteria:**
- [ ] Given a new app install, the pixel is NOT automatically activated (afterAuth no longer calls activateUtmPixel)
- [ ] Given an existing install where the pixel was previously auto-activated, the toggle correctly shows ON on first page load
- [ ] Given the merchant has never enabled the pixel, the analytics page shows empty state data (existing behaviour) and the toggle is OFF

---

## UI/UX Specifications

### Pixel Status Card

**Placement:** Top of the analytics page, above the date picker and chart — so it's the first thing a merchant sees.

**Component:** Polaris `Card` containing a horizontal layout:
- Left: `Text` — **"UTM Pixel Tracking"** (heading) + subtext below
- Right: Polaris `Button` used as a toggle (or native `input type="checkbox"` styled) — prefer `SettingToggle` layout pattern if available, otherwise a labelled `Button`

**Subtext when OFF:** "Enable tracking to capture UTM parameters from visitor sessions and attribute orders to campaigns."
**Subtext when ON:** "Tracking is active. UTM parameters are captured and attributed to orders at checkout."

**Status badge:**
- ON: `<Badge tone="success">Active</Badge>`
- OFF: `<Badge tone="new">Not active</Badge>` (grey)

**Button label:**
- When OFF: "Enable tracking"
- When ON: "Disable tracking"
- While loading: button is `loading` + `disabled`

### Toast Messages

| Scenario | Message | isError | Duration |
|----------|---------|---------|----------|
| Enable success | "UTM tracking enabled successfully" | false | default (3s) |
| Enable fail — extension not deployed | "Tracking could not be enabled. Deploy the app extension first via Shopify CLI." | true | 6000ms |
| Enable fail — other | "Failed to enable tracking. Please try again." | true | 5000ms |
| Disable success | "UTM tracking disabled" | false | default (3s) |
| Disable fail | "Failed to disable tracking. Please try again." | true | 5000ms |

Use `shopify.toast.show(message, { isError, duration })` (App Bridge pattern — consistent with existing routes).

---

## Data Persistence

- **No new DB columns.** Pixel state is fetched live from Shopify's Admin API (`webPixel { id }` query) in the loader.
- The loader returns `pixelActive: boolean` and optionally `pixelId: string | null`.
- The action handler enables or disables by calling service functions.

---

## Backward Compatibility Requirements

- Shops that previously had the pixel auto-activated will see the toggle in ON state because the loader reads live from Shopify API.
- No migration needed — existing data is unaffected.
- Removing auto-activation from `afterAuth` is safe: existing active pixels remain active (they're stored in Shopify, not in-memory).

---

## Out of Scope (explicit)

- Granular per-event tracking controls
- GDPR consent banner integration
- Pixel status history or audit log
- Any changes to the pixel extension's event-capture logic
