# Architecture: Events Page

## Decision
Single route file `app/routes/app/app.events.tsx` + reusable `app/components/AccordionItem.tsx`.
No DB, no loader data, no tests (Polaris UI TDD exception).

## Files
| File | Change |
|------|--------|
| `app/routes/app/app.events.tsx` | NEW — Events page route |
| `app/components/AccordionItem.tsx` | NEW — reusable accordion wrapper |
| `app/routes/app/app.tsx` | Add `<a href="/app/events">Events</a>` to NavMenu |
| `app/routes/app/app.dashboard/route.tsx` | Remove CartPropertyFixCard import + Layout.Section |

## AccordionItem API
```tsx
<AccordionItem title="..." subtitle="..." badge="...">
  {/* expanded content */}
</AccordionItem>
```
- State: `useState(false)` for `isOpen`
- Animation: CSS `max-height` transition (0 → 1000px) + `opacity` (0 → 1), 220ms ease
- Chevron: inline SVG rotated via `transform: rotate(Xdeg)` transition

## Testing Strategy
No tests required — pure Polaris UI (TDD exception per CLAUDE.md).
