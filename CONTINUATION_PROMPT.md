# Bundle Header Implementation - Continuation Prompt

## Context

You are continuing work on implementing the **Bundle Header** section in the Design Control Panel (DCP) for a Shopify app. The Bundle Header has two subsections:
1. **Tabs** - For styling tab buttons (active/inactive background and text colors, border radius)
2. **Header Text** - For styling the conditions text and discount text

## What Has Been Completed

### 1. State Management & Defaults ✅
- Added state variables in `app/routes/app.design-control-panel.tsx`:
  - `conditionsTextColor`, `conditionsTextFontSize`
  - `discountTextColor`, `discountTextFontSize`
- Added default values for both `product_page` and `full_page` bundle types (lines ~185-195 and ~311-321)

### 2. Preview Sections ✅
- Added preview for `headerText` subsection (lines ~1885-1945) - shows conditions text and discount text with labels
- Added placeholder preview for `headerTabs` subsection (lines ~1866-1883) - **currently just an empty box that needs implementation**

### 3. Form Sections ✅
- Implemented form controls for `headerTabs` (lines ~3317-3358) with ColorPicker components and RangeSlider
- Implemented form controls for `headerText` (lines ~3360-3398) with ColorPicker and RangeSlider components

### 4. Change Tracking ✅
- Added header text variables to `hasUnsavedChanges` comparison (lines ~940-943)
- Added to dependency array (lines ~1020-1023)
- Added to discard changes function (lines ~1113-1116)

### 5. Settings Persistence ✅
- Added header text settings to `generalSettings` object in action function (lines ~540-544)
- CSS variables added to `api.design-settings.$shopDomain.tsx` (lines ~266-270)

### 6. Navigation Structure ✅
- Navigation items are properly set up (lines ~4475-4494)

## What Remains To Be Done

### 1. **Implement Tabs Preview** (HIGH PRIORITY)
**Location**: `app/routes/app.design-control-panel.tsx` around line ~1866-1883

Currently, the `headerTabs` preview shows an empty placeholder box. You need to implement an actual preview that shows:
- Multiple tab buttons (e.g., "Step 1", "Step 2", "Step 3") displayed horizontally
- One tab should be active (using `headerTabActiveBgColor` and `headerTabActiveTextColor`)
- Other tabs should be inactive (using `headerTabInactiveBgColor` and `headerTabInactiveTextColor`)
- Border radius should be applied using `headerTabRadius`
- The preview should update in real-time as the user changes the settings

**Example Implementation Pattern**:
```tsx
<div style={{ display: "flex", gap: "12px", justifyContent: "center", alignItems: "center" }}>
  <button style={{
    backgroundColor: headerTabActiveBgColor,
    color: headerTabActiveTextColor,
    borderRadius: `${headerTabRadius}px`,
    padding: "10px 24px",
    border: "none",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer"
  }}>
    Step 1
  </button>
  <button style={{
    backgroundColor: headerTabInactiveBgColor,
    color: headerTabInactiveTextColor,
    borderRadius: `${headerTabRadius}px`,
    padding: "10px 24px",
    border: "1px solid #e5e7eb",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer"
  }}>
    Step 2
  </button>
  <button style={{
    backgroundColor: headerTabInactiveBgColor,
    color: headerTabInactiveTextColor,
    borderRadius: `${headerTabRadius}px`,
    padding: "10px 24px",
    border: "1px solid #e5e7eb",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer"
  }}>
    Step 3
  </button>
</div>
```

**Reference**: 
- Look at how other preview sections are implemented (e.g., the Bundle Footer previews around line ~1700-1850) for styling patterns
- The actual tab styling in `extensions/bundle-builder/assets/bundle-widget.css` (lines ~494-566) shows the expected appearance
- Figma design: https://www.figma.com/design/9XGXBSWVyyXHhDgPXsLkxw/new--Copy-?node-id=6-16217

### 2. **Verify Settings Loading in Loader**
**Location**: `app/routes/app.design-control-panel.tsx` around line ~397-436

The `mergeSettings` function spreads `generalSettings` at the end (line 434), which should include the header text settings. However, you should verify that:
- The settings are being properly extracted from `dbSettings.generalSettings`
- The defaults are being properly merged
- Test that saved settings are correctly loaded when the page refreshes

### 3. **Update bundle-widget-full.js to Use CSS Variables** (HIGH PRIORITY)
**Location**: `app/assets/bundle-widget-full.js`

The bundle widget needs to use the CSS variables for header text styling. 

**Current State**:
- Conditions text (`conditionText`) is generated in `calculateConditionData()` (around line ~554) and used in templates
- Discount text (`discountText`) is generated in `calculateDiscountData()` (around line ~557) and used in templates
- Both are displayed in the footer via `footer-discount-text` class (line ~1054, ~1298-1317)
- The footer uses templates like `discountTextTemplate` which includes both conditionText and discountText

**Tasks**:
1. **For Conditions Text**: 
   - The conditions text appears in the footer messaging (`.footer-discount-text`)
   - Add CSS classes or inline styles to apply:
     - `--bundle-conditions-text-color` for conditions text color
     - `--bundle-conditions-text-font-size` for conditions text font size
   - You may need to wrap the conditionText portion in a span with a specific class

2. **For Discount Text**:
   - The discount text also appears in `.footer-discount-text`
   - Add CSS classes or inline styles to apply:
     - `--bundle-discount-text-color` for discount text color
     - `--bundle-discount-text-font-size` for discount text font size
   - You may need to wrap the discountText portion in a span with a specific class

3. **Alternative Approach**:
   - Update the CSS file (`extensions/bundle-builder/assets/bundle-widget.css`) to use these CSS variables for `.footer-discount-text` or create separate classes
   - Or modify the template rendering in `updateFooterMessaging()` (around line ~1298) to wrap text portions in styled spans

**Note**: The CSS file is loaded from `/api/design-settings/{shopDomain}.css?bundleType=product_page` and should already include these variables (they were added in step 5 above).

### 4. **Verify Tab Styling in bundle-widget-full.js** (LOW PRIORITY - Already Done)
**Location**: `app/assets/bundle-widget-full.js` around line ~1664

✅ **Good News**: The tab styling is already implemented!
- CSS variables are already defined in `api.design-settings.$shopDomain.tsx` (lines ~211-215):
  - `--bundle-header-tab-active-bg`
  - `--bundle-header-tab-active-text`
  - `--bundle-header-tab-inactive-bg`
  - `--bundle-header-tab-inactive-text`
  - `--bundle-header-tab-radius`
- The CSS file (`extensions/bundle-builder/assets/bundle-widget.css`) already uses these variables (lines ~494-566)
- Tab buttons with class `.bundle-header-tab` will automatically use the styling

**Action**: Just verify that the tab buttons in `bundle-widget-full.js` have the correct class names and that the CSS is being loaded.

### 5. **Test the Implementation**
- Open the DCP modal and navigate to Bundle Header > Tabs
- Verify the preview updates when you change colors and border radius
- Navigate to Bundle Header > Header Text
- Verify the preview updates when you change colors and font sizes
- Save the settings and verify they persist
- Check the storefront to ensure the bundle widget uses the new styling

## File Structure Reference

- **Main DCP Component**: `app/routes/app.design-control-panel.tsx` (4592 lines)
- **CSS API Route**: `app/routes/api.design-settings.$shopDomain.tsx`
- **Bundle Widget**: `app/assets/bundle-widget-full.js`
- **Figma Design**: https://www.figma.com/design/9XGXBSWVyyXHhDgPXsLkxw/new--Copy-?node-id=6-16217

## Key Patterns to Follow

1. **Preview Implementation**: Look at other preview sections (e.g., Bundle Footer) for how to structure previews with labels and arrows pointing to elements
2. **CSS Variables**: All design settings should be exposed as CSS variables in the API route
3. **State Management**: Settings are stored in `generalSettings` JSON field in the database
4. **Real-time Updates**: Previews should update immediately when sliders/color pickers change

## Important Notes

- The header text settings are stored in `generalSettings` in the database
- The CSS variables are generated dynamically based on the shop domain and bundle type
- The bundle widget loads the CSS file and should use CSS variables for all styling
- Make sure to test with both `product_page` and `full_page` bundle types if applicable

## Summary of Remaining Work

### Critical Tasks (Must Complete)
1. ✅ **Tabs Preview** - Implement actual tab buttons preview in DCP (currently empty box)
2. ✅ **Header Text CSS Application** - Apply CSS variables to conditions/discount text in bundle-widget-full.js

### Verification Tasks (Should Complete)
3. ✅ **Settings Loading** - Verify settings are properly loaded from database
4. ✅ **End-to-End Testing** - Test the complete flow

### Already Complete ✅
- Tab CSS variables are defined and used in CSS file
- Tab styling is already implemented in the widget CSS
- Header text CSS variables are defined in API route
- All state management and form controls are implemented

## Next Steps (Recommended Order)

1. **Start with Task 1** - Implement the tabs preview (most visible missing piece, ~30 min)
2. **Then Task 3** - Update bundle-widget-full.js to use header text CSS variables (~45 min)
3. **Then Task 2** - Verify settings loading works correctly (~15 min)
4. **Finally Task 5** - Test everything end-to-end (~30 min)

**Total Estimated Time**: ~2 hours

Good luck! 🚀

