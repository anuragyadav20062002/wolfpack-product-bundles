# Design Control Panel (DCP) - Testing Guide

## Overview
This guide will help you test the newly implemented Design Control Panel, which allows you to customize the visual appearance of your product bundles.

## What Was Implemented

### 1. **Database Schema** (`prisma/schema.prisma`)
- New `DesignSettings` model that stores design configurations
- Supports multiple bundle types (product_page, full_page)
- Scalable architecture - adding new bundle types doesn't require schema changes

### 2. **Design Control Panel UI** (`app/routes/app.design-control-panel.tsx`)
- Full UI with collapsible sections
- Bundle type selector (Product Page vs Full Page)
- Four active customization sections:
  - Product Card
  - Product Card Typography
  - Button
  - Quantity Selector

### 3. **CSS API Endpoint** (`app/routes/api.design-settings.$shopDomain.css.tsx`)
- Dynamic CSS generation from design settings
- Returns CSS variables that override bundle styles
- Cached for performance

### 4. **Widget Integration** (`app/assets/bundle-widget-full.js`)
- Automatically loads design CSS on initialization
- Injects custom styles into the page
- Falls back gracefully if CSS fails to load

---

## Testing Steps

### Step 1: Setup Database (Skip for Now - Using Mock Data)

We're currently using mock data, so you can skip database migration for now. When ready to connect to the database:

```bash
# Generate Prisma client with new schema
npx prisma generate

# Create migration (optional - only if you want to persist to DB)
npx prisma migrate dev --name add_design_settings
```

### Step 2: Access the Design Control Panel

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Navigate to the DCP:**
   - Open your Shopify app
   - Click on "Design Control Panel" in the navigation menu
   - URL: `http://localhost:YOUR_PORT/app/design-control-panel`

### Step 3: Test Product Card Section

#### **3.1 Background Color**
1. Open the "Product Card" section (should be open by default)
2. Click on the "Background Color" picker
3. Change the color to something distinctive (e.g., `#FFE5E5` - light pink)
4. Note the hex value displayed below the color picker
5. Click "Save Settings"

**Expected Result:** Settings saved message appears

#### **3.2 Font Size**
1. Use the "Font Size" slider
2. Drag to 20px
3. Click "Save Settings"

#### **3.3 Image Fit**
1. Select different options: Cover, Contain, Fill
2. Test with "Contain"
3. Click "Save Settings"

#### **3.4 Cards Per Row**
1. Change from 3 to 2
2. Click "Save Settings"

### Step 4: Test Product Card Typography Section

1. **Click on "Product Card Typography" to expand it**

2. **Product Font Color:**
   - Change to `#FF0000` (red)
   - Save settings

3. **Price Visibility:**
   - Uncheck "Product Price Visibility"
   - Save settings

4. **Strikethrough Price:**
   - Change color to `#999999`
   - Adjust font size to 12px
   - Save settings

5. **Final Price:**
   - Change color to `#00AA00` (green)
   - Set font size to 22px
   - Set font weight to 700
   - Save settings

### Step 5: Test Button Section

1. **Expand "Button" section**

2. **Colors:**
   - Background: `#7132FF` (purple)
   - Text: `#FFFFFF` (white)
   - Save settings

3. **Border Radius:**
   - Drag slider to 16px for fully rounded
   - Or set to 0px for sharp corners
   - Save settings

4. **Button Text:**
   - Change from "Add to cart" to "Add Bundle to Cart"
   - Save settings

### Step 6: Test Quantity Selector Section

1. **Expand "Quantity Selector" section**

2. **Colors:**
   - Background: `#000000`
   - Text: `#FFFFFF`
   - Save settings

3. **Styling:**
   - Font size: 18px
   - Border radius: 12px
   - Save settings

### Step 7: Test Bundle Type Switching

1. **Switch to "Full Page Bundle"** using the dropdown at the top
2. Notice different default values load
3. Make some changes to Full Page settings
4. Save settings
5. Switch back to "Product Page Bundle"
6. Confirm your Product Page settings are still there

**Expected Result:** Each bundle type maintains its own independent settings

### Step 8: Test Reset to Default

1. Make several changes to your settings
2. Click "Reset to Default" button
3. Verify all settings return to their original values

### Step 9: Verify CSS Generation

1. **Open the CSS endpoint in your browser:**
   ```
   http://localhost:YOUR_PORT/api/design-settings/YOUR_SHOP_DOMAIN.css?bundleType=product_page
   ```
   Replace `YOUR_SHOP_DOMAIN` with your test shop domain (e.g., `mytest-store.myshopify.com`)

2. **Check the CSS content:**
   - You should see CSS variables like:
     ```css
     :root {
       --bundle-product-card-bg-color: #FFFFFF;
       --bundle-button-bg-color: #000000;
       /* etc */
     }
     ```

3. **Verify your custom values appear:**
   - If you changed background to pink, you should see `--bundle-product-card-bg-color: #FFE5E5;`

### Step 10: Test Widget Integration (Development Store)

⚠️ **Note:** This requires deploying to a development store

1. **Deploy your app to a development store**

2. **Create a test bundle** (or use existing bundle)

3. **Visit the product page** where the bundle widget appears

4. **Open browser DevTools:**
   - Go to Network tab
   - Filter by CSS
   - Refresh the page
   - Look for request to `api/design-settings/YOUR_SHOP.css`

5. **Check if CSS was injected:**
   - In DevTools Elements tab
   - Check `<head>` section
   - Look for: `<link id="bundle-design-settings-css" ... >`

6. **Inspect product card styles:**
   - Right-click on a product card in the bundle widget
   - Select "Inspect"
   - Check computed styles
   - Verify CSS variables are applied

---

## Verification Checklist

### UI Functionality
- [ ] Design Control Panel page loads without errors
- [ ] Bundle type selector works
- [ ] All collapsible sections open/close properly
- [ ] Color pickers function correctly
- [ ] Range sliders update values
- [ ] Text fields accept input
- [ ] "Save Settings" button works
- [ ] "Reset to Default" button works

### Data Persistence (Mock Data - Console Only)
- [ ] Saving settings logs to console
- [ ] Settings persist when switching sections
- [ ] Different bundle types have independent settings
- [ ] Reset restores original values

### CSS Generation
- [ ] API endpoint returns valid CSS
- [ ] CSS variables match DCP settings
- [ ] Proper caching headers present
- [ ] CSS updates when settings change

### Widget Integration
- [ ] Widget loads design CSS automatically
- [ ] CSS link appears in document head
- [ ] No console errors related to design CSS
- [ ] Fallback works if CSS fails to load

---

## Common Issues & Troubleshooting

### Issue 1: DCP Page Doesn't Load
**Solution:**
- Check console for errors
- Verify route is registered in `app/routes/app.tsx`
- Ensure navigation link exists

### Issue 2: CSS API Returns 404
**Solution:**
- Check route file exists: `app/routes/api.design-settings.$shopDomain.css.tsx`
- Verify URL format: `/api/design-settings/SHOP_DOMAIN.css`
- Check server logs for errors

### Issue 3: Settings Don't Save
**Solution:**
- Open browser DevTools Network tab
- Click "Save Settings"
- Check for POST request to `/app/design-control-panel`
- Look for errors in response
- Check server console logs

### Issue 4: CSS Not Applied to Widget
**Solution:**
- Verify shop domain is available: `window.Shopify.shop`
- Check app URL is set correctly in widget container
- Inspect Network tab for CSS request
- Look for CORS errors
- Verify CSS endpoint allows cross-origin requests

### Issue 5: Color Picker Not Working
**Solution:**
- Ensure you're using a modern browser (Chrome, Firefox, Edge)
- Check Polaris version compatibility
- Try clicking directly on the color swatch

---

## Next Steps

### Phase 1: Database Integration (TODO)
1. Run Prisma migration to create `DesignSettings` table
2. Uncomment database code in:
   - `app/routes/app.design-control-panel.tsx` (loader & action)
   - `app/routes/api.design-settings.$shopDomain.css.tsx` (loader)
3. Create database service: `app/services/designSettings.server.ts`
4. Test full CRUD operations

### Phase 2: Remaining Sections (TODO)
Add implementation for:
- Bundle Footer customization
- Bundle Step Bar styling
- General settings
- Images & GIFs options

### Phase 3: Advanced Features (TODO)
- Custom CSS editor
- Design templates/presets
- Import/export designs
- Preview panel with live updates
- Design history/versioning

---

## Quick Test Script

Run this after making changes to quickly verify everything works:

```bash
# 1. Start dev server
npm run dev

# 2. In browser DevTools Console, test CSS endpoint:
fetch('/api/design-settings/test-store.myshopify.com.css?bundleType=product_page')
  .then(r => r.text())
  .then(css => console.log(css))

# Expected: CSS with variables should be logged
```

---

## Support

If you encounter issues during testing:

1. Check this guide's troubleshooting section
2. Review console logs (browser + server)
3. Verify all files were created correctly
4. Check that bundle widget has shop domain available

---

## Summary

You've implemented a scalable Design Control Panel that:
- ✅ Supports multiple bundle types independently
- ✅ Has a clean, collapsible UI matching the Figma design
- ✅ Generates dynamic CSS from settings
- ✅ Automatically injects styles into bundle widgets
- ✅ Is ready for database integration
- ✅ Can be easily extended with new sections

**Current Status:** Fully functional with mock data, ready for database integration and testing on development store.
