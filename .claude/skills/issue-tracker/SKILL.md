---
name: issue-tracker
description: Mandatory issue tracking workflow for the wolfpack-product-bundles project. Use this skill BEFORE starting ANY development work to create issue files, log progress, and maintain audit trail. Triggers when: (1) User requests to start a new feature/bug fix/task, (2) User asks to plan work, (3) User wants to track progress, (4) Before making ANY code changes in this project. This skill enforces the CLAUDE.md guidelines and ensures all commits follow the [issue-id] type format.
---

# Issue Tracking Workflow

**PROJECT:** wolfpack-product-bundles
**MANDATORY:** This workflow MUST be followed for ALL development work
**REFERENCE:** See `CLAUDE.md` in project root for full guidelines

## When to Use This Skill

Use this skill **BEFORE** starting any development work:

- ✅ Starting a new feature
- ✅ Fixing a bug
- ✅ Refactoring code
- ✅ Making any code changes
- ✅ Planning multi-phase work
- ✅ User requests task tracking

**CRITICAL:** No commits are allowed without an active issue file.

## Workflow Steps

### Step 1: Create or Open Issue File

**Location:** `docs/issues-prod/{issue-name}-{number}.md`

#### For New Issues:

1. Determine issue name from user's request (e.g., "full-page-design-improvements")
2. Check existing issues to determine next number
3. Create new issue file using template from `references/issue-template.md`
4. Fill in frontmatter:
   - Issue ID: `{issue-name}-{number}`
   - Status: "In Progress"
   - Priority: Ask user or infer (🔴 High | 🟡 Medium | 🟢 Low)
   - Created: Today's date
   - Last Updated: Current date and time

#### For Existing Issues:

1. Read current issue file
2. Review progress log
3. Determine next phase/task

### Step 2: Plan the Work

Break down the work into phases with clear steps:

```markdown
## Phases Checklist

- [ ] Phase 0: Initial Setup (if needed)
- [ ] Phase 1: Core Implementation
- [ ] Phase 2: Additional Features
- [ ] Phase 3: Testing & Refinement
```

Add initial progress log entry:

```markdown
### YYYY-MM-DD HH:MM - Planning Complete
- ✅ Analyzed requirements
- ✅ Created implementation plan
- ✅ Identified files to modify
- Next: Begin Phase 1
```

### Step 3: Before Starting Each Phase

Add progress log entry marking phase start:

```markdown
### YYYY-MM-DD HH:MM - Phase X: [Phase Name] Started
- ⏳ What I'm about to implement
- Will modify: `path/to/file1.js`, `path/to/file2.css`
- Goal: Specific objective
- Target: Expected outcome
- Next: First specific step
```

### Step 4: During Development

Keep issue file updated as work progresses. Add intermediate entries if phases take significant time.

### Step 5: After Completing Each Phase

Update progress log with completion details:

```markdown
### YYYY-MM-DD HH:MM - Phase X: [Phase Name] Completed
- ✅ What was accomplished (bullet list)
- ✅ Files Modified:
  - `path/to/file1.js` (lines 50-75, 120-135)
  - `path/to/file2.css` (lines 200-250)
- ✅ Files Created:
  - `path/to/new-file.js`
- Result: What was achieved
- Impact: How this improves the system
- Next: What comes next
```

Update checklist:
```markdown
- [x] Phase X: [Phase Name] ✅ Completed
```

### Step 6: Before EVERY Commit

**MANDATORY CHECKS:**

1. ✅ Issue file progress log is updated
2. ✅ "Last Updated" timestamp is current
3. ✅ Completed phases are marked with `[x]`
4. ✅ File paths and line numbers are included
5. ✅ Next steps are documented

**Then commit:**

```bash
git add .
git add docs/issues-prod/{issue-name}-{number}.md
git commit -m "[{issue-id}] type: description"
```

**Commit format reference:** See `references/commit-message-guide.md`

### Step 7: After Commit

Update issue file with commit hash:

```markdown
- Commit: abc1234
```

### Step 8: Issue Completion

When all phases are done:

```markdown
### YYYY-MM-DD HH:MM - All Phases Completed

**Total Commits:** X
**Lines Added:** ~Y
**Files Created:** Z
**Files Modified:** N

### Key Achievements:
- ✅ Achievement 1
- ✅ Achievement 2
- ✅ Achievement 3

### Impact:
- How this benefits merchants
- How this improves UX
- How this affects the codebase

**Status:** Ready for testing and review
```

Update frontmatter status:
```markdown
**Status:** Completed
```

## Commit Message Format

**MANDATORY FORMAT:**
```
[{issue-id}] type: description
```

**Valid types:**
- `feat` - New feature
- `fix` - Bug fix
- `refactor` - Code restructuring
- `docs` - Documentation
- `style` - CSS/styling
- `chore` - Maintenance
- `test` - Tests
- `perf` - Performance

**Examples:**
```bash
[full-page-design-improvements-1] feat: Add product variant modal
[api-optimization-2] perf: Implement Redis caching
[checkout-refactor-3] fix: Handle empty cart edge case
```

**See:** `references/commit-message-guide.md` for detailed guidance

## Strict Rules

1. ❌ **NO commits without updating issue file first**
2. ❌ **NO commits without proper [issue-id] prefix**
3. ✅ **ALL changes MUST be logged in progress log**
4. ✅ **Update issue file BEFORE and AFTER each commit**
5. ✅ **Every commit MUST reference the issue ID**

## File Organization

```
docs/issues-prod/
├── {issue-name}-1.md       # Active issue
├── {issue-name}-2.md       # Next issue (if exists)
└── ...

CLAUDE.md                    # Guidelines (project root)
```

## Quick Reference

### Check if issue exists:
```bash
ls -la docs/issues-prod/
```

### View current issue:
```bash
cat docs/issues-prod/{issue-name}-{number}.md
```

### Find commits by issue:
```bash
git log --grep="{issue-id}"
```

### Template location:
`references/issue-template.md`

### Commit guide:
`references/commit-message-guide.md`

## Progressive Disclosure

**For detailed templates:** Read `references/issue-template.md`
**For commit format details:** Read `references/commit-message-guide.md`
**For project guidelines:** Read `CLAUDE.md` in project root

## Example Workflow

User: "I want to add a dark mode toggle to the app"

**Step 1:** Create issue
```bash
docs/issues-prod/dark-mode-toggle-5.md
```

**Step 2:** Fill frontmatter and plan phases
```markdown
# Issue: Dark Mode Toggle Implementation

**Issue ID:** dark-mode-toggle-5
**Status:** In Progress
**Priority:** 🟡 Medium
**Created:** 2026-01-13
**Last Updated:** 2026-01-13 16:30

## Phases Checklist
- [ ] Phase 1: Add toggle component
- [ ] Phase 2: State management
- [ ] Phase 3: Theme switching logic
- [ ] Phase 4: Persist user preference
```

**Step 3:** Start Phase 1, update issue, implement, commit
```markdown
### 2026-01-13 16:35 - Phase 1: Toggle Component Started
- ⏳ Creating toggle UI component
- Will create: `app/components/DarkModeToggle.tsx`
- Goal: Accessible toggle button
```

**Step 4:** Complete Phase 1, update issue
```markdown
### 2026-01-13 17:00 - Phase 1: Toggle Component Completed
- ✅ Created `app/components/DarkModeToggle.tsx` (85 lines)
- ✅ Added Tailwind dark mode classes
- ✅ Implemented keyboard accessibility
- Result: Fully accessible toggle component
- Commit: a1b2c3d
- Next: Phase 2 - State Management
```

**Step 5:** Commit
```bash
git add app/components/DarkModeToggle.tsx docs/issues-prod/dark-mode-toggle-5.md
git commit -m "[dark-mode-toggle-5] feat: Add dark mode toggle component"
```

**Repeat** for remaining phases.

## Benefits

- **Traceability:** Every change is documented
- **Context:** Understand why changes were made
- **Progress:** Clear visibility of what's done
- **Collaboration:** Easy for team to follow
- **Debugging:** Quick reference for issues
- **History:** Complete audit trail

## Troubleshooting

**Q: I forgot to update the issue file before committing**
**A:** Update it now, create a doc commit: `[{issue-id}] docs: Update issue tracker with previous changes`

**Q: I made multiple changes without logging**
**A:** Add a comprehensive entry now summarizing all changes

**Q: I'm not sure what to write in progress log**
**A:** Include: what changed, why, which files, what's next

**Q: Should I create a new issue for small fixes?**
**A:** Yes. Even small fixes need tracking for audit trail.
