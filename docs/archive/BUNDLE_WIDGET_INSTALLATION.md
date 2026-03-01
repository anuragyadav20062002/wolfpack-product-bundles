# Bundle Widget Installation Instructions

## Overview
The Bundle Widget allows customers to create product bundles directly on your store pages. After configuring your bundles in the admin, follow these instructions to add the widget to your theme.

## Prerequisites
- Your theme must support Online Store 2.0 (app blocks)
- You must have published at least one active bundle
- The bundle app must be installed on your store

## Installation Steps

### Step 1: Access the Theme Editor
1. Go to **Online Store** > **Themes** in your Shopify admin
2. Click **Customize** on your published theme
3. This will open the theme editor

### Step 2: Add the Bundle Widget Block

#### For Product Pages:
1. Navigate to a product page in the theme editor
2. In the left sidebar, look for **Add section** or **Add block** (depending on where you want to place it)
3. Click **Apps** section
4. Look for **Bundle Builder** and click to add it

#### For Collection Pages (Optional):
1. Navigate to a collection page in the theme editor
2. Follow the same steps as above
3. Make sure to enable "Show on collection pages" in the widget settings

#### For Homepage (Optional):
1. Navigate to your homepage in the theme editor
2. Follow the same steps as above
3. Make sure to enable "Show on homepage" in the widget settings

### Step 3: Configure Widget Settings

Once you've added the Bundle Builder block, you can configure these settings:

#### Basic Settings:
- **Enable bundle widget**: Turn the widget on/off
- **Widget position**: Choose where to display relative to product content
  - Before product title
  - After product title
  - After product description (recommended)
  - After add to cart form

#### Visibility Settings:
- **Show on collection pages**: Display widget on collection pages
- **Show on homepage**: Display widget on homepage
- **Bundle ID (optional)**: Force display of a specific bundle

#### Display Settings:
- **Container width**: Adjust the widget width (50-100%)
- **Show bundle title**: Display/hide the bundle name
- **Show step numbers**: Display/hide step numbering

### Step 4: Configure Bundle Visibility

To control which products show which bundles:

1. Go to your Bundle configuration in the admin
2. Configure bundle matching rules:
   - **Products**: Select specific products that should show this bundle
   - **Collections**: Select collections where products should show this bundle
3. Save your bundle configuration

### Step 5: Test the Widget

1. **Preview your changes** in the theme editor
2. Navigate to a product page that should show a bundle
3. Verify the widget appears and functions correctly
4. Test the bundle builder flow:
   - Click on bundle steps
   - Select products in the modal
   - Verify add to cart functionality

### Step 6: Publish Changes

1. Click **Save** in the theme editor
2. Your bundle widget is now live on your store!

## Advanced Configuration

### Custom Positioning
If you need more control over widget placement, you can:

1. Add the Bundle Builder as an app block to specific sections
2. Use the theme editor to position it exactly where needed
3. Configure different settings for different page types

### Multiple Bundle Widgets
You can add multiple Bundle Builder blocks to the same page with different configurations:

1. Add multiple Bundle Builder blocks
2. Set different Bundle IDs for each block
3. Configure different visibility settings

### Troubleshooting

#### Widget Not Showing:
- Verify your theme supports app blocks (Online Store 2.0)
- Check that you have active bundles published
- Ensure bundle matching rules include the current product/collection
- Verify widget is enabled in settings

#### Widget Shows But No Bundles:
- Check bundle matching configuration
- Verify bundles are set to "active" status
- Check bundle product/collection selections

#### JavaScript Errors:
- Check browser console for error messages
- Verify all bundle metafields are properly configured
- Contact support if issues persist

## Support

If you need help with installation:

1. Check the troubleshooting section above
2. Review your bundle configuration in the admin
3. Contact our support team with specific error messages

## Theme Compatibility

### Supported Themes:
- All Online Store 2.0 themes
- Dawn (Shopify's reference theme)
- Most modern third-party themes

### Unsupported Themes:
- Legacy/Vintage themes
- Themes without JSON template support
- Themes that don't support app blocks

If your theme is unsupported, consider:
- Upgrading to an Online Store 2.0 theme
- Using our legacy installation method (contact support)
- Switching to a compatible theme

## Best Practices

### Performance:
- Only enable the widget on pages where bundles are relevant
- Use specific Bundle IDs when showing featured bundles
- Limit bundle complexity for better performance

### User Experience:
- Place the widget after the product description for best conversion
- Enable bundle titles for clarity
- Test the complete bundle flow before going live

### Design:
- Adjust container width to match your theme's layout
- Use consistent positioning across similar pages
- Ensure the widget matches your store's design language

---

*Last updated: August 2025*
*For technical support, contact our development team*