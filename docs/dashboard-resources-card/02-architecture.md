# Architecture: Dashboard Resources Card

## Fast-Track Note
> BR context from user inline spec — replace Demo Section inventory card with EB-style Resources card.

## Impact Analysis
- **Communities touched:** Dashboard UI (route.tsx, dashboard.module.css)
- **God nodes affected:** None — purely presentational, no server changes
- **Blast radius:** Minimal — only `app.dashboard/route.tsx` and `dashboard.module.css`

## Decision
Replace the Demo Section `<Layout.Section>` (lines 1139–1155 in route.tsx) with a ResourcesCard inline in the same file. No new component file needed — the card is dashboard-specific and uses only existing Polaris primitives and the already-present `handleDirectChat` Crisp handler.

## Data Model
No data model changes — purely UI.

## Files
| File | Action | What changes |
|---|---|---|
| `app/routes/app/app.dashboard/route.tsx` | modify | Replace Demo Section JSX; add `ChevronRightIcon`, `ExternalSmallIcon` to polaris-icons imports |
| `app/routes/app/app.dashboard/dashboard.module.css` | modify | Add `.resourceLink`, `.resourceLinkDisabled`, `.resourceThumbnail`, `.resourceThumbnailPlaceholder`, `.resourceThumbnailLabel` |

## Layout Spec

```
┌─────────────────────────────────────────────────────────┐
│ Resources                                                │
│                                                          │
│  Left (2fr)                  Right (1fr)                │
│  ─────────────────────       ─────────────────────────  │
│  Bundle Inspirations    >    [ Bundle Gallery img  ↗ ]  │
│  Support                >    [ Interactive Demo    ↗ ]  │
│  Explore Updates        >                               │
│  SDK Documentation   [Soon]                             │
└─────────────────────────────────────────────────────────┘
```

- **Bundle Inspirations** → `<a href="https://wolfpackapps.com/" target="_blank">`
- **Support** → `onClick={handleDirectChat}` (Crisp)
- **Explore Updates** → `<Link to="/app/events">` (internal nav)
- **SDK Documentation** → non-interactive, `Badge` "Soon"
- **Bundle Gallery / Interactive Demo** → placeholder grey box + external icon, no link yet

## Test Plan
No tests — CSS/Polaris UI change. Visual verification via Chrome DevTools MCP on local dev server (desktop + mobile per audit rule).
