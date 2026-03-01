# Commit Message Format Guide

## Required Format

```
[issue-id] type: description
```

**All three components are MANDATORY:**
1. `[issue-id]` - The issue identifier in brackets
2. `type` - One of the allowed commit types
3. `description` - Brief description of the change

## Commit Types

- **feat**: New feature or functionality
- **fix**: Bug fix or correction
- **refactor**: Code restructuring without behavior change
- **docs**: Documentation only changes
- **style**: CSS/styling changes or formatting
- **chore**: Maintenance tasks, build process, dependencies
- **test**: Adding or updating tests
- **perf**: Performance improvements

## Examples

### Good Commit Messages

```bash
[full-page-design-improvements-1] feat: Add product variant modal component
[full-page-design-improvements-1] fix: Product cards maintain fixed dimensions
[full-page-design-improvements-1] refactor: Remove hardcoded fonts, use inheritance
[full-page-design-improvements-1] docs: Update DCP integration guide
[full-page-design-improvements-1] style: Update product card shadows and borders
[full-page-design-improvements-1] chore: Set up issue tracking system
[checkout-flow-refactor-2] feat: Implement multi-step checkout wizard
[api-performance-3] perf: Add Redis caching layer
[navigation-menu-4] fix: Mobile menu not closing on route change
```

### Multi-line Commit Messages

For complex changes, use multi-line format:

```bash
git commit -m "[issue-id] type: Brief summary

Detailed explanation of what changed and why:
- First major change
- Second major change
- Impact on the system

Related files:
- path/to/file1.js
- path/to/file2.css"
```

### Bad Commit Messages (DON'T DO THIS)

```bash
❌ "Fixed stuff"                              # Missing issue ID and type
❌ "feat: Add modal"                          # Missing issue ID
❌ "[full-page] Added modal component"        # Missing type
❌ "full-page-improvements: Added modal"      # Missing brackets and type
❌ "[WIP] working on modal"                   # Not descriptive, unclear type
```

## Commit Message Templates

### Feature Addition
```
[{issue-id}] feat: Add {feature-name}

- Implemented {component/functionality}
- Added {new-capability}
- Integrated with {existing-system}

Files created:
- {new-file-1}
- {new-file-2}

Files modified:
- {modified-file-1}
- {modified-file-2}
```

### Bug Fix
```
[{issue-id}] fix: {Brief description of what was broken}

- Root cause: {explanation}
- Solution: {what was changed}
- Impact: {what this fixes}

Modified: {file-path}
```

### Refactoring
```
[{issue-id}] refactor: {What was refactored}

- Extracted {duplicated-code} into {new-location}
- Simplified {complex-logic}
- Improved {aspect}

No behavior change, pure code quality improvement.
```

### Documentation
```
[{issue-id}] docs: {What documentation was updated}

- Updated {section}
- Added {new-guide}
- Clarified {confusing-part}
```

## Git Workflow with Issue Tracking

### Before Commit
```bash
# 1. Update issue file
vim docs/issues-prod/{issue-name}-1.md

# 2. Add progress log entry with:
#    - What was accomplished
#    - Files changed
#    - Next steps

# 3. Update "Last Updated" timestamp

# 4. Stage all files including issue file
git add .
git add docs/issues-prod/{issue-name}-1.md

# 5. Commit with proper format
git commit -m "[{issue-id}] type: description"
```

### Amending Commits

If you need to fix the commit message:

```bash
# Fix the most recent commit message
git commit --amend -m "[{issue-id}] type: corrected description"
```

### Checking Commit History

```bash
# View commits for specific issue
git log --grep="{issue-id}"

# View commits with files changed
git log --stat --grep="{issue-id}"

# View detailed commits
git log -p --grep="{issue-id}"
```

## Common Patterns

### Sequential Commits in Same Issue
```bash
[issue-1] chore: Set up project structure
[issue-1] feat: Implement core functionality
[issue-1] test: Add unit tests
[issue-1] docs: Add usage documentation
[issue-1] fix: Handle edge case in validation
```

### Issue Completion
```bash
[issue-1] docs: Final summary - All phases completed
```

## Rules

1. ✅ **ALWAYS** include `[issue-id]` in brackets
2. ✅ **ALWAYS** include a valid type
3. ✅ **ALWAYS** update issue file BEFORE committing
4. ✅ **ALWAYS** reference the commit hash in issue file AFTER committing
5. ❌ **NEVER** commit without issue ID
6. ❌ **NEVER** use vague descriptions like "updates" or "fixes"
7. ❌ **NEVER** commit without updating issue progress log
