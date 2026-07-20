---
schema_version: 1
id: fpb-bundle-banner-runtime-and-picker
title: FPB Bundle Banner Runtime and Picker
type: test-spec
status: active
summary: Verifies full-page banner projection across templates and banner-specific asset-picker and preview behavior.
last_audited: 2026-07-20
owners:
  - engineering
domains:
  - storefront
  - admin
systems:
  - widget-runtime
  - file-picker
source_paths:
  - app/lib/bundle-formatter.server.ts
  - app/components/shared/FilePicker.tsx
  - app/components/shared/file-picker/FilePickerTrigger.tsx
  - app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/sections/BundleSettingsTimeline.tsx
related_docs:
  - internal docs/Architecture/Widget Architecture.md
tags:
  - fpb
  - banner
  - asset-picker
keywords:
  - bundleBannerDesktopUrl
  - bundleBannerMobileUrl
  - MobileIcon
---

# Test Spec: FPB Bundle Banner Runtime and Picker

**Spec ID:** fpb-bundle-banner-runtime-and-picker  **Created:** 2026-07-20

## Purpose

Ensure saved FPB banner URLs reach every storefront template and the Admin banner controls open the existing asset picker with the correct device icon.
Uploaded banner previews must retain the empty dropzone dimensions and contain the complete image.

## Test Cases

### BundleFormatter

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Project banners across FPB templates | Standard, Classic, Compact, and Horizontal bundles with both banner URLs | Both URLs exist in each formatted widget payload | Covers app-proxy and API consumers of the shared formatter |

### FilePickerTrigger

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Banner upload button | `uploadButtonAction: openPicker` | Clicking Upload image invokes the asset-picker open action | Direct file upload remains the default elsewhere |
| 2 | Mobile banner drop zone | `triggerIcon: mobile` | Trigger renders the mobile device icon | Desktop remains the default icon |

## Acceptance Criteria

- [x] Tests fail before implementation and pass afterward.
- [x] All four FPB templates receive desktop and mobile banner URLs.
- [x] Banner Upload image buttons open the existing asset picker.
- [x] Mobile banner drop zones use a mobile icon.
- [x] Uploaded banner previews retain the dropzone dimensions and contain the complete image.
- [x] Focused lint, app build, graph rebuild, and browser verification pass.
