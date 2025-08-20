# Theme Editor Deep Links for Bundle Widget Setup

## Overview
These deep links provide merchants with one-click access to configure the Bundle Widget in their theme editor with pre-configured settings.

## Standard Deep Links

### Product Page Configuration
Configure bundle widget on product pages with recommended settings:

```
https://{shop}.myshopify.com/admin/themes/{theme_id}/editor?context=apps&activateAppId={app_id}
```

### Main Product Section Configuration
Add bundle widget to the main product section after description:

```
https://{shop}.myshopify.com/admin/themes/{theme_id}/editor?context=templates%2Fproduct&addAppBlockId={app_id}&sectionId=main-product&target=section
```

### Collection Page Configuration
Configure bundle widget for collection pages:

```
https://{shop}.myshopify.com/admin/themes/{theme_id}/editor?context=templates%2Fcollection&addAppBlockId={app_id}
```

### Homepage Configuration
Add bundle widget to homepage with recommended settings:

```
https://{shop}.myshopify.com/admin/themes/{theme_id}/editor?context=templates%2Findex&addAppBlockId={app_id}
```

## Pre-configured Deep Links

### Recommended Product Page Setup
Product page with optimized settings for conversion:

```
https://{shop}.myshopify.com/admin/themes/{theme_id}/editor?context=templates%2Fproduct&addAppBlockId={app_id}&sectionId=main-product&target=section&presets=product_optimized
```

**Pre-configured Settings:**
- Position: After product description
- Container width: 100%
- Show bundle title: true
- Show step numbers: true
- Footer messaging: enabled
- Progress bar colors: Brand colors

### Collection Browse Setup
Collection page with minimal footer messaging:

```
https://{shop}.myshopify.com/admin/themes/{theme_id}/editor?context=templates%2Fcollection&addAppBlockId={app_id}&presets=collection_minimal
```

**Pre-configured Settings:**
- Position: After product form
- Container width: 90%
- Show bundle title: true
- Show step numbers: false
- Footer messaging: enabled (minimal)
- Compact layout

### Homepage Featured Setup
Homepage with promotional banner style:

```
https://{shop}.myshopify.com/admin/themes/{theme_id}/editor?context=templates%2Findex&addAppBlockId={app_id}&presets=homepage_featured
```

**Pre-configured Settings:**
- Position: After title
- Container width: 100%
- Show bundle title: true
- Show step numbers: true
- Footer messaging: enabled (prominent)
- Promotional styling

## Custom Configuration Deep Links

### Footer Messaging Customization
Direct access to footer discount messaging color settings:

```
https://{shop}.myshopify.com/admin/themes/{theme_id}/editor?context=apps&activateAppId={app_id}&focusSettings=footer_discount_messaging
```

**Available Customizations:**
- Footer background color
- Footer border color
- Footer text color
- Progress bar color
- Progress bar background
- Savings badge color

### Advanced Widget Positioning
Configure widget placement with all position options:

```
https://{shop}.myshopify.com/admin/themes/{theme_id}/editor?context=templates%2Fproduct&addAppBlockId={app_id}&sectionId=main-product&focusSettings=positioning
```

## Implementation Instructions

### For App Developers

1. **Replace Variables:**
   - `{shop}`: Merchant's shop domain (without .myshopify.com)
   - `{theme_id}`: Current theme ID from Shopify API
   - `{app_id}`: Your app's ID from Partners Dashboard

2. **Get Theme ID:**
   ```graphql
   query getCurrentTheme {
     shop {
       id
     }
     themes(first: 1, query: "role:main") {
       edges {
         node {
           id
           name
           role
         }
       }
     }
   }
   ```

3. **Generate Deep Link:**
   ```javascript
   function generateThemeEditorLink(shop, themeId, appId, context = 'apps') {
     const baseUrl = `https://${shop}.myshopify.com/admin/themes/${themeId}/editor`;
     const params = new URLSearchParams({
       context: context,
       activateAppId: appId
     });
     return `${baseUrl}?${params.toString()}`;
   }
   ```

### For Merchants

1. **Manual Setup:**
   - Copy the appropriate deep link
   - Replace `{shop}` with your store name
   - Replace `{theme_id}` with your theme ID (available in URL when editing theme)
   - Replace `{app_id}` with the app ID (provided by app developer)

2. **Automated Setup:**
   - Use the deep links provided by the app after installation
   - Click the "Configure Widget" button in the app admin
   - Follow the guided setup process

## Theme Editor Parameters

### Standard Parameters
- `context`: Template context (apps, templates/product, templates/collection, templates/index)
- `activateAppId`: App ID to activate and focus
- `addAppBlockId`: Add app block automatically
- `sectionId`: Target section ID for app block
- `target`: Target type (section, head, body)

### Custom Parameters
- `presets`: Pre-configured setting preset name
- `focusSettings`: Focus on specific settings group
- `autoSave`: Automatically save changes (true/false)

## Troubleshooting Deep Links

### Common Issues
1. **Link doesn't work:**
   - Verify theme supports app blocks (Online Store 2.0)
   - Check theme ID is correct
   - Ensure app ID is valid

2. **Widget doesn't appear:**
   - Confirm template supports app blocks
   - Check enabled_on settings in widget schema
   - Verify section has app block support

3. **Settings not applied:**
   - Check preset configuration exists
   - Verify setting IDs match schema
   - Clear browser cache and retry

### Debug Mode Links
Add debug parameter for troubleshooting:

```
https://{shop}.myshopify.com/admin/themes/{theme_id}/editor?context=apps&activateAppId={app_id}&debug=true
```

## Best Practices

### Link Generation
1. **Always validate inputs** before generating links
2. **Use HTTPS** for all deep links
3. **Encode parameters** properly for URL safety
4. **Provide fallback** if deep link fails

### User Experience
1. **Open in new tab** to preserve app context
2. **Show loading state** while theme editor loads
3. **Provide clear instructions** after redirect
4. **Include success confirmation** flow

### Security
1. **Validate shop domains** before redirecting
2. **Check app installation** status first
3. **Use secure parameter passing** for sensitive data
4. **Implement proper error handling**

---

## Integration Examples

### React Component
```jsx
const ThemeEditorLink = ({ shop, themeId, appId, children }) => {
  const link = `https://${shop}.myshopify.com/admin/themes/${themeId}/editor?context=apps&activateAppId=${appId}`;
  
  return (
    <a href={link} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
};
```

### Remix Action
```typescript
export async function action({ request }: ActionFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);
  
  // Get current theme
  const themesResponse = await admin.graphql(`
    query getCurrentTheme {
      themes(first: 1, query: "role:main") {
        edges {
          node {
            id
            name
          }
        }
      }
    }
  `);
  
  const themes = await themesResponse.json();
  const themeId = themes.data.themes.edges[0]?.node.id;
  
  // Generate deep link
  const deepLink = generateThemeEditorLink(session.shop, themeId, APP_ID);
  
  return json({ deepLink });
}
```

---

*Last updated: August 2025*
*For support with theme editor integration, contact our development team*