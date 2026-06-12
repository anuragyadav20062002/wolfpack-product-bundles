# Issue: Docker Build Fails — sharp Not Found
**Issue ID:** docker-build-sharp-fix-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-06-08
**Last Updated:** 2026-06-08

## Overview
Docker build fails with `Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'sharp'`.

## Root Cause
`sharp` was in `devDependencies`. The Dockerfile runs `npm ci --omit=dev` then `npm run build`, which calls `scripts/optimise-public-images.mjs` (imports `sharp`). Since devDependencies are excluded, `sharp` was not installed.

## Fix
Moved `sharp` from `devDependencies` to `dependencies` in `package.json`.

## Files Modified
- `package.json`
- `package-lock.json`

## Progress Log
### 2026-06-08 - Fix Applied
- ✅ Moved `sharp: ^0.34.5` from devDependencies to dependencies
- ✅ Ran `npm install` to update lockfile
- Result: Docker build can now find `sharp` when running with `--omit=dev`

## Phases Checklist
- [x] Phase 1: Root Cause ✅
- [x] Phase 2: Fix ✅
