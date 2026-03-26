# Product Owner Requirements: Analytics Custom Date Range

## User Stories with Acceptance Criteria

### Story 1: Select a custom date range via calendar picker
**As a** merchant
**I want** to pick a custom start and end date on the analytics page
**So that** I can analyse bundle revenue and UTM attribution for any specific period

**Acceptance Criteria:**
- [ ] Given the analytics page is loaded, when the user looks at the date range control, then they see a trigger button showing the active range label (e.g. "Last 30 days" or "Mar 1 – Mar 25, 2026")
- [ ] Given the trigger button is visible, when the user clicks it, then a Popover opens containing a two-month Polaris `DatePicker` with range selection enabled
- [ ] Given the Popover is open, when the user clicks a start date then an end date, then both dates are highlighted and an "Apply" button becomes active
- [ ] Given the user clicks "Apply", then the page navigates to `?from=YYYY-MM-DD&to=YYYY-MM-DD` and the Popover closes
- [ ] Given the user clicks outside the Popover or presses Escape, then the Popover closes without changing the active range
- [ ] Given future dates exist in the calendar, when they are displayed, then they are disabled (cannot be selected)

---

### Story 2: Quick-select presets remain available
**As a** merchant
**I want** to use the existing quick-select presets (Last 7, 30, 90 days) without opening a calendar
**So that** my default workflow is unchanged

**Acceptance Criteria:**
- [ ] Given the date range control is visible, then "Last 7 days", "Last 30 days", and "Last 90 days" preset buttons (or chips) are available within or adjacent to the date range trigger
- [ ] Given a preset is clicked, then the page navigates to `?days=7`, `?days=30`, or `?days=90` respectively
- [ ] Given the page loads with `?days=30` (default), then "Last 30 days" is shown as the active/selected option

---

### Story 3: Loader handles custom date range params
**As a** developer
**I want** the loader to accept `?from` and `?to` URL params
**So that** the analytics data reflects the user-selected range

**Acceptance Criteria:**
- [ ] Given `?from=2026-03-01&to=2026-03-25` is in the URL, then the loader queries `createdAt >= 2026-03-01T00:00:00` and `createdAt <= 2026-03-25T23:59:59` for the current period
- [ ] Given a custom range of D days, then the previous period window is `[from - D days, from)` (equal-length symmetric window)
- [ ] Given only `?days=N` is in the URL (no `from`/`to`), then the loader falls back to the existing days-based logic
- [ ] Given neither `?days` nor `?from`/`?to` are present, then the loader defaults to 30 days (existing default)
- [ ] Given `?from` is present but `?to` is absent (malformed URL), then the loader falls back to `?days=30`

---

### Story 4: Date range label reflects active selection
**As a** merchant
**I want** the date range trigger button to show what range I'm viewing
**So that** I always know what period the data represents

**Acceptance Criteria:**
- [ ] Given `?days=7` is active, then the trigger label reads "Last 7 days"
- [ ] Given `?days=30` is active, then the trigger label reads "Last 30 days"
- [ ] Given `?days=90` is active, then the trigger label reads "Last 90 days"
- [ ] Given `?from=2026-03-01&to=2026-03-25` is active, then the trigger label reads "Mar 1 – Mar 25, 2026"
- [ ] Given a custom range spanning two years, then the label includes both years: "Dec 28, 2025 – Jan 10, 2026"

---

### Story 5: Trend chart buckets adapt to custom range
**As a** merchant
**I want** the bundle revenue trend chart to bucket data appropriately for my selected range
**So that** short ranges show daily data and long ranges show weekly data

**Acceptance Criteria:**
- [ ] Given a custom range of < 90 days, then the trend chart shows daily data points
- [ ] Given a custom range of ≥ 90 days, then the trend chart shows weekly data points (ISO Monday-keyed)
- [ ] Given the range is exactly 90 days, then weekly bucketing is used (existing threshold unchanged)

---

## UI/UX Specifications

### Date Range Control Layout
- **Placement:** same position as the current `Select` (top-right of the analytics page, inside `.datePickerWrap`)
- **Trigger element:** Polaris `Button` with `disclosure` prop — shows the active range label + chevron
- **Popover:** `Polaris Popover` with `preferredPosition="below"`, `sectioned`
- **Calendar:** `Polaris DatePicker` with `allowRange={true}`, `multiMonth={true}`, `disableDatesAfter={new Date()}`
- **Preset chips:** Three `Button` `variant="plain"` chips inside the Popover above the calendar: "Last 7 days" / "Last 30 days" / "Last 90 days". Clicking a preset navigates immediately (no Apply needed).
- **Apply button:** Polaris `Button variant="primary"` — disabled until both start and end dates are selected; clicking applies the custom range
- **Cancel / close:** clicking outside the Popover or the trigger again closes it without applying

### Trigger Button Label Format
| URL state | Label |
|-----------|-------|
| `?days=7` | Last 7 days |
| `?days=30` | Last 30 days |
| `?days=90` | Last 90 days |
| `?from=2026-03-01&to=2026-03-25` | Mar 1 – Mar 25, 2026 |
| No param (default) | Last 30 days |

### Date Format
- Month abbreviation + day (no leading zero) + year if needed: "Mar 1" / "Mar 1, 2026"
- Range separator: en-dash with spaces: " – "
- When both dates are in the same year: "Mar 1 – Mar 25, 2026"
- When dates span years: "Dec 28, 2025 – Jan 10, 2026"

### Controlled Calendar State
- `month` and `year` are controlled in local component state, seeded from the `to` date (most recent end of selected range) on Popover open
- `onMonthChange` updates local `calMonth`/`calYear` state

---

## Data Persistence
- No persistence — the selected range lives in the URL only (`?from&to` or `?days`)
- The loader returns `{ from?: string; to?: string; days: number }` so the component can seed its display state correctly on direct URL load

## Backward Compatibility Requirements
- URLs with `?days=N` must continue to work without any change to loader output shape
- The component's `useState` for `selectedDays` is replaced by a more general `activeRangeLabel` derived from loader data
- `buildBundleTrendSeries(rows, since, days)` signature gains an optional `until?: Date` param (defaults to `new Date()`) — existing call sites are unaffected

## Out of Scope (explicit)
- Saving custom ranges as merchant preferences
- Comparing multiple date ranges side-by-side
- Date range picker on any page other than `/app/attribution`
- Server-side input validation beyond basic param presence check
