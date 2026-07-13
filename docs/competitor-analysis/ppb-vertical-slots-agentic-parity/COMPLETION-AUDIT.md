# Vertical Slots Completion Audit

Date: 2026-07-13
Status: Accepted

| Requirement group | Status | Evidence |
| --- | --- | --- |
| Runtime and orientation | Proven | VS00/VS01 and final regression prove `PDP_MODAL + SIMPLIFIED`, vertical orientation, and dedicated shell dispatch. |
| Empty rows and responsive geometry | Proven | VS00/VS01 cover desktop/mobile; final regression proves real 570.5px placement; rows remain responsive and overflow-free. |
| Filled rows, media, text, long titles | Proven | VS02 and VS04 prove 64px rows, 50px media, image/title/remove order, full titles, dynamic capacity, and desktop/mobile parity. |
| Picker structure and product cards | Proven | VS04 directly proves the current-step mobile header, `Added x1` selected cards, exact desktop five-card geometry, and shared bottom-sheet picker. |
| Selection, row targeting, replace/remove | Proven | VS03 directly proves targeting, reindexing, exact-one reopen, and replacement on 5.0.165. |
| Multi-step progression and persistence | Proven | VS03 proves Step 1 to exact-one Step 2 flow, retained selections, Done, and restored session state. |
| Close, Escape, body lock, scrolling/focus | Proven | VS03 directly proves Escape/body lock; HS17 proves the shared picker scroll/backdrop/focus contract. |
| CTA, discounts, totals, validation | Proven | VS03 proves 5%/10% totals and exact-one validation; VS04 proves the non-dismissible body-owned modal toast fixed to the viewport bottom. |
| Loading ownership | Proven | The primary metafield path renders directly at the final Vertical root; HS07 proves the shared modal-widget overlay for delayed paths. A throttled cached pass showed no displaced intermediate root. |
| Cross-template leakage | Proven | VS04 responsive sweep plus the final live four-template regression and focused shared-template tests. |
| Restoration | Proven | Final EB/WPB state is `SIMPLIFIED`, zero filled rows, original three empty rows, default theme width. |

Vertical Slots satisfies the per-template completion criteria in
`broader-PPB-template-parity.md`.
