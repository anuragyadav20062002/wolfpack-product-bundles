# HS09: Mobile responsive slot evidence

**Viewport:** 390 x 844 mobile emulation, DPR 3

## EB

- Widget host: 360px
- Horizontal tracks: approximately 110.66px each
- Gap: 14px
- Empty-card height: 160px
- Document scroll width equals viewport width: 390px

## WPB before

- Slot section host: 358px
- Grid width: fixed 300px
- Horizontal tracks: approximately 89.33px each
- Gap: 16px
- Empty-card height: 200px
- No document overflow, but 58px of usable host width was left empty

## WPB after

- Slot section host: 358px
- Grid width: 358px
- Horizontal tracks: approximately 108.66px each
- Gap: 16px
- Document scroll width equals viewport width: 390px
- Served widget version: 5.0.151

The approximately 2px EB/WPB track difference follows directly from the two
themes' 360px and 358px hosts. Both now use the complete host and fluid three-
column tracks. No captured store width was encoded in source CSS.
