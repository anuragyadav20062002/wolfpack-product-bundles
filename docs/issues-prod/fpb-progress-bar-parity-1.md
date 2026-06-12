# Issue: FPB Progress Bar Parity

**Issue ID:** fpb-progress-bar-parity-1
**Status:** In Progress
**Priority:** High
**Created:** 2026-06-12

## Overview

Align the FPB Discount & Pricing progress bar with EB behavior across all FPB templates and desktop/mobile viewports.

## Scope

- Support both Progress Bar modes from Discount & Pricing:
  - Simple Bar
  - Step-Based Bar
- Apply across FPB Standard, Classic, Compact, and Horizontal templates.
- Desktop: progress appears in the summary/sidebar area below the discount messaging string.
- Mobile: progress appears in the footer/tray below the discount messaging string.
- Reserve stable progress-bar space so product selection and discount state changes do not shift surrounding layout.
- Do not duplicate the discount messaging string inside the progress component when the host already renders that string.

## Progress Log

### 2026-06-12

- Opened parity scope from storefront feedback.
- Added renderer behavior coverage for externally rendered discount messaging.
- Updated FPB sidebar/mobile progress rendering so the progress component omits duplicate inline copy when it sits below the host discount message.
- Added reserved simple/step progress sizing for FPB sidebar-style progress containers.
