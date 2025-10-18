# Z-Index Hierarchy for Bundle Widget

This document outlines the z-index stacking order for the bundle widget components to ensure proper layering.

## Z-Index Levels

| Component | Z-Index | Location | Purpose |
|-----------|---------|----------|---------|
| **Bundle Modal** | `999999` | [bundle-widget.css:257](../extensions/bundle-builder/assets/bundle-widget.css#L257) | Main modal overlay that covers the entire page |
| **Modal Overlay** | `999998` | [bundle-widget.css:288](../extensions/bundle-builder/assets/bundle-widget.css#L288) | Dark background behind modal content |
| **Modal Content** | `1000000` | [bundle-widget.css:302](../extensions/bundle-builder/assets/bundle-widget.css#L302) | Modal content container |
| **Close Button** | `1000001` | [bundle-widget.css:469](../extensions/bundle-builder/assets/bundle-widget.css#L469) | Close button (X) in modal header |
| **Toast Notifications** | `1000001` | [bundle-widget-full.js:29](../app/assets/bundle-widget-full.js#L29) | Toast messages (warnings, errors, success) |

## Hierarchy Visualization

```
┌─────────────────────────────────────┐
│  Toast Notifications (1000001)      │  ← Highest (visible above everything)
├─────────────────────────────────────┤
│  Close Button (1000001)             │  ← Same level as toast
├─────────────────────────────────────┤
│  Modal Content (1000000)            │  ← Main modal UI
├─────────────────────────────────────┤
│  Bundle Modal (999999)              │  ← Modal container
├─────────────────────────────────────┤
│  Modal Overlay (999998)             │  ← Dark background
└─────────────────────────────────────┘
```

## Recent Changes

### Fix: Toast Not Visible Behind Modal

**Issue**: Toast notifications were appearing behind the bundle modal because they had a lower z-index (`10000`) than the modal (`999999`).

**Solution**: Increased toast z-index to `1000001` to ensure they appear above all modal elements.

**Files Changed**:
- [app/assets/bundle-widget-full.js](../app/assets/bundle-widget-full.js#L29) - Line 29: Updated `.bundle-toast` z-index from `10000` to `1000001`

**Impact**: Toast notifications now correctly appear above the modal, making step condition validation messages visible to users.

## Why This Matters

When users navigate between steps in the bundle modal, validation messages (toasts) need to be visible to inform them of any issues. With the previous z-index setup, these messages were hidden behind the modal, creating a confusing user experience where validation errors occurred but weren't visible.

## Testing

To test the z-index hierarchy:

1. Open a bundle product page
2. Click on a step to open the modal
3. Try to navigate between steps without meeting conditions
4. Verify that toast messages appear **above** the modal

Expected behavior: Toast notifications should be clearly visible in the top-right corner, overlaying the modal.
