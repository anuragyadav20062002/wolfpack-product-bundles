# Product Owner Requirements: Legacy Code Removal

## User Stories with Acceptance Criteria

### Story 1: Remove deprecated widget installation legacy file
**As a** developer working on the codebase
**I want** the deprecated `widget-installation-legacy.server.ts` file deleted
**So that** the file no longer appears in IDE search results, import suggestions, or code reviews

**Acceptance Criteria:**
- [ ] `app/services/widget-installation/widget-installation-legacy.server.ts` is deleted
- [ ] No TypeScript import error is introduced in any other file
- [ ] `widget-installation-core.server.ts` no longer imports from the deleted file

---

### Story 2: Remove legacy static re-exports from WidgetInstallationService
**As a** developer
**I want** the deprecated `checkWidgetInstallation`, `checkFullPageWidgetInstallation` static methods removed from `WidgetInstallationService`
**So that** the public API of `WidgetInstallationService` only exposes methods that are actually in use

**Acceptance Criteria:**
- [ ] `static checkWidgetInstallation` removed from `widget-installation-core.server.ts`
- [ ] `static checkFullPageWidgetInstallation` removed from `widget-installation-core.server.ts`
- [ ] The `import { checkWidgetInstallation, checkFullPageWidgetInstallation, checkBundleInWidget }` at the top of `widget-installation-core.server.ts` is removed
- [ ] TypeScript compiles cleanly

---

### Story 3: Remove legacy exports from widget-installation index
**As a** developer
**I want** the deprecated function re-exports removed from `widget-installation/index.ts`
**So that** the module's public export surface only contains live code

**Acceptance Criteria:**
- [ ] The `// Legacy methods` export block removed from `app/services/widget-installation/index.ts`
- [ ] `checkBundleInWidget` export also removed (only exported here, never imported)

---

### Story 4: Remove `ensureBundleMetafieldDefinitions` legacy wrapper
**As a** developer
**I want** the one-line legacy wrapper function removed from `definitions.server.ts`
**So that** callers are forced to use `ensureVariantBundleMetafieldDefinitions` directly

**Acceptance Criteria:**
- [ ] `ensureBundleMetafieldDefinitions` function removed from `definitions.server.ts`
- [ ] Re-export removed from `metafield-sync/operations/index.ts`
- [ ] Re-export removed from `metafield-sync/index.ts`
- [ ] Re-export removed from `metafield-sync.server.ts` (if present)
- [ ] TypeScript compiles cleanly

---

### Story 5: Remove `getStepSelectionText` dead method from widget
**As a** developer
**I want** the unreachable `getStepSelectionText` method removed from `bundle-widget-product-page.js`
**So that** the widget source file does not contain methods that are never called

**Acceptance Criteria:**
- [ ] `getStepSelectionText` method and its comment block removed from `bundle-widget-product-page.js`
- [ ] Widget is rebuilt (`npm run build:widgets`) so the bundled file reflects the removal
- [ ] No functional change to widget behaviour

---

## Out of Scope (explicit)

- `pricing.messages` legacy fallback in both widget files — KEEP
- `legacyResourceId` GraphQL field — KEEP
- Checkout component legacy object format — KEEP
- Test files covering legacy data formats — KEEP
- Archive documentation referencing removed symbols — no change needed
