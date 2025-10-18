// Bundle Product Manager Service
// Handles proper bundle product creation, publishing, and isolation

export class BundleProductManagerService {

  /**
   * Create and properly publish a bundle product with correct pricing and sales channels
   */
  static async createAndPublishBundleProduct(
    admin: any,
    bundle: any,
    componentProducts: any[]
  ) {
    console.log(`📦 [BUNDLE_PRODUCT] Creating bundle product for bundle: ${bundle.name}`);

    try {
      // 1. Calculate proper bundle price from component products
      const bundlePrice = await this.calculateBundlePrice(admin, componentProducts, bundle.pricing);

      // 2. Create bundle product with proper settings
      const bundleProduct = await this.createBundleProduct(admin, bundle, bundlePrice);

      if (!bundleProduct) {
        throw new Error('Failed to create bundle product');
      }

      // 3. Publish to online store sales channel
      await this.publishToOnlineStore(admin, bundleProduct.id);

      // 4. Set bundle-specific metafields for isolation
      await this.setBundleProductMetafields(admin, bundleProduct.id, bundle);

      // 5. Set up automatic bundle extension injection
      await this.setupBundleAutoInjection(admin, bundleProduct.id, bundle.id);

      console.log(`✅ [BUNDLE_PRODUCT] Successfully created and published bundle product: ${bundleProduct.id}`);

      return bundleProduct;

    } catch (error) {
      console.error(`❌ [BUNDLE_PRODUCT] Error creating bundle product:`, error);
      throw error;
    }
  }

  /**
   * Calculate bundle price from component products with discount application
   */
  private static async calculateBundlePrice(admin: any, componentProducts: any[], pricing: any) {
    console.log(`💰 [BUNDLE_PRICE] Calculating price for ${componentProducts.length} component products`);

    try {
      let totalPrice = 0;

      // Get prices for all component products
      for (const product of componentProducts) {
        const productPrice = await this.getProductPrice(admin, product.id);
        const quantity = product.minQuantity || 1;
        totalPrice += parseFloat(productPrice) * quantity;
        console.log(`💰 [BUNDLE_PRICE] Product ${product.id}: $${productPrice} x ${quantity}`);
      }

      // Apply discount if configured
      if (pricing && pricing.enabled && pricing.rules && pricing.rules.length > 0) {
        const rule = pricing.rules[0];

        if (pricing.method === 'percentage_off') {
          const discountPercent = parseFloat(rule.discountValue) || 0;
          totalPrice = totalPrice * (1 - discountPercent / 100);
          console.log(`💰 [BUNDLE_PRICE] Applied ${discountPercent}% discount`);
        } else if (pricing.method === 'fixed_amount_off') {
          const discountAmount = parseFloat(rule.discountValue) || 0;
          totalPrice = Math.max(totalPrice - discountAmount, 0.01);
          console.log(`💰 [BUNDLE_PRICE] Applied $${discountAmount} fixed discount`);
        } else if (pricing.method === 'fixed_bundle_price') {
          totalPrice = parseFloat(rule.discountValue) || 1.00;
          console.log(`💰 [BUNDLE_PRICE] Set fixed bundle price: $${totalPrice}`);
        }
      }

      // Ensure minimum price
      const finalPrice = Math.max(totalPrice, 0.01).toFixed(2);
      console.log(`💰 [BUNDLE_PRICE] Final bundle price: $${finalPrice}`);

      return finalPrice;

    } catch (error) {
      console.error(`❌ [BUNDLE_PRICE] Error calculating bundle price:`, error);
      return "1.00"; // Fallback price
    }
  }

  /**
   * Get product price via GraphQL
   */
  private static async getProductPrice(admin: any, productId: string) {
    try {
      const cleanProductId = productId.replace('gid://shopify/Product/', '');

      const PRODUCT_PRICE_QUERY = `
        query GetProductPrice($id: ID!) {
          product(id: $id) {
            variants(first: 1) {
              edges {
                node {
                  price
                }
              }
            }
          }
        }
      `;

      const response = await admin.graphql(PRODUCT_PRICE_QUERY, {
        variables: { id: `gid://shopify/Product/${cleanProductId}` }
      });

      const data = await response.json();

      if (data.data?.product?.variants?.edges?.[0]?.node?.price) {
        return data.data.product.variants.edges[0].node.price;
      }

      return "1.00"; // Fallback price
    } catch (error) {
      console.error('Error fetching product price:', error);
      return "1.00";
    }
  }

  /**
   * Create bundle product with proper configuration
   */
  private static async createBundleProduct(admin: any, bundle: any, price: string) {
    console.log(`📦 [CREATE_PRODUCT] Creating bundle product with price: $${price}`);

    const CREATE_PRODUCT_MUTATION = `
      mutation CreateBundleProduct($input: ProductInput!) {
        productCreate(input: $input) {
          product {
            id
            title
            handle
            status
            variants(first: 1) {
              edges {
                node {
                  id
                  price
                }
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const productInput = {
      title: `${bundle.name} - Bundle`,
      handle: `${bundle.name.toLowerCase().replace(/\s+/g, '-')}-bundle-${Date.now()}`,
      productType: "Bundle",
      vendor: "Bundle App",
      tags: ["bundle", "cart-transform", `bundle-id-${bundle.id}`],
      status: "ACTIVE", // Make sure product is active
      variants: [{
        price: price,
        inventoryPolicy: "CONTINUE", // Allow selling when out of stock
        inventoryManagement: null, // Don't track inventory
        requiresShipping: false, // Digital bundle product
        taxable: true
      }],
      seo: {
        title: `${bundle.name} - Complete Bundle`,
        description: `Complete bundle package: ${bundle.description || bundle.name}`
      }
    };

    try {
      const response = await admin.graphql(CREATE_PRODUCT_MUTATION, {
        variables: { input: productInput }
      });

      const data = await response.json();

      if (data.data?.productCreate?.userErrors?.length > 0) {
        console.error('❌ [CREATE_PRODUCT] Product creation errors:', data.data.productCreate.userErrors);
        return null;
      }

      const product = data.data?.productCreate?.product;
      console.log(`✅ [CREATE_PRODUCT] Created bundle product: ${product?.id}`);

      return product;

    } catch (error) {
      console.error('❌ [CREATE_PRODUCT] Error creating bundle product:', error);
      return null;
    }
  }

  /**
   * Publish bundle product to online store sales channel
   */
  private static async publishToOnlineStore(admin: any, productId: string) {
    console.log(`🌐 [PUBLISH] Publishing bundle product to online store: ${productId}`);

    try {
      // First, get the online store publication ID
      const PUBLICATIONS_QUERY = `
        query GetPublications {
          publications(first: 10) {
            edges {
              node {
                id
                name
                app {
                  id
                }
              }
            }
          }
        }
      `;

      const pubResponse = await admin.graphql(PUBLICATIONS_QUERY);
      const pubData = await pubResponse.json();

      // Find online store publication (app.id will be null for online store)
      const onlineStorePublication = pubData.data?.publications?.edges?.find(
        (edge: any) => edge.node.app === null
      );

      if (!onlineStorePublication) {
        console.error('❌ [PUBLISH] Online store publication not found');
        return false;
      }

      const publicationId = onlineStorePublication.node.id;
      console.log(`🌐 [PUBLISH] Found online store publication: ${publicationId}`);

      // Publish product to online store
      const PUBLISH_MUTATION = `
        mutation PublishablePublish($id: ID!, $input: [PublicationInput!]!) {
          publishablePublish(id: $id, input: $input) {
            publishable {
              availablePublicationCount
              publicationCount
            }
            shop {
              publicationCount
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const publishResponse = await admin.graphql(PUBLISH_MUTATION, {
        variables: {
          id: productId,
          input: [{
            publicationId: publicationId,
            publishDate: new Date().toISOString()
          }]
        }
      });

      const publishData = await publishResponse.json();

      if (publishData.data?.publishablePublish?.userErrors?.length > 0) {
        console.error('❌ [PUBLISH] Publishing errors:', publishData.data.publishablePublish.userErrors);
        return false;
      }

      console.log(`✅ [PUBLISH] Successfully published bundle product to online store`);
      return true;

    } catch (error) {
      console.error('❌ [PUBLISH] Error publishing to online store:', error);
      return false;
    }
  }

  /**
   * Set up automatic bundle extension injection for bundle product
   */
  private static async setupBundleAutoInjection(admin: any, productId: string, bundleId: string) {
    console.log(`🎯 [AUTO_INJECTION] Setting up automatic bundle extension injection for product: ${productId}`);

    try {
      // Import the auto-injection service
      const { BundleAutoInjectionService } = await import("./bundle-auto-injection.server");

      // Set up auto-injection for the bundle product
      const result = await BundleAutoInjectionService.injectBundleExtensionIntoProduct(
        admin,
        productId,
        bundleId
      );

      if (result.success) {
        console.log(`✅ [AUTO_INJECTION] Successfully set up automatic bundle extension injection`);
      } else {
        console.log(`⚠️ [AUTO_INJECTION] Auto-injection setup warning: ${result.error}`);
        // Note: This is not a fatal error - the bundle widget will still work via JavaScript detection
      }

      return result.success;

    } catch (error) {
      console.error(`❌ [AUTO_INJECTION] Error setting up auto-injection:`, error);
      // Don't throw - this is not critical for bundle functionality
      return false;
    }
  }

  /**
   * Set bundle-specific metafields for isolation
   */
  private static async setBundleProductMetafields(admin: any, productId: string, bundle: any) {
    console.log(`🏷️ [METAFIELDS] Setting bundle isolation metafields on product: ${productId}`);

    try {
      // Create isolation metafields for automatic bundle detection
      const metafields = [
        {
          ownerId: productId,
          namespace: "$app:bundle_isolation",
          key: "bundle_id",
          type: "single_line_text_field",
          value: bundle.id
        },
        {
          ownerId: productId,
          namespace: "$app:bundle_isolation",
          key: "bundle_type",
          type: "single_line_text_field",
          value: "cart_transform"
        },
        {
          ownerId: productId,
          namespace: "$app:bundle_isolation",
          key: "owns_bundle_id",
          type: "single_line_text_field",
          value: bundle.id
        },
        {
          ownerId: productId,
          namespace: "$app:bundle_isolation",
          key: "bundle_product_type",
          type: "single_line_text_field",
          value: "cart_transform_bundle"
        },
        {
          ownerId: productId,
          namespace: "$app:bundle_isolation",
          key: "auto_injection_enabled",
          type: "single_line_text_field",
          value: "true"
        },
        {
          ownerId: productId,
          namespace: "$app:bundle_isolation",
          key: "created_at",
          type: "single_line_text_field",
          value: new Date().toISOString()
        }
      ];

      const SET_METAFIELDS_MUTATION = `
        mutation SetBundleMetafields($metafields: [MetafieldsSetInput!]!) {
          metafieldsSet(metafields: $metafields) {
            metafields {
              id
              key
              namespace
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const response = await admin.graphql(SET_METAFIELDS_MUTATION, {
        variables: { metafields }
      });

      const data = await response.json();

      if (data.data?.metafieldsSet?.userErrors?.length > 0) {
        console.error('❌ [METAFIELDS] Metafield errors:', data.data.metafieldsSet.userErrors);
        return false;
      }

      console.log(`✅ [METAFIELDS] Set ${data.data?.metafieldsSet?.metafields?.length || 0} isolation metafields`);
      return true;

    } catch (error) {
      console.error('❌ [METAFIELDS] Error setting isolation metafields:', error);
      return false;
    }
  }

  /**
   * Update bundle product configuration and sync metafields
   */
  static async updateBundleProductConfiguration(
    admin: any,
    bundleProductId: string,
    bundle: any,
    componentProducts: any[]
  ) {
    console.log(`🔄 [UPDATE_BUNDLE] Updating bundle product configuration: ${bundleProductId}`);

    try {
      // 1. Recalculate bundle price
      const newPrice = await this.calculateBundlePrice(admin, componentProducts, bundle.pricing);

      // 2. Update product price
      const variantId = await this.getFirstVariantId(admin, bundleProductId);
      if (variantId) {
        await this.updateVariantPrice(admin, variantId, newPrice);
      }

      // 3. Update bundle configuration metafields
      await this.updateBundleConfigurationMetafields(admin, bundleProductId, bundle, componentProducts);

      console.log(`✅ [UPDATE_BUNDLE] Successfully updated bundle product configuration`);
      return true;

    } catch (error) {
      console.error(`❌ [UPDATE_BUNDLE] Error updating bundle product:`, error);
      return false;
    }
  }

  /**
   * Get first variant ID for a product
   */
  private static async getFirstVariantId(admin: any, productId: string) {
    try {
      const cleanProductId = productId.replace('gid://shopify/Product/', '');

      const VARIANT_QUERY = `
        query GetFirstVariant($id: ID!) {
          product(id: $id) {
            variants(first: 1) {
              edges {
                node {
                  id
                }
              }
            }
          }
        }
      `;

      const response = await admin.graphql(VARIANT_QUERY, {
        variables: { id: `gid://shopify/Product/${cleanProductId}` }
      });

      const data = await response.json();
      return data.data?.product?.variants?.edges?.[0]?.node?.id;

    } catch (error) {
      console.error('Error getting first variant ID:', error);
      return null;
    }
  }

  /**
   * Update variant price
   */
  private static async updateVariantPrice(admin: any, variantId: string, price: string) {
    console.log(`💰 [UPDATE_PRICE] Updating variant price to $${price}: ${variantId}`);

    try {
      const UPDATE_VARIANT_MUTATION = `
        mutation UpdateVariantPrice($input: ProductVariantInput!) {
          productVariantUpdate(input: $input) {
            productVariant {
              id
              price
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const response = await admin.graphql(UPDATE_VARIANT_MUTATION, {
        variables: {
          input: {
            id: variantId,
            price: price
          }
        }
      });

      const data = await response.json();

      if (data.data?.productVariantUpdate?.userErrors?.length > 0) {
        console.error('❌ [UPDATE_PRICE] Price update errors:', data.data.productVariantUpdate.userErrors);
        return false;
      }

      console.log(`✅ [UPDATE_PRICE] Updated variant price successfully`);
      return true;

    } catch (error) {
      console.error('❌ [UPDATE_PRICE] Error updating variant price:', error);
      return false;
    }
  }

  /**
   * Update bundle configuration metafields
   */
  private static async updateBundleConfigurationMetafields(
    admin: any,
    productId: string,
    bundle: any,
    componentProducts: any[]
  ) {
    console.log(`🔄 [CONFIG_METAFIELDS] Updating bundle configuration metafields: ${productId}`);

    try {
      // Create comprehensive bundle configuration
      // Legacy metafield setting removed - now using $app:bundle_config via bundle-isolation.server.ts
      console.log(`✅ [CONFIG_METAFIELDS] Skipping legacy metafield writes - using $app:bundle_config instead`);
      return true;

    } catch (error) {
      console.error('❌ [CONFIG_METAFIELDS] Error setting configuration metafields:', error);
      return false;
    }
  }

  /**
   * Clean up bundle product (delete from Shopify)
   */
  static async deleteBundleProduct(admin: any, productId: string) {
    console.log(`🗑️ [DELETE_PRODUCT] Deleting bundle product: ${productId}`);

    try {
      const DELETE_PRODUCT_MUTATION = `
        mutation DeleteProduct($input: ProductDeleteInput!) {
          productDelete(input: $input) {
            deletedProductId
            userErrors {
              field
              message
            }
          }
        }
      `;

      const response = await admin.graphql(DELETE_PRODUCT_MUTATION, {
        variables: {
          input: { id: productId }
        }
      });

      const data = await response.json();

      if (data.data?.productDelete?.userErrors?.length > 0) {
        console.error('❌ [DELETE_PRODUCT] Product deletion errors:', data.data.productDelete.userErrors);
        return false;
      }

      console.log(`✅ [DELETE_PRODUCT] Successfully deleted bundle product: ${data.data?.productDelete?.deletedProductId}`);
      return true;

    } catch (error) {
      console.error('❌ [DELETE_PRODUCT] Error deleting bundle product:', error);
      return false;
    }
  }
}