# Dashboard & Navigation

**Screenshots:** `01-dashboard-home.png`, `02-dashboard-bottom.png`

---

## Top-Level Navigation

The app exposes the following top-level nav links in the Shopify Admin sidebar:

| Link | Route |
|------|-------|
| EB | Easy Bundle Builder (home) | `/` |
| Analytics | `/analytics` |
| Settings | `/brandConfig` |
| Support | `/help` |
| Pricing | `/pricing` |
| Your Success Suite | `/successsuite` |
| Integrations | `/integrations` |

---

## Dashboard Home

### Hero Section
- Large welcome headline: **"Welcome, Start Building Your Bundle!"**
- Two primary CTAs:
  - **"Create New Bundle"** — opens bundle creation wizard
  - **"View All Bundles"** — navigates to bundle list

### Readiness Score Widget
- Prominent score display: **35 / 100**
- Label: *"Your store isn't ready to process bundle orders"*
- Visual progress indicator
- Checklist of incomplete steps (each step links to the relevant setting)
- **Strategic intent:** Gamification that guides the merchant through setup and increases feature adoption. Score increases as more configuration steps are completed.

### Resources Section (bottom of dashboard)
- Links to: Help Center, Video Tutorials, live chat

---

## Architectural Notes

- **Double-iframe embedding:** The Shopify Admin wraps the app in an iframe; the app itself hosts an additional Intercom iframe. Cross-origin restrictions prevent direct JS access from the parent frame.
- **App host:** `prod.frontend.giftbox.giftkart.app`
- **Auth pattern:** Shopify embedded app with HMAC + JWT `id_token` in every request
- **Intercom live chat:** Embedded proactively — support agent "Sid" sends an opening message automatically. Also accessible from Support page.
