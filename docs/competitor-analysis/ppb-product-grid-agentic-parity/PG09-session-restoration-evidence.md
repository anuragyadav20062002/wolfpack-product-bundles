# PG09: Product Grid Session Restoration

Date: 2026-07-13
Status: Proven on hot-reloaded dev widget `5.0.172`

## EB-first contract

The relevant live PPB Step Flow, Categories, and Rules help content was read
before implementation. It confirms the Step -> Category -> Product hierarchy,
same-view category browsing, mutually exclusive step/category rule modes, and
exact-rule auto-next behavior.

On EB offer `MIX-156854`, the Product Grid storefront restored the existing
offer-scoped session selection after a cache-bypassed hard reload:

- selected item: `18k Pedal Ring - 10 x 1`;
- card action: `Added x1`;
- selected item count: one;
- total: `₹399`;
- grouped card selector: visually reset to `6` while stored variant `10`
  remained selected.

## WPB gap and correction

WPB widget `5.0.171` restored the bundle count and `$399.00` total, but the
grouped ring card still rendered `Add +`. Its initial card key belonged to
variant `6`, while session storage correctly retained variant `10`.

The Product Grid renderer now resolves a grouped card against any positively
selected variant owned by that product and active category. Session payload v2
persists category ownership beside the selected variants. The shared card
therefore receives the stored variant key and quantity only in the category
that owns the selection, so its selected action and subsequent removal target
the actual restored item. The visible selector deliberately remains at the
product's initial variant, matching the directly observed EB behavior.

## Verification

- Red/green behavior coverage:
  `tests/unit/assets/ppb-product-grid-interaction-parity.test.ts`.
- Persistence regression coverage:
  `tests/unit/assets/ppb-session-selection-persistence.test.ts`.
- Focused result: 16 tests passed.
- Raw Product Page source syntax check passed.
- `npm run build:widgets` generated widget `5.0.172`.

Direct desktop replay:

- selected Category 1 grouped variant `10`;
- payload stored variant `48720161276163`, quantity one, category index zero;
- cache-bypassed hard reload restored `Added x1`, one selected item, and
  `$399.00`, while the visible grouped selector reset to `6` like EB;
- the Category 2 card for the same sole configured variant remained `Add +`,
  matching EB's category-scoped selected state.

Direct mobile replay at `390x844x2,mobile,touch`:

- widget version `5.0.172`;
- Category 1 grouped card restored `Added x1` and selector `6`;
- selected drawer retained `18k Pedal Ring - 10 x 1` and `$399.00`;
- grid tracks were `163.5px 163.5px`;
- document and grid horizontal overflow were both zero.

No deployment or deployment wait was used; the running dev extension hot
reloaded the rebuilt asset.
