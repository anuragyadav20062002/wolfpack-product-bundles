import { json } from "@remix-run/node";

export class ThemeTemplateService {
  private admin: any;
  private session: any;

  constructor(admin: any, session: any) {
    this.admin = admin;
    this.session = session;
  }

  /**
   * Ensure a product-specific template exists for a bundle container product
   */
  async ensureProductTemplate(productHandle: string): Promise<{
    success: boolean;
    templatePath?: string;
    created?: boolean;
    error?: string;
  }> {
    try {
      console.log(`🎨 [TEMPLATE_SERVICE] Ensuring template exists for product: ${productHandle}`);

      // First, get the published theme
      const theme = await this.getPublishedTheme();
      if (!theme.success) {
        return { success: false, error: `Failed to get published theme: ${theme.error}` };
      }

      const themeId = theme.themeId;
      const templatePath = `templates/product.${productHandle}.json`;

      // Check if template already exists
      const existsResult = await this.checkTemplateExists(themeId!, templatePath);
      if (existsResult.exists) {
        console.log(`✅ [TEMPLATE_SERVICE] Template already exists: ${templatePath}`);
        return {
          success: true,
          templatePath,
          created: false
        };
      }

      // Create the template
      const createResult = await this.createProductTemplate(themeId!, productHandle);
      if (createResult.success) {
        console.log(`🎉 [TEMPLATE_SERVICE] Successfully created template: ${templatePath}`);
        return {
          success: true,
          templatePath,
          created: true
        };
      } else {
        console.log(`ℹ️ [TEMPLATE_SERVICE] Template creation skipped: ${createResult.error}`);

        // Handle theme modification restriction gracefully
        if (createResult.error?.includes('THEME_MODIFICATION_RESTRICTED')) {
          return {
            success: true,
            templatePath: "theme-app-extension",
            created: false,
            error: createResult.error
          };
        } else {
          return {
            success: false,
            error: createResult.error
          };
        }
      }

    } catch (error) {
      console.error("🔥 [TEMPLATE_SERVICE] Unexpected error:", error);
      return {
        success: false,
        error: (error as Error).message || "Template creation failed"
      };
    }
  }

  /**
   * Get the published theme ID and info
   */
  async getPublishedTheme(): Promise<{
    success: boolean;
    themeId?: string;
    themeName?: string;
    error?: string;
  }> {
    try {
      const GET_PUBLISHED_THEME = `
        query getPublishedTheme {
          themes(first: 1, roles: [MAIN]) {
            nodes {
              id
              name
              role
            }
          }
        }
      `;

      const response = await this.admin.graphql(GET_PUBLISHED_THEME);
      const data = await response.json();

      if (data.data?.themes?.nodes?.[0]) {
        const theme = data.data.themes.nodes[0];
        const themeId = theme.id.replace('gid://shopify/OnlineStoreTheme/', '');

        console.log(`🎨 [TEMPLATE_SERVICE] Found published theme: ${theme.name} (ID: ${themeId})`);

        return {
          success: true,
          themeId,
          themeName: theme.name
        };
      } else {
        return {
          success: false,
          error: "No published theme found"
        };
      }
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message || "Failed to fetch theme"
      };
    }
  }

  /**
   * Check if a template file exists in the theme using GraphQL
   */
  async checkTemplateExists(themeId: string, templatePath: string): Promise<{
    exists: boolean;
    error?: string;
  }> {
    try {
      const CHECK_THEME_FILE = `
        query checkThemeFile($themeId: ID!, $filename: String!) {
          theme(id: $themeId) {
            files(first: 1, filenames: [$filename]) {
              nodes {
                filename
              }
            }
          }
        }
      `;

      const variables = {
        themeId: `gid://shopify/OnlineStoreTheme/${themeId}`,
        filename: templatePath
      };

      const response = await this.admin.graphql(CHECK_THEME_FILE, { variables });
      const data = await response.json();

      if (data.data?.theme?.files?.nodes?.length > 0) {
        console.log(`🔍 [TEMPLATE_SERVICE] Template ${templatePath} exists`);
        return { exists: true };
      } else {
        console.log(`🔍 [TEMPLATE_SERVICE] Template ${templatePath} does not exist`);
        return { exists: false };
      }
    } catch (error) {
      return {
        exists: false,
        error: (error as Error).message || "Failed to check template existence"
      };
    }
  }

  /**
   * Create a product-specific template with bundle widget pre-configured using GraphQL
   */
  async createProductTemplate(themeId: string, productHandle: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      console.log(`🚫 [TEMPLATE_SERVICE] Template creation disabled - Shopify restricts themeFilesUpsert API access`);
      console.log(`💡 [TEMPLATE_SERVICE] Merchants should use theme app extensions instead for bundle functionality`);

      // Return graceful failure with helpful message
      return {
        success: false,
        error: "THEME_MODIFICATION_RESTRICTED: Use theme app extensions to add bundle functionality to your theme. This is the recommended approach and requires no special permissions."
      };

      const templatePath = `templates/product.${productHandle}.json`;

      // Create a product template specifically designed for bundle container products
      const templateContent = {
        "sections": {
          "main": {
            "type": "main-product",
            "blocks": {
              "vendor": {
                "type": "text",
                "settings": {
                  "text": "{{ product.vendor }}",
                  "text_style": "subtitle"
                }
              },
              "title": {
                "type": "title",
                "settings": {}
              },
              "price": {
                "type": "price",
                "settings": {}
              },
              "variant_picker": {
                "type": "variant_picker",
                "settings": {
                  "picker_type": "button"
                }
              },
              "quantity_selector": {
                "type": "quantity_selector",
                "settings": {}
              },
              "description": {
                "type": "description",
                "settings": {}
              },
              "bundle_widget": {
                "type": "shopify://apps/bundle-builder/blocks/bundle/bundle",
                "settings": {
                  "enabled": true,
                  "bundle_id": "",
                  "show_bundle_title": true,
                  "show_step_numbers": true,
                  "show_footer_messaging": true,
                  "widget_max_width": 800,
                  "step_box_size": 150,
                  "step_cards_per_row": 3,
                  "button_height": 55,
                  "container_spacing": 20,
                  "element_spacing": 15,
                  "step_card_spacing": 15,
                  "button_spacing": 25
                }
              },
              "buy_buttons": {
                "type": "buy_buttons",
                "settings": {
                  "show_dynamic_checkout": false,
                  "show_gift_card_recipient": false
                }
              },
              "share": {
                "type": "share",
                "settings": {
                  "share_label": "Share"
                }
              }
            },
            "block_order": [
              "vendor",
              "title",
              "price",
              "variant_picker",
              "quantity_selector",
              "description",
              "bundle_widget",
              "buy_buttons",
              "share"
            ],
            "settings": {
              "enable_sticky_info": true,
              "color_scheme": "background-1",
              "media_size": "medium",
              "constrain_to_viewport": true,
              "media_fit": "contain",
              "gallery_layout": "stacked",
              "media_position": "left",
              "image_zoom": "lightbox",
              "mobile_thumbnails": "hide",
              "hide_variants": true,
              "enable_video_looping": false
            }
          },
          "product-recommendations": {
            "type": "product-recommendations",
            "settings": {
              "heading": "Complete your bundle",
              "heading_size": "h2",
              "products_to_show": 4,
              "columns_desktop": 4,
              "color_scheme": "background-1",
              "image_ratio": "square",
              "image_shape": "default",
              "show_secondary_image": true,
              "show_vendor": false,
              "show_rating": false,
              "columns_mobile": "2",
              "padding_top": 36,
              "padding_bottom": 28
            }
          }
        },
        "order": [
          "main",
          "product-recommendations"
        ]
      };

      const THEME_FILES_UPSERT = `
        mutation themeFilesUpsert($files: [OnlineStoreThemeFilesUpsertFileInput!]!, $themeId: ID!) {
          themeFilesUpsert(files: $files, themeId: $themeId) {
            upsertedThemeFiles {
              filename
              updatedAt
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const variables = {
        themeId: `gid://shopify/OnlineStoreTheme/${themeId}`,
        files: [
          {
            filename: templatePath,
            body: {
              type: "TEXT",
              value: JSON.stringify(templateContent, null, 2)
            }
          }
        ]
      };

      console.log(`🔧 [TEMPLATE_SERVICE] Creating template using GraphQL: ${templatePath}`);

      const response = await this.admin.graphql(THEME_FILES_UPSERT, { variables });
      const data = await response.json();

      if (data.data?.themeFilesUpsert?.upsertedThemeFiles?.length > 0) {
        console.log(`🎉 [TEMPLATE_SERVICE] Successfully created template: ${templatePath}`);
        return { success: true };
      } else if (data.data?.themeFilesUpsert?.userErrors?.length > 0) {
        const errors = data.data.themeFilesUpsert.userErrors.map((e: any) => e.message).join(', ');
        console.error(`❌ [TEMPLATE_SERVICE] GraphQL errors: ${errors}`);
        return {
          success: false,
          error: `GraphQL errors: ${errors}`
        };
      } else {
        const errorMsg = JSON.stringify(data.errors || data, null, 2);
        console.error(`❌ [TEMPLATE_SERVICE] Unexpected response: ${errorMsg}`);
        return {
          success: false,
          error: `Unexpected response: ${errorMsg}`
        };
      }
    } catch (error) {
      console.error("🔥 [TEMPLATE_SERVICE] Error creating template:", error);
      return {
        success: false,
        error: (error as Error).message || "Template creation failed"
      };
    }
  }
}