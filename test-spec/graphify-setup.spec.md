# Test Spec: Graphify Setup
**Spec ID:** graphify-setup  **Created:** 2026-06-20

## Purpose
Verify the repo's Graphify setup uses the same runtime as the installed
`graphify` CLI/hooks, does not preserve stale invalid graph node types, and
does not leave generated support files as untracked worktree noise.

## Test Cases

### GraphifyWrapper
| # | Scenario | Input | Expected Output | Notes |
|---|----------|-------|-----------------|-------|
| 1 | Existing graph contains stale `file_type: "concept"` nodes | `npm run graphify:rebuild` | Rebuild exits 0 and `graphify-out/graph.json` contains no invalid `file_type` values | `concept` is normalized to `document` before and after rebuild. |
| 2 | Repo uses installed `graphify` CLI from uv | `npm run graphify:rebuild` | Wrapper runs the CLI shebang Python when available | Keeps npm script aligned with installed hooks. |
| 3 | Graphify writes support files | `git status --short --ignored` | `.graphify_root`, `manifest.json`, locks, temp files, dated backups, and cache files are ignored | Tracked `GRAPH_REPORT.md`, `graph.json`, and `.graphify_python` remain visible. |
| 4 | Graph query is usable | `graphify query "what depends on ProductPageSelectionMethods?" --budget 600` | Command exits 0 with graph nodes | Validates CLI can read current graph. |
| 5 | Graphify scans repo sources | Live `graphify.detect.detect(Path("."))` result | No files under `graphify-out/`, `.claude/`, `.codex/`, `.vscode/`, or Obsidian plugin state are detected as source input | Prevents graphify from ingesting generated reports/backups and local tool/editor state. |
| 6 | Existing graph contains old generated-output nodes | `npm run graphify:rebuild` | Nodes whose `source_file` starts with `graphify-out/` are pruned | Required because older semantic nodes are preserved across code-only rebuilds. |

## Acceptance Criteria
- [ ] `npm run graphify:rebuild` exits 0
- [ ] Graph validation reports zero invalid `file_type` values
- [ ] `graphify hook status` reports post-commit and post-checkout installed
- [ ] Generated support files are ignored
- [ ] Generated output and local tool/editor state are excluded from graphify source detection
- [ ] Existing `graphify-out/` source nodes are pruned from `graph.json`
