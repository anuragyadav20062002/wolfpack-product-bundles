---
source_file: "docs/theme-color-inheritance/03-architecture.md"
type: "document"
community: "Community 8"
tags:
  - graphify/document
  - graphify/EXTRACTED
  - community/Community_8
---

# syncThemeColors() Service (theme-colors.server.ts)

## Connections
- [[6 Global Color Anchors (globalPrimaryButton, globalButtonText, etc.)]] - `populates` [EXTRACTED]
- [[Shopify Theme configsettings_data.json]] - `reads` [EXTRACTED]
- [[Shopify afterAuth Hook (shopify.server.ts)]] - `called_by` [EXTRACTED]
- [[Theme Color Inheritance — Architecture ADR]] - `defines` [EXTRACTED]
- [[handleSyncBundle Handler Function]] - `called_by` [EXTRACTED]

#graphify/document #graphify/EXTRACTED #community/Community_8