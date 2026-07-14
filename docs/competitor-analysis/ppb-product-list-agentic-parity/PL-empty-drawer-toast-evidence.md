# PPB Product List Empty Drawer Toast Evidence

Date: 2026-07-11

Scope: Product Page Bundle Product List only (`PDP_INPAGE` + `CASCADE`).

Evidence files:
- EB desktop: `/private/tmp/ppb-product-list-agentic-parity/PL-empty-drawer-toast/eb-desktop-empty-drawer-pill-click.json`
- WPB desktop: `/private/tmp/ppb-product-list-agentic-parity/PL-empty-drawer-toast/wpb-desktop-empty-drawer-pill-click.json`
- EB mobile: `/private/tmp/ppb-product-list-agentic-parity/PL-empty-drawer-toast/eb-mobile-empty-drawer-pill-click.json`
- WPB mobile: `/private/tmp/ppb-product-list-agentic-parity/PL-empty-drawer-toast/wpb-mobile-empty-drawer-pill-click.json`

## State Tested

1. Clear storefront storage and Cache Storage.
2. Reload the storefront.
3. Wait for Product List rows to render.
4. Click `View Bundle Items` while no products are selected.
5. Measure drawer open state, pill position, and visible toast/message candidates.

## EB Source Of Truth

EB does not show an empty-drawer toast. It toggles the drawer open class while the selected-items drawer remains visually zero-height.

Measured EB desktop state after empty click:
- Drawer class: `gbbMixCascadeCartDrawerContainer gbbMixCascadeCartDrawerContainer--open`.
- Drawer height: `0px`.
- Selected list display: `none`.
- No visible `Add items to your bundle first` toast.

Measured EB mobile state after empty click:
- Drawer class: `gbbMixCascadeCartDrawerContainer gbbMixCascadeCartDrawerContainer--open`.
- Drawer height: `0px`.
- Selected list display: `none`.
- No visible empty-drawer toast.

## WPB Current Result

WPB intentionally follows the user-requested behavior instead of EB's no-op empty-open behavior: the drawer stays closed and a toast tells the shopper to add items first.

Measured WPB desktop state after empty click:
- Drawer class remains closed: `bw-ppb-cascade-selected-drawer wpbMixCascadeCartDrawerContainer`.
- Drawer height: `1px`, from the requested top border.
- Toast text: `Add items to your bundle first`.
- Toast becomes fully visible within `800ms`.

Measured WPB mobile state after empty click:
- Drawer class remains closed: `bw-ppb-cascade-selected-drawer wpbMixCascadeCartDrawerContainer`.
- Drawer height: `1px`, from the requested top border.
- Toast text: `Add items to your bundle first`.
- Toast becomes fully visible within `800ms`.

## Decision

No code change is needed for this state. WPB is intentionally stricter than EB here because the requested product behavior is to show `Add items to your bundle first` when the drawer is opened empty.
