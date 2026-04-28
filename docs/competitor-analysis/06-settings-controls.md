# Settings — Additional Configurations (Controls)

**Screenshot:** `30-settings-controls.png`

Route: `/brandConfig` → "Controls" → Configure  
Page title: **"Additional Configurations"**

---

## App Configurations Structure

Left nav within the Controls panel:

1. Landing Page Layout (expandable — layout-specific overrides)
2. Configuration
3. CSS & Scripts
4. Integrations
5. Advanced

---

## Configuration Tab (default / active)

### Bundle Settings

| Setting | Default | Description |
|---------|---------|-------------|
| Show Compare At Price | ✅ On | Displays the original (retail) price alongside bundle price |
| Hide Irrelevant variant images | ❌ Off | Hides variant images that don't match the selected variant |
| Track inventory on Add To Cart (beta) | ❌ Off | Real-time inventory check on add |
| Redirect Collection Page 'Quick Add' to Bundle | ✅ On | Clicking Quick Add on a collection page opens the bundle instead |

### Cart Messaging

Toggle (on/off) for what is displayed in the cart line item for bundle orders:

| Item | Default | Description |
|------|---------|-------------|
| Bundle Items (checkbox) | ✅ On | Shows individual component items within the bundle cart line |
| Original Bundle Price | ✅ On | Shows retail price before bundle discount |
| Discount Display | ✅ On | Shows how much the customer is saving |

**Discount format dropdown:**
- `Amount and percentage` — e.g., *"You save $73.00 (19%)"* (default)
- `Amount only` — e.g., *"You save $73.00"*
- `Percentage only` — e.g., *"You save 19%"*

### Checkout Settings

- **Redirect to Checkout** (default) — add-to-cart sends customer directly to checkout
- **Redirect to Cart** — add-to-cart sends customer to the cart page

**Execute Script** — multiline textarea for custom JS executed at checkout redirect (e.g., for custom tracking or third-party checkout apps)

### Font Settings

- **Custom Font** — text input accepting a Google Fonts name or CSS font-family string
- Note: *"By default, your storefront theme font will be picked."*

---

## CSS & Scripts Tab

### CSS sub-section

Three separate CSS injection points:

| Scope | Description |
|-------|-------------|
| Bundle builder pages | CSS applied only on full-page bundle landing pages |
| Bundle dummy product page | CSS applied to the bundle product page (Shopify product used as the bundle entry point) |
| Theme pages (global) | CSS applied site-wide — "choose classes carefully" |

**Scoping note:** Use `.gbbBundle-HTML` as the parent class selector for bundle-specific CSS to avoid leaking into the rest of the storefront.

### JavaScript & Selectors sub-section (visible in nav)
- Custom JS injection (not fully explored)
- Likely contains CSS selector overrides for theme compatibility

---

## Key Observations

- The three CSS injection scopes are a thoughtful design — they address the common problem of merchants needing different CSS isolation levels
- The `.gbbBundle-HTML` scoping convention is documented in-app, which is good DX
- Execute Script at checkout is an advanced escape hatch for custom tracking / third-party checkout apps (e.g., Gokwik, Shopflo)
- Font inheritance from the theme (default) means zero configuration for most merchants — they get their theme font automatically
- The "Redirect Collection Page Quick Add to Bundle" setting is a smart activation feature — it catches organic collection-page traffic and funnels it through the bundle UX
