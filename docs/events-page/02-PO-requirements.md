# PO Requirements: Events Page

## Acceptance Criteria
- [ ] Nav shows "Events" link, routes to /app/events
- [ ] Page has two titled sections: "Latest Events" and "FAQs & Tutorials"
- [ ] Each section lists accordion items
- [ ] Collapsed state: title (bold) + subtitle (subdued) + right-aligned chevron pointing down
- [ ] Expanded state: full content revealed, chevron rotates to point up
- [ ] Clicking header toggles expanded/collapsed; clicking again collapses
- [ ] Only one item can be expanded at a time within a section (optional — discuss)
- [ ] Cart Property Display Fix is the first FAQ item with full CartPropertyFixCard content
- [ ] CartPropertyFixCard removed from dashboard
- [ ] Smooth CSS height transition (no janky pop)

## UI Specifications

### Page
- Polaris `Page` with title "Events" and subtitle "Release notes, how-tos, and tutorials"
- Two `Layout.Section` blocks, each containing a section header + list of accordion cards

### Accordion Item (collapsed)
- Polaris `Card` wrapping
- `InlineStack` with `space-between`: left = title + subtitle stack, right = chevron icon
- Cursor: pointer on the header row
- No border change on hover — just subtle background shift (#f6f6f7)

### Accordion Item (expanded)
- Same header, chevron rotated 180°
- Content area slides open below header with a `1px solid #e1e3e5` top divider
- CSS transition: `max-height` + `opacity` over 220ms ease

### Section Headers
- `Text variant="headingMd"` for section title
- `Text variant="bodySm" tone="subdued"` for section count ("2 items")

## Data (static, hardcoded)

### Latest Events
1. **Bundle Config Metafield Cache (v2.3.0)** — "FPB bundles now load instantly from a cached page metafield, eliminating the app proxy round-trip on first paint."

### FAQs & Tutorials
1. **Cart Property Display Fix** — "If your cart shows internal bundle properties, your theme needs a one-line fix." → full CartPropertyFixCard content
