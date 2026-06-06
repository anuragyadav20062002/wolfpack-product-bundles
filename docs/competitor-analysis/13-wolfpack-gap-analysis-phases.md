# Wolfpack vs EB | Easy Bundle Builder — Critical Gap Analysis

**Analysis date:** 2026-04-24  
**EB source:** 35-screenshot crawl of `prod.frontend.giftbox.giftkart.app`  
**Wolfpack source:** Live crawl of `wolfpack-product-bundle-app.onrender.com` (store: yash-wolfpack)

---

## Executive Summary

Wolfpack is a technically sound bundle builder with a correct Cart Transform implementation, an innovative UTM attribution layer, and competitive pricing. But when placed side-by-side with EB, it reads like a v0.1 of what EB has spent 2+ years building. The gaps are not trivial UI polish — they are deep functional holes in onboarding, customization, feature breadth, and ecosystem. EB converts merchants before Wolfpack has even explained what it does. The analysis below is structured as an honest product audit, not a marketing comparison.

---

## Wolfpack Feature Inventory (as crawled)

### App Navigation (5 routes total)
| Route | Page |
|-------|------|
| `/app/dashboard` | Dashboard — bundle list + setup steps |
| `/app/bundles/{type}/configure/{id}` | Bundle editor |
| `/app/design-control-panel` | DCP (mostly locked behind Grow plan) |
| `/app/attribution` | Analytics + UTM tracking |
| `/app/pricing` | Pricing (2 plans) |
| `/app/events` | Updates & FAQs |

### Bundle Types
- Product Page Bundle (displays on existing product page)
- Full Page Bundle (dedicated landing page with tabs)

### Bundle Editor Sections (4 tabs)
| Tab | Controls |
|-----|----------|
| **Step Setup** | Step name, Products/Collections source, Add Products, Conditions (qty/amount rules), Free gift step toggle, Mandatory default product toggle, Clone tab, Delete tab, Add New Tab |
| **Discount & Pricing** | Enable toggle, Discount Type (% Off / Fixed Off / Fixed Price), up to 4 tiered rules (Qty/Amount + operator), Discount Messaging ({{conditionText}}, {{discountText}}, {{bundleName}}), Success Message |
| **Bundle Assets** | Promo Banner (1600×400), Step Tab Icon (100×100), Step Banner (1600×400), Loading GIF, Floating Promo Badge toggle |
| **Pricing Tiers** | 2–4 pill selectors linking to separate Bundle records |

### Bundle Status Options
Active / Draft / Archived / **Unlisted (Ad Campaigns)**

### Design Control Panel
- **Locked behind $9.99/month Grow plan**
- Two locked sections: Landing Page Bundles, Product Bundles
- Custom CSS editor: accessible on free plan (50,000 chars, two tabs: Product Bundles / Landing Page Bundles)

### Analytics
- UTM Pixel Tracking toggle (active/disable)
- Bundle Revenue section: Revenue, Orders, AOV, % Revenue from Bundles, Revenue Trend chart, Revenue by Bundle table
- UTM Attribution section: Total Ad Revenue, Attributed Orders, Avg Order Value, Revenue Trend chart, Revenue by Platform table
- Date range picker (Last 30 days default)

### Pricing
| Plan | Price | Limits |
|------|-------|--------|
| **Free** | $0 | 10 bundles, basic discount rules, standard support, no DCP |
| **Grow** | $9.99/month | 20 bundles, advanced discounts, DCP, analytics, priority support |

### Support
- Founder ("Parth") directly accessible via tawk.to
- Mon–Fri, responds within 1 hour
- No named manager concept per plan tier

### Updates & FAQs
- Release notes (V2.3.0: instant metafield cache load)
- FAQs with code snippets (cart property hide fix)

---

## EB Feature Inventory (from docs/competitor-analysis/)

For full detail see files `01` through `12`. Summary highlights relevant to comparison:

- **4 bundle types:** Landing Page, Product Page, Subscription, (implied: Mix & Match)
- **AI bundle creation:** Natural language → full config in under 60 seconds
- **Template library:** 6+ pre-built bundle templates as starting points
- **4 layout templates** in the editor (visual picker)
- **8 sidebar panels:** Step Setup, Free Gift & Add Ons, Messages, Discount & Pricing, Bundle Visibility/Publishing, Bundle Settings, Subscriptions, Template
- **Publishing checklist** with live/pending/incomplete indicators
- **Bundle Settings:** 14+ toggles (show compare price, hide irrelevant variants, track inventory, redirect quick add, cart messaging, checkout redirect, custom execute script)
- **Subscription bundles:** Skio, Appstle, Bold integrations built in
- **Gamified dashboard:** Readiness score (35/100), animated progress
- **DCP fully accessible on FREE plan:** 5 brand colors + 20+ expert element controls (General, Product Card, Bundle Cart, Upsell), Typography, Corner Radius, Image Fit, GIF assets
- **Language configurations:** 35+ languages, 35+ text override fields per section
- **Font settings:** Custom font input
- **Analytics:** Views + Orders + Sales + AOV, Bundle Split chart, Export, date comparison
- **Integrations Hub:** 10 third-party apps documented (subscriptions, reviews, page builders, pre-orders, checkout)
- **Named account manager + photo + Schedule Meeting** CTA at every plan tier including free
- **24/7 Intercom live chat** with proactive messaging on first load
- **Success Suite:** 5-app cross-sell platform ($199–$799/month)
- **Pricing:** Revenue-based tiers, all features on every plan, Free tier up to $500/mo bundle sales

---

## Critical Gaps — Head-to-Head Comparison

### 1. Onboarding & First-Run Experience

| Dimension | EB | Wolfpack | Gap Severity |
|-----------|-----|---------|-------------|
| Bundle creation starting point | AI prompt OR template library (6+ templates) | Blank name field + type picker | 🔴 Critical |
| Time to first bundle | < 2 minutes (AI) | ~15 minutes (manual) | 🔴 Critical |
| Dashboard gamification | Readiness score (35/100), animated progress | Numbered text list | 🟡 Medium |
| Layout template picker | 4 visual layout options | None (layout is fixed per type) | 🟡 Medium |
| Publishing checklist | Step-by-step live/pending indicators | None | 🟡 Medium |

**Verdict:** EB eliminates blank-slate paralysis. Wolfpack drops a new merchant onto a form. This alone accounts for a significant chunk of EB's 350+ reviews — ease of first use creates early wins.

---

### 2. Bundle Feature Depth

| Feature | EB | Wolfpack |
|---------|-----|---------|
| Bundle types | 4 (Landing Page, Product Page, Subscription, Mix & Match) | 2 (Full Page, Product Page) |
| Free gift step | ✅ Dedicated panel | ✅ Toggle on step (no dedicated products) |
| Add-on products (paid upsells within bundle) | ✅ Separate "Free Gift & Add Ons" panel | ❌ Not present |
| Subscription bundles | ✅ (Skio, Appstle, Bold) | ❌ Not present |
| Conditional step logic | ✅ (show/hide steps based on selections) | ❌ Not present |
| "Most Popular" product sorting | ✅ | ❌ |
| Product filtering within steps | ✅ | ❌ |
| Bundle Settings (14+ toggles) | ✅ | ❌ (no equivalent panel) |
| Show compare-at price | ✅ Toggle | ❌ |
| Cart messaging customization | ✅ (bundle name, price, discount display) | ❌ |
| Checkout redirect toggle (checkout vs cart) | ✅ | ❌ |
| Custom execute script on checkout | ✅ | ❌ |
| Pricing Tiers (pill selectors) | ❌ Not present | ✅ Wolfpack exclusive |
| Unlisted (Ad Campaigns) bundle status | ❌ Not present | ✅ Wolfpack exclusive |
| Floating promo badge | ❌ Not present | ✅ Wolfpack exclusive |

**Verdict:** Wolfpack has depth in the ad/performance marketing direction (UTM, Unlisted status, Pricing Tiers) that EB entirely lacks. But EB has 3x the breadth on the storefront side — subscription bundles, add-ons, conditional logic, and product controls are all missing from Wolfpack.

---

### 3. Design Customization

| Dimension | EB | Wolfpack | Gap Severity |
|-----------|-----|---------|-------------|
| DCP accessibility | ✅ Free plan | 🔒 $9.99/month | 🔴 Critical |
| Brand color pickers | 5 global + 20+ expert element | Locked | 🔴 Critical |
| Typography controls | 3 levels (size, weight) | Locked | 🟡 Medium |
| Corner radius controls | Button + Card + Cart | Locked | 🟢 Low |
| Image fit (Cover/Contain/Fill) | ✅ | Locked | 🟢 Low |
| Custom font input | ✅ | Locked | 🟢 Low |
| Custom CSS | ✅ (3 scopes: builder, dummy product, theme) | ✅ (2 scopes: Product / Landing Page) | Parity |
| Language / text overrides | 35+ fields across 35+ languages | ❌ Not present | 🔴 Critical |

**Verdict:** Locking DCP behind a paywall while EB offers it for free is a massive conversion killer at the top of the funnel. Every free-plan Wolfpack merchant sees a "Upgrade to Customize" wall where EB merchants see a full color editor. This reversal needs addressing before anything else.

---

### 4. Analytics

| Dimension | EB | Wolfpack | Gap Severity |
|-----------|-----|---------|-------------|
| Bundle views tracking | ✅ | ❌ | 🟡 Medium |
| Bundle orders + revenue | ✅ | ✅ | Parity |
| Bundle AOV | ✅ | ✅ | Parity |
| UTM attribution | ❌ | ✅ Wolfpack exclusive | **Wolfpack WINS** |
| Export (CSV) | ✅ | ❌ | 🟢 Low |
| Date range comparison | ✅ (compare periods) | ❌ (single range only) | 🟢 Low |
| Bundle Split chart | ✅ | ❌ | 🟢 Low |
| % revenue from bundles | ❌ | ✅ Wolfpack exclusive | **Wolfpack WINS** |

**Verdict:** UTM attribution is genuinely differentiated — EB has nothing comparable. This is Wolfpack's strongest unique feature. The missing piece is bundle views (which requires storefront event tracking).

---

### 5. Pricing Model

| Dimension | EB | Wolfpack | Gap Severity |
|-----------|-----|---------|-------------|
| Free tier gate | Revenue-based ($500/month cap) | Bundle count cap (10 bundles) | 🔴 Critical |
| Free tier feature set | ALL features | Core only (no DCP) | 🔴 Critical |
| Paid plan entry price | $49/month | $9.99/month | Wolfpack advantage |
| Plan count | 4 tiers | 2 tiers | 🟡 Medium |
| Money-back guarantee | 30 days | Not stated | 🟢 Low |
| Free trial on paid plan | 15 days | Not stated | 🟢 Low |
| Revenue scale pricing | Yes (scales with merchant success) | No (fixed per plan) | 🟡 Medium |

**Verdict:** EB's free tier is fundamentally more merchant-friendly. A merchant doing $0 in bundle sales pays nothing AND gets every feature. Wolfpack's free tier locks DCP — merchants are paying to customize a free product. The model creates resentment. The $9.99 Grow price is competitive but the feature gating undermines it.

---

### 6. Support & Relationship

| Dimension | EB | Wolfpack | Gap Severity |
|-----------|-----|---------|-------------|
| Live chat | 24/7 Intercom, proactive first message | tawk.to, Mon–Fri, 1hr response | 🟡 Medium |
| Named contact | Photo + name + schedule meeting at ALL tiers | Founder only (no tier differentiation) | 🟡 Medium |
| Help center / docs | Full help center + blog | Updates & FAQs page (in-app) | 🟡 Medium |
| Setup video | ✅ Embedded demo | ✅ Loom links per bundle type | Near parity |
| Proactive outreach | Intercom message on first load | None | 🟢 Low |

**Verdict:** Wolfpack's founder-direct model is actually a selling point for early merchants — "Chat with Parth (Founder)" is authentic and differentiated. But it doesn't scale, and it doesn't project the confidence of a named account manager + scheduling. The 24/7 gap hurts for international merchants.

---

### 7. Integrations

| Category | EB | Wolfpack | Gap Severity |
|----------|-----|---------|-------------|
| Subscription apps | Skio, Appstle, Bold | ❌ None | 🔴 Critical |
| Review apps | Judge.me | ❌ None | 🟡 Medium |
| Page builder apps | PageFly, GemPages | ❌ None | 🟢 Low |
| Pre-order apps | Stoq, Zapiet | ❌ None | 🟢 Low |
| UTM / Ad tracking | ❌ None | ✅ Native | **Wolfpack WINS** |
| Integration request CTA | ✅ | ❌ | 🟢 Low |

---

## Implementation Phases

Phases are ordered by **implementation difficulty**, not priority. Address quick wins first to close the largest visible gaps, then build toward architectural changes.

---

### Phase 1 — Quick Wins (1–2 weeks per item, no architectural change)

These are UI/UX, copy, and configuration changes that require no new backend models or integrations.

#### 1.1 Unlock DCP on Free Plan (or reduce the gate)
**Gap:** DCP locked behind $9.99/month while EB gives it free.  
**Fix:** Move basic color + typography controls to free tier. Gate only advanced features (extra CSS, per-bundle overrides) behind Grow. This is a billing/feature-flag change, not a new feature.  
**Impact:** Converts the biggest perceived disadvantage into parity.

#### 1.2 Bundle Settings Panel
**Gap:** No equivalent to EB's 14+ toggles (show compare price, cart messaging, checkout redirect).  
**Fix:** Add a "Bundle Settings" tab to the bundle editor with:
- Show compare-at price (yes/no)
- Cart messaging (show bundle name, show discount, show original price)
- Redirect to checkout vs add to cart toggle
- Hide prices from product cards  
These are CSS/behavior flags, no new data models needed — most likely map to existing metafield fields.

#### 1.3 Publishing Checklist on Dashboard
**Gap:** EB's readiness checklist (live/pending indicators) vs Wolfpack's numbered text list.  
**Fix:** Convert the existing 6-step text guide into interactive checkboxes that evaluate real state (has bundle? has products? has discount? widget placed?). Show a percentage or score. Each incomplete item is a CTA.  
**Impact:** Drives feature adoption depth — same mechanism that drives EB's 350+ reviews.

#### 1.4 Analytics — Add Bundle Views
**Gap:** Wolfpack tracks revenue/orders/AOV but not views. EB shows Views as the top-level KPI.  
**Fix:** Instrument a view event in the widget JS (single `fetch` ping to an analytics endpoint on bundle load). Store in DB, surface in analytics page.  
**Impact:** Views + conversion rate = the metric merchants actually want.

#### 1.5 Analytics — CSV Export
**Gap:** EB has export, Wolfpack doesn't.  
**Fix:** Add an "Export CSV" button to the analytics page that dumps the current date-range data.

#### 1.6 Pricing Page — Free Trial + Money-Back Guarantee
**Gap:** EB prominently shows 15-day trial + 30-day money-back on the Grow plan.  
**Fix:** If Wolfpack offers a trial or guarantee, surface it explicitly on the pricing page. If not, add a 7-day trial. The psychology of zero-risk lowers conversion friction.

#### 1.7 Floating "Request Integration" CTA
**Gap:** EB has a "Request Integration" button that collects feature demand.  
**Fix:** Add a simple Typeform or tally link in the app footer labeled "Request an Integration." No backend needed — just a feedback channel that also generates a mailing list.

---

### Phase 2 — Medium Complexity (2–4 weeks each, new UI panels + minor backend)

These require new React components, new DB fields, and possibly new metafield structures, but no third-party integrations or architectural rewrites.

#### 2.1 Language / Text Override Controls
**Gap:** EB has 35+ text fields across all UI strings (button labels, messages, badge text) in 35+ languages. Wolfpack has none.  
**Fix (Phase 2a — English text overrides):** Add a "Language" section in the DCP with configurable text fields for: Add to Cart, Next Step, Select, Total, Discount badge, Bundle Contains, etc. Store as metafield JSON. Widget reads from metafield at init.  
**Fix (Phase 2b — Multi-language):** Wire to Shopify Markets/language context. This is harder — Phase 3 territory.  
**Impact:** Immediately unlocks non-English merchants and brand-voice customization.

#### 2.2 Bundle Templates / Layout Picker
**Gap:** EB offers 4 layout templates + 6 pre-built bundle templates from which merchants can start. Wolfpack starts from blank.  
**Fix:** Add a template picker to the "Create Bundle" modal — offer 3–4 visual layout cards (Minimal, Classic, Showcase, Tiered). Each pre-populates step count, discount type, and default banner copy. No AI required for MVP.  
**Impact:** Reduces time-to-first-bundle by 80% for first-time merchants.

#### 2.3 Add-on Products / Upsell Step
**Gap:** EB has a "Free Gift & Add Ons" panel for both free gifts and paid upsell add-ons within the bundle flow.  
**Fix:** Add an optional step type "Add-on" that shows products at their regular price as optional additions. Cart Transform already handles mixed mandatory/optional steps — this is a widget + editor UI change.

#### 2.4 Bundle Settings Panel — Messaging & Behavior
**Gap (extended from Phase 1.2):** Deeper controls: product filtering within step, "Most Popular" sorting, hide irrelevant variant images, custom CSS execute script on checkout.  
**Fix:** Extend the Bundle Settings tab. Most controls are metafield flags read by the widget. Product sorting ("Most Popular") requires a sort attribute on the step products array.

#### 2.5 DCP — Expert Color Controls
**Gap:** EB has 20+ individual element-level color pickers organized in 4 sub-tabs (General, Product Card, Bundle Cart, Upsell) in addition to 5 global brand colors.  
**Fix:** Add an "Expert Colors" collapsible section to the DCP with individual hex pickers for: progress bar, discount badge background, step tab active/inactive, add button hover, cart total, etc. Map each to a CSS variable in the widget stylesheet.

#### 2.6 Analytics — Date Comparison Mode
**Gap:** EB allows comparing current period vs prior period.  
**Fix:** Add a "vs previous period" toggle to the date picker. Calculate prior period stats server-side and show delta indicators (↑ ↓) on each KPI card.

#### 2.7 Integrations Page (Documentation Hub)
**Gap:** EB has a dedicated Integrations Hub with setup guides for 10+ apps.  
**Fix:** Add an `/app/integrations` route with cards for: Judge.me, Yotpo, Recharge, Klaviyo, PageFly. Each card links to a setup guide (can be a Notion doc or markdown page initially). Add "Request Integration" CTA.  
**Impact:** No code needed for the integrations themselves — just documentation positioning. Signals ecosystem maturity.

#### 2.8 Named Contact Scaling (Simulated Tier Differentiation)
**Gap:** EB shows a named account manager at every plan tier. Wolfpack only shows the founder.  
**Fix:** For the Free plan, keep "Chat with Parth." For the Grow plan, surface a different named contact (can be same person with different framing: "Your Dedicated Success Manager"). Show photo + name + "Schedule a 30-min call" Calendly link. The differentiation creates perceived value for upgrading.

---

### Phase 3 — High Effort / Architectural (1–3 months each)

These require new data models, third-party API integrations, or significant architectural changes.

#### 3.1 AI-Assisted Bundle Creation
**Gap:** EB generates a full bundle configuration from a single natural-language prompt (AI loading screen, bundle name, step structure, discount rule, template selection).  
**Implementation:** 
- Build a `/api/ai-create-bundle` endpoint using Claude API (or OpenAI).  
- Prompt engineering: system prompt with Wolfpack bundle schema, merchant provides "describe your bundle in plain English."  
- AI outputs: bundle name, description, step count, product categories per step, suggested discount type and value.  
- UI: Replace/augment "Create Bundle" modal with an AI tab ("Describe your bundle") and a manual tab.
**Complexity:** The API call is straightforward. The hard part is translating AI output into a valid bundle creation that includes product selection (AI can suggest categories, not specific product IDs).

#### 3.2 Subscription Bundle Type
**Gap:** EB supports subscription bundles via Skio, Appstle, and Bold integrations. Wolfpack has no subscription support.  
**Implementation:**
- Add "Subscription Bundle" as a third bundle type.  
- Cart Transform must apply Shopify selling plan to the parent line item.  
- Requires integration with at least one subscription app (Recharge is the largest gap — EB doesn't support it, creating a differentiation opportunity).  
- Widget needs a "Subscribe & Save" toggle per step with selling plan selector.
**Complexity:** High — Shopify's subscription APIs (selling plans, selling plan groups) require additional scopes and careful Cart Transform coordination.

#### 3.3 Multi-Language Support
**Gap:** EB supports 35+ languages via Shopify Markets + per-field text overrides. Wolfpack has no language awareness.  
**Implementation:**
- Instrument the widget to read `Shopify.locale` on init.  
- Store per-locale text override maps in the bundle metafield.  
- DCP Language tab: merchant configures strings per detected language.  
- Full Markets integration requires using Shopify's `@shopify/i18n` patterns.
**Complexity:** High — involves metafield schema changes, widget i18n logic, and DCP multi-locale editing UI.

#### 3.4 Conditional Step Logic
**Gap:** EB can show/hide steps based on selections in prior steps (e.g., "if customer selects product X, show Step 3").  
**Implementation:**
- New data model: `StepCondition { stepId, triggerStepId, triggerProductId, operator, action }`.  
- Widget must evaluate conditions on each product selection change.  
- Editor UI: condition builder per step (similar to current Conditions panel but referencing other steps).
**Complexity:** High — requires new DB schema, widget state machine changes, and a non-trivial condition builder UI.

#### 3.5 Revenue-Based Free Tier (Pricing Model Rethink)
**Gap:** EB's free tier is capped by bundle revenue ($500/month) not bundle count. This feels fairer — you pay when you earn. Wolfpack's 10-bundle cap is opaque to merchants who haven't launched yet.  
**Implementation:**
- Track total bundle revenue in Wolfpack's analytics pipeline (already partially in place via UTM attribution).  
- Change billing trigger from "bundle count" to "bundle revenue threshold."  
- Requires a Shopify webhook to receive order data and attribute revenue to bundles.
**Complexity:** Medium-High — billing model changes are high-stakes and require Shopify Billing API adjustments, but the analytics infrastructure is partially built.

#### 3.6 Progress Bar in Bundle Cart / Gamified Discount Threshold
**Gap:** EB shows a real-time progress bar in the bundle cart showing how close the customer is to the next discount tier (e.g., "Add 1 more item to save 10%"). This is EB's highest-converting UX pattern.  
**Implementation:**
- Bundle cart needs a progress bar component that calculates: current qty/amount vs threshold of next rule.  
- Already have the discount rule data in the widget config.  
- Widget update: render progress bar in cart section when tiered rules exist.  
- DCP: color control for progress bar fill.
**Complexity:** Medium — the data is available, the widget needs a new UI component and calculation logic.

---

## Wolfpack Unique Advantages (Defend and Amplify)

These are areas where Wolfpack is ahead of EB. They should be actively marketed and protected.

| Feature | Wolfpack | EB | Recommendation |
|---------|---------|-----|---------------|
| **UTM Attribution** | Native pixel tracking + platform breakdown | Not present | Market this explicitly — "Track which ads drive bundle revenue." No competitor has this. |
| **Ad-Ready Bundle Status** | "Unlisted (Ad Campaigns)" status | Not present | Double down — add UTM parameter auto-appender in the dashboard, "Copy Ad URL" button |
| **Pricing Tiers** | 2–4 pill selectors linking to separate bundles | Not present | Add visual demo to the pricing/features page |
| **Simpler Pricing** | $9.99/month Grow | $49/month Essential | Lead with this in App Store copy |
| **Founder Access** | Direct chat with founder | Named manager (scale) | Lean into "indie, founder-led" positioning for early-stage merchant ICP |
| **% Revenue from Bundles** | Native KPI | Not present | Surface this prominently — it's a compelling "bundle ROI" metric |
| **Floating Promo Badge** | Configurable per bundle | Not present | Promote as a conversion tool |

---

## Priority Matrix (Impact vs Effort)

```
HIGH IMPACT
    |
    |  [3.6 Progress Bar]    [1.1 Unlock DCP]    [1.3 Publishing Checklist]
    |  [3.1 AI Creation]     [2.1 Language]       [1.2 Bundle Settings]
    |
    |  [3.2 Subscriptions]   [2.2 Templates]      [1.4 Views Analytics]
    |
    |  [3.4 Conditional]     [2.6 Date Compare]   [1.5 CSV Export]
    |
LOW IMPACT
    +------------------------------------------>
         HIGH EFFORT              LOW EFFORT
```

**Immediate actions (high impact, low effort):**
1. Unlock DCP colors on free plan
2. Add publishing checklist (gamified score)
3. Add bundle views tracking
4. Add bundle settings panel with basic toggles

**Next sprint (high impact, medium effort):**
5. English text override controls (Language Phase 2a)
6. Bundle templates / layout picker
7. Progress bar in cart for tiered discounts
8. Integrations documentation page

**Quarter roadmap (high impact, high effort):**
9. AI-assisted bundle creation
10. Subscription bundle type
11. Revenue-based pricing model

---

## Conclusion

Wolfpack has two genuine differentiators worth defending: UTM attribution and the ad-ready bundle infrastructure (Unlisted status, Pricing Tiers). Every other dimension is behind EB.

The most dangerous gap is not features — it is **first-run experience**. EB turns a merchant into a successful bundle creator in under 2 minutes with AI. Wolfpack gives them a blank form. This gap is felt before any feature comparison happens and is likely the primary driver of churn at trial.

The second most dangerous gap is the **DCP paywall**. Merchants comparing apps will install both, see EB's full-featured free customization editor, and immediately perceive Wolfpack as the lesser product — even though the underlying bundle quality is comparable.

Fix first-run and the DCP gate, then build toward feature depth. The ad/performance marketing angle (UTM + Unlisted + Pricing Tiers) should anchor the positioning story: Wolfpack is the bundle app built for performance marketers who run paid ads, while EB is built for content-led DTC brands.
