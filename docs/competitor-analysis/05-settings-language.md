# Settings — Language Configurations

**Screenshot:** `29-settings-language.png`

Route: `/brandConfig` → "Language" → Configure

---

## Multilanguage Feature

- **Enable Multilanguage** toggle (checkbox) — requires a paid plan (disabled on free plan)
- **Language selector dropdown** (disabled on free) — 35+ languages supported:
  - Arabic, Bulgarian, Catalan, Chinese (CN), Chinese (TW), Croatian, Czech, Danish, Dutch, Estonian, Finnish, French, Georgian, German, Greek, Hebrew, Hungarian, Indonesian, Italian, Japanese, Korean, Latvian, Lithuanian, Norwegian Bokmål, Polish, Portuguese (BR), Portuguese (PT), Romanian, Russian, Slovak, Slovenian, Spanish, Swedish, Thai, Turkish, Vietnamese, Norwegian
- Active language shown as a button (e.g., "English")

---

## Shared Components

Global text labels used across all bundle templates.

### Cart & Checkout
| Field | Default Value |
|-------|--------------|
| Bundle Contains Label | Items |
| Bundle Original Price Label | Retail Price |
| Bundle Cart Discount Display Label | You Save |

---

## Template Language

Per-template text overrides, organized under "Landing Page Layout" (expandable, with sub-sections):

### Product Card
| Field | Default Value |
|-------|--------------|
| Add Product to Bundle Button | Add To Box |

### Bundle Cart
| Field | Default Value |
|-------|--------------|
| Next Button Text | Next |
| Add Bundle to Cart Button | Add To Cart |
| Total Label | Total |
| View Cart Products Label | View Selected Products |
| Discount Badge Suffix | off |
| Cart Inclusion Title | item(s) |
| Subscription Selection Label | Select Subscription Plan |

### Bundle (General)
| Field | Default Value |
|-------|--------------|
| No Products Available label | No Products Available |
| Choose Options Button | Choose Options |
| Load More Products Button | Load More Products |
| Preparing Bundle Label | Preparing Bundle... |
| Redirecting label | Redirecting... |
| Added Label | Added |
| Add Button Text | Add |
| Review Button Text | Review |
| Select Bundle Products label | Select Bundle Products |

### Additional Sections (visible in nav, not fully enumerated)
- **Popups** — modal/overlay text strings
- **Toasts** — toast notification messages
- **Addons** — free gift / add-on section labels
- **Messages** — dynamic bundle messaging text

---

## Key Observations

- Nearly every piece of visible text in the storefront widget is customizable
- The multilanguage capability (behind a paywall) allows a single bundle configuration to serve multiple store languages — critical for international merchants
- The per-section organization (Cart, Bundle, Product Card, etc.) maps directly to the component hierarchy of the storefront widget
- Default values like "Add To Box" rather than "Add To Bundle" reflect a soft-goods / gifting positioning
