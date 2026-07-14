# HS15 Selection Return and Removal Evidence

Date: 2026-07-13

## EB baseline

Direct Chrome DevTools inspection at the 390 x 844 mobile viewport confirmed:

- Selecting a product keeps the picker open and updates its selected quantity.
- Closing the picker returns the product to the first available slot.
- Clicking the filled slot does not reopen the picker.
- The filled slot exposes a 22 x 22 remove control at its top-right edge.
- Removing the product immediately restores the empty slot without reopening the picker.

The observed replacement flow is therefore remove, then select another product. No direct filled-slot replacement action was observed.

## WPB comparison

Direct Chrome DevTools inspection confirmed the same slot ordering and removal behavior:

- The selected product returns to the first slot.
- Clicking the filled slot does not open the picker.
- The remove control clears the selection and restores the empty slot immediately.

During this pass, the mobile picker close control was found to be inert. The modal rendered desktop and mobile close buttons, but listener setup attached the shared close behavior only to the first matching element.

## Fix and verification

- Listener setup now attaches `closeModal` to every rendered `.close-button`.
- A behavior test covers both controls without asserting CSS or placement.
- Widget version: `5.0.153`.
- After a cache-bypassing reload, direct Chrome DevTools verification confirmed the live page loaded `5.0.153`; opening the picker and activating `.bw-bs-close-mobile` changed the panel from open to closed.
