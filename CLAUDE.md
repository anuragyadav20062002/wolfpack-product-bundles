# Claude Code Development Guidelines

## 📋 Issue Tracking System

### Mandatory Process for ALL Changes

**BEFORE making ANY code changes, commits, or file modifications:**

1. **Create or Update Issue File**
   - Location: `docs/issues-prod/{issueName}-{number}.md`
   - Example: `docs/issues-prod/full-page-design-improvements-1.md`
   - Format: See template in `docs/issues-prod/`

2. **Log Progress**
   - Date and time of change
   - What was changed
   - Why it was changed
   - What's next

3. **Reference in Commit Messages**
   - Format: `[{issueName}-{number}] type: description`
   - Example: `[full-page-design-improvements-1] fix: Product cards now maintain fixed dimensions`

### Issue File Structure

```markdown
# Issue: [Title]

**Issue ID:** {issueName}-{number}
**Status:** [In Progress | Completed | Blocked]
**Priority:** [🔴 High | 🟡 Medium | 🟢 Low]
**Created:** YYYY-MM-DD
**Last Updated:** YYYY-MM-DD HH:MM

## Overview
Brief description of the issue/feature.

## Progress Log

### YYYY-MM-DD HH:MM - [Action]
- What was done
- Files changed
- Next steps

## Related Documentation
- Links to relevant docs

## Phases Checklist
- [ ] Phase 1
- [ ] Phase 2
```

### Git Commit Message Format

```bash
# Format
[issue-id] type: description

# Types:
# - feat: New feature
# - fix: Bug fix
# - refactor: Code refactoring
# - docs: Documentation changes
# - style: CSS/styling changes
# - chore: Maintenance tasks
# - test: Testing updates

# Examples
[full-page-design-improvements-1] fix: Product cards maintain fixed dimensions
[full-page-design-improvements-1] feat: Add product variant modal component
[full-page-design-improvements-1] docs: Update DCP integration guide
[full-page-design-improvements-1] refactor: Remove hardcoded font families
[full-page-design-improvements-1] style: Update product card shadows and borders
[full-page-design-improvements-1] chore: Set up issue tracking system
```

### Workflow

#### 1. Before Starting Work:
```bash
# Open or create issue file
vim docs/issues-prod/{issue-name}-1.md

# Add entry to Progress Log:
### YYYY-MM-DD HH:MM - Starting [Phase/Task Name]
- What I'm about to implement
- Files I'll modify
- Expected outcome
```

#### 2. During Development:
```bash
# Make your code changes
# Keep issue file open in editor
# Update Progress Log as you work
```

#### 3. Before Commit:
```bash
# Update issue file with:
### YYYY-MM-DD HH:MM - Completed [Phase/Task Name]
- ✅ What was accomplished
- Files modified: file1.css, file2.js
- Changes made: Brief description
- Next: What to do next

# Update "Last Updated" timestamp at top
# Mark completed checklist items with [x]

# Stage all changes including issue file
git add .
git add docs/issues-prod/full-page-design-improvements-1.md

# Commit with proper format
git commit -m "[full-page-design-improvements-1] type: your message"
```

#### 4. After Commit:
```bash
# Verify issue file is up to date
# Verify commit message follows format
# Push to remote if ready
git push origin STAGING
```

## 🚫 Strict Rules

1. **NO commits without updating issue file first** ❌
2. **NO commits without proper [issue-id] prefix** ❌
3. **ALL changes must be logged in progress log** ✅
4. **Update issue file BEFORE and AFTER each commit** ✅
5. **Every commit must reference the issue ID** ✅

## 🔧 Widget Bundle Build Process

### MANDATORY: Build After Widget Changes

**ALWAYS run the build script after modifying ANY of these source files:**

- `app/assets/bundle-widget-components.js` - Shared components
- `app/assets/bundle-modal-component.js` - Modal component (full-page only)
- `app/assets/bundle-widget-full-page.js` - Full-page widget
- `app/assets/bundle-widget-product-page.js` - Product-page widget

### Build Commands

```bash
# Build all widget bundles (recommended)
npm run build:widgets

# Build only full-page widget bundle
npm run build:widgets:full-page

# Build only product-page widget bundle
npm run build:widgets:product-page
```

### Output Files

The build script generates bundled files in the extension assets folder:

```
extensions/bundle-builder/assets/
├── bundle-widget-full-page-bundled.js    # Full-page widget bundle
└── bundle-widget-product-page-bundled.js # Product-page widget bundle
```

### Why This Matters

- Source files use ES modules (`import`/`export`) for development
- Shopify theme extensions require bundled, standalone JS files
- The build script combines components + widget code into single IIFEs
- **Forgetting to build = changes won't appear in the storefront!**

### Workflow Integration

```bash
# After making widget JS changes:
1. Edit source files in app/assets/
2. Run: npm run build:widgets
3. Test changes in storefront
4. Commit BOTH source files AND bundled files
```

## 📁 File Structure

```
docs/
├── issues-prod/
│   ├── full-page-design-improvements-1.md    # Current issue
│   ├── {future-issue}-2.md                   # Future issues
│   └── ...
├── FULL_PAGE_DESIGN_GAP_ANALYSIS.md          # Analysis docs
├── FULL_PAGE_IMPLEMENTATION_PLAN_2026.md     # Implementation docs
└── ...

CLAUDE.md                                      # This file (root)
.claude/
└── plans/
    └── graceful-marinating-wozniak.md         # Current plan
```

## 🎯 Example Issue File

See `docs/issues-prod/full-page-design-improvements-1.md` for the current active issue.

## 📝 Example Commit History

```bash
[full-page-design-improvements-1] chore: Set up issue tracking system
[full-page-design-improvements-1] fix: Product cards maintain fixed dimensions via CSS grid
[full-page-design-improvements-1] feat: Add spacing controls to Theme Editor
[full-page-design-improvements-1] refactor: Remove hardcoded fonts, use inheritance
[full-page-design-improvements-1] feat: Create product variant modal component
[full-page-design-improvements-1] style: Update product card styling with shadows
[full-page-design-improvements-1] feat: Integrate modal and spacing with DCP
[full-page-design-improvements-1] docs: Update merchant guide for new features
```

## ✅ Benefits

- **Traceability:** Every change is documented
- **Context:** Understand why changes were made
- **Progress:** Clear visibility of what's done
- **Collaboration:** Easy for team members to follow along
- **Debugging:** Quick reference for when issues arise
- **History:** Complete audit trail of development

## 🔍 Finding Issues

### List All Issues:
```bash
ls -la docs/issues-prod/
```

### View Current Issue:
```bash
cat docs/issues-prod/full-page-design-improvements-1.md
```

### Search Commits by Issue:
```bash
git log --grep="full-page-design-improvements-1"
```

---

**Enforce this pattern throughout ALL changes in this project from now on.**
**No exceptions.** ✅

---

**Last Updated:** January 13, 2026
**Author:** Aditya Awasthi
