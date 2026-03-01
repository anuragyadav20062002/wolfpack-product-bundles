# Issue Tracker Skill - Created Successfully! 🎉

**Location:** `.claude/skills/issue-tracker.skill`
**Size:** 7.6 KB
**Status:** ✅ Ready to use

---

## What Was Created

A comprehensive Claude skill that automates the issue tracking workflow for the wolfpack-product-bundles project.

### Skill Structure

```
issue-tracker/
├── SKILL.md                              # Main skill instructions
├── references/
│   ├── issue-template.md                 # Template for creating new issues
│   └── commit-message-guide.md           # Commit message format guide
├── scripts/                              # (empty, reserved for future)
└── assets/                               # (empty, reserved for future)
```

---

## What This Skill Does

The issue-tracker skill **automatically triggers** when:

1. ✅ User starts a new feature/bug fix/task
2. ✅ User asks to plan work
3. ✅ User wants to track progress
4. ✅ Before making ANY code changes in the project

It enforces the **mandatory workflow** established in `CLAUDE.md`:
- Creates issue files in `docs/issues-prod/`
- Guides through planning phases
- Updates issue files before/after commits
- Enforces `[issue-id] type: description` commit format
- Maintains complete audit trail

---

## How It Works

### Automatic Triggering

The skill's description is comprehensive enough that Claude will automatically use it when appropriate:

```yaml
description: Mandatory issue tracking workflow for the wolfpack-product-bundles
project. Use this skill BEFORE starting ANY development work to create issue
files, log progress, and maintain audit trail. Triggers when: (1) User requests
to start a new feature/bug fix/task, (2) User asks to plan work, (3) User wants
to track progress, (4) Before making ANY code changes in this project.
```

### Workflow Steps (Automated)

When triggered, the skill guides through:

1. **Create/Open Issue File**
   - Location: `docs/issues-prod/{issue-name}-{number}.md`
   - Uses template from skill references
   - Fills in frontmatter automatically

2. **Plan the Work**
   - Break down into phases
   - Create checklist
   - Add initial progress log

3. **Before Each Phase**
   - Add "Started" entry
   - List files to modify
   - State objectives

4. **After Each Phase**
   - Add "Completed" entry with details
   - List modified/created files with line numbers
   - Mark checklist items complete

5. **Before EVERY Commit**
   - Update issue file progress log
   - Update timestamp
   - Ensure proper format

6. **Commit with Format**
   - `[issue-id] type: description`
   - Add commit hash to issue file

7. **Issue Completion**
   - Summary of all achievements
   - Update status to "Completed"

---

## Example Usage

### User Says:
```
"I want to add a search feature to the product catalog"
```

### Skill Automatically:

1. **Creates Issue:**
```
docs/issues-prod/product-catalog-search-6.md
```

2. **Plans Phases:**
```markdown
## Phases Checklist
- [ ] Phase 1: Add search input UI
- [ ] Phase 2: Implement search logic
- [ ] Phase 3: Add filters
- [ ] Phase 4: Optimize performance
```

3. **Tracks Progress:**
```markdown
### 2026-01-13 17:30 - Phase 1: Search Input UI Started
- ⏳ Creating search input component
- Will create: `app/components/ProductSearch.tsx`
- Goal: Accessible search with autocomplete

### 2026-01-13 18:00 - Phase 1: Search Input UI Completed
- ✅ Created `app/components/ProductSearch.tsx` (120 lines)
- ✅ Added debounced input handling
- ✅ Implemented keyboard navigation
- Commit: f7e9a2b
- Next: Phase 2 - Search Logic
```

4. **Enforces Commit Format:**
```bash
[product-catalog-search-6] feat: Add search input component with autocomplete
```

---

## Reference Files Included

### 1. Issue Template (`references/issue-template.md`)

Complete template showing:
- File naming convention
- Required frontmatter structure
- Progress log format
- Best practices
- Example entries

### 2. Commit Message Guide (`references/commit-message-guide.md`)

Detailed guide covering:
- Required format: `[issue-id] type: description`
- Valid commit types (feat, fix, refactor, etc.)
- Good vs. bad examples
- Multi-line commits
- Git workflow integration
- Common patterns

---

## Integration with Existing Workflow

This skill **perfectly matches** the workflow we just established:

✅ Follows `CLAUDE.md` guidelines exactly
✅ Uses same issue file structure as `full-page-design-improvements-1`
✅ Enforces same commit message format
✅ Maintains same level of detail in progress logs
✅ Compatible with existing issues

---

## Benefits

### For Development:
- **Automatic:** Triggers without manual invocation
- **Comprehensive:** Covers entire workflow start to finish
- **Consistent:** Enforces standards every time
- **Traceable:** Complete audit trail maintained

### For Team:
- **Onboarding:** New team members follow process automatically
- **Collaboration:** Everyone uses same structure
- **Debugging:** Easy to trace changes to their origins
- **Review:** Clear context for all changes

### For Project:
- **History:** Complete record of all development
- **Context:** Understand why every change was made
- **Quality:** Enforced standards prevent mistakes
- **Compliance:** Audit trail for all changes

---

## Using the Skill

### Installation (Already Done!)

The skill is already in the correct location:
```
.claude/skills/issue-tracker.skill
```

Claude Code automatically loads skills from `.claude/skills/` directory.

### Testing the Skill

Try these commands:

```
"I want to fix the login bug"
"Let's add a new payment method"
"Help me refactor the database queries"
"I need to track work on the checkout flow"
```

The skill should automatically activate and guide you through the issue tracking workflow.

### Manual Invocation

You can also explicitly invoke the skill:
```
"Use the issue-tracker skill to start working on [task]"
```

---

## Skill Maintenance

### Location of Skill Source:
```
.claude/skills/issue-tracker/
├── SKILL.md
├── references/
│   ├── issue-template.md
│   └── commit-message-guide.md
```

### Updating the Skill:

1. Edit files in `issue-tracker/` directory
2. Re-package:
   ```bash
   cd .claude/skills/issue-tracker
   zip -r ../issue-tracker.skill . -x "*.DS_Store"
   ```
3. Claude will automatically use updated version

### Adding New Features:

- **Scripts:** Add to `scripts/` directory
- **References:** Add to `references/` directory
- **Assets:** Add to `assets/` directory
- Update `SKILL.md` to reference new files

---

## Progressive Disclosure Design

The skill uses a three-tier information architecture:

**Tier 1: Metadata (Always Loaded)**
- Skill name and description
- Triggers automatically when appropriate

**Tier 2: SKILL.md (Loaded When Triggered)**
- Core workflow steps
- Quick reference
- Links to detailed references

**Tier 3: Reference Files (Loaded As Needed)**
- `issue-template.md` - Full template with examples
- `commit-message-guide.md` - Detailed commit guidance

This keeps context window lean while providing comprehensive information when needed.

---

## Comparison: Before vs. After

### Before (Manual):
1. ❌ Remember to create issue file
2. ❌ Remember correct format
3. ❌ Remember to update before commit
4. ❌ Remember commit message format
5. ❌ Remember to log all changes
6. ❌ Easy to forget steps

### After (Automatic):
1. ✅ Skill creates issue automatically
2. ✅ Skill uses correct format
3. ✅ Skill reminds to update
4. ✅ Skill enforces commit format
5. ✅ Skill ensures complete logging
6. ✅ Impossible to skip steps

---

## Success Metrics

The skill is successful if:

✅ **Every commit** has an associated issue file
✅ **Every commit** follows `[issue-id] type: description` format
✅ **Every issue** has complete progress log with timestamps
✅ **Every change** includes file paths and line numbers
✅ **Zero commits** without proper documentation

---

## Troubleshooting

### Skill Doesn't Trigger

**Problem:** Claude doesn't use the skill automatically

**Solutions:**
1. Mention "issue tracker" or "track this work"
2. Explicitly invoke: "Use issue-tracker skill"
3. Check skill file exists at `.claude/skills/issue-tracker.skill`

### Wrong Format Used

**Problem:** Claude creates issue file in wrong format

**Solution:**
- Skill will read `references/issue-template.md` for correct format
- If persists, show the template directly

### Commit Message Incorrect

**Problem:** Commits don't follow `[issue-id] type:` format

**Solution:**
- Skill will reference `references/commit-message-guide.md`
- Amend commit: `git commit --amend -m "[issue-id] type: description"`

---

## Next Steps

1. ✅ **Test the skill** - Try creating a small feature with skill guidance
2. ✅ **Verify formatting** - Check that issue files match template
3. ✅ **Confirm commits** - Ensure all commits have proper format
4. ✅ **Iterate if needed** - Update skill based on real usage

---

## Files Created

1. `.claude/skills/issue-tracker.skill` (7.6 KB) - **Packaged skill file**
2. `.claude/skills/issue-tracker/SKILL.md` - Main instructions
3. `.claude/skills/issue-tracker/references/issue-template.md` - Issue template
4. `.claude/skills/issue-tracker/references/commit-message-guide.md` - Commit guide

---

## Summary

🎉 **The issue-tracker skill is ready to use!**

It will **automatically enforce** the issue tracking workflow throughout the wolfpack-product-bundles project, ensuring:
- ✅ Complete audit trail
- ✅ Consistent formatting
- ✅ Proper documentation
- ✅ Zero forgotten steps

**Just start working on any task, and the skill will guide you through the complete workflow!**

---

**Created:** January 13, 2026
**Author:** Claude Code (via skill-creator)
**Project:** wolfpack-product-bundles
**Location:** `.claude/skills/issue-tracker.skill`
