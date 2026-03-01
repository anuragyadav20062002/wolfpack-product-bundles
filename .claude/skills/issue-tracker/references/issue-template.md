# Issue Template

Use this template when creating new issue files in `docs/issues-prod/`.

## File Naming Convention

```
docs/issues-prod/{issue-name}-{number}.md
```

Examples:
- `full-page-design-improvements-1.md`
- `checkout-flow-refactor-2.md`
- `api-performance-optimization-3.md`

## Issue File Structure

```markdown
# Issue: [Descriptive Title]

**Issue ID:** {issue-name}-{number}
**Status:** [In Progress | Completed | Blocked]
**Priority:** [🔴 High | 🟡 Medium | 🟢 Low]
**Created:** YYYY-MM-DD
**Last Updated:** YYYY-MM-DD HH:MM

## Overview
Brief 1-3 sentence description of what this issue addresses and why it matters.

## Progress Log

### YYYY-MM-DD HH:MM - [Action Description]
- What was done
- Files changed/created
- Results achieved
- Next steps

### YYYY-MM-DD HH:MM - [Next Action]
- Continue logging all work chronologically
- Include ✅ for completed items
- Include ⏳ for in-progress items
- Include file paths and line numbers when relevant

## Related Documentation
- Link to relevant analysis docs
- Link to implementation plans
- Link to design specs
- Link to API docs

## Phases Checklist

- [ ] Phase 0: Initial Setup
- [ ] Phase 1: Core Implementation
- [ ] Phase 2: Additional Features
- [ ] Phase 3: Testing & Polish
- [x] Completed phases get marked with [x]

## Next Immediate Steps
1. [ ] Specific actionable task
2. [ ] Another specific task
3. [ ] Final task before completion

## Files Created/Modified (This Session)

### Phase 0:
- Created: `path/to/file.js`
- Modified: `path/to/other-file.css`

### Phase 1:
- List files as work progresses

---

**Remember:** Update this file BEFORE and AFTER every commit!
```

## Status Values

- **In Progress**: Active development
- **Completed**: All work finished, ready for review
- **Blocked**: Waiting on external dependency or decision

## Priority Indicators

- 🔴 **High**: Critical feature, blocking issue, production bug
- 🟡 **Medium**: Important improvement, non-blocking enhancement
- 🟢 **Low**: Nice-to-have, minor improvement, documentation

## Progress Log Best Practices

1. **Timestamp every entry**: Use `YYYY-MM-DD HH:MM` format
2. **Be specific**: Include file paths and line numbers
3. **Include context**: Why changes were made, not just what
4. **Note blockers**: Document any issues encountered
5. **Link commits**: Reference commit hashes after committing
6. **Update frequently**: Log work as it happens, not after

## Example Entry

```markdown
### 2026-01-13 15:45 - Phase 4: Product Modal Completed
- ✅ Created `app/assets/bundle-modal-component.js` (450 lines)
- ✅ Added modal CSS to `extensions/bundle-builder/assets/bundle-widget-full-page.css` (+400 lines)
- ✅ Updated button behavior in `app/assets/bundle-widget-full-page.js`
  - Changed "Add to Bundle" → "Choose Options"
  - Button click now opens modal instead of direct add
- Files Modified:
  - `extensions/bundle-builder/assets/bundle-widget-full-page.css` (lines 800-1200)
  - `app/assets/bundle-widget-full-page.js` (lines 84-92, 2177-2180, 2226-2256)
  - `extensions/bundle-builder/blocks/bundle-full-page.liquid` (lines 223-245)
- Result: Professional modal with image gallery, variant selection, quantity controls
- Commit: 56195cf
- Next: Begin Phase 5 (Enhanced Card Styling)
```
