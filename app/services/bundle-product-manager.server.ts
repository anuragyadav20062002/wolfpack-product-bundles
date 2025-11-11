// Bundle Product Manager Service
// Handles proper bundle product creation, publishing, and isolation

import { AppLogger } from "../lib/logger";

export class BundleProductManagerService {

  /**
   * Create and properly publish a bundle product with correct pricing and sales channels
   */
  static async createAndPublishBundleProduct(
    admin: any,
    bundle: any,
    componentProducts: any[]
  ) {
    AppLogger.info('Creating bundle product for bundle', {
      component: 'bundle-product',
      operation: 'create-and-publish'
    }, { bundleName: bundle.name });

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

      AppLogger.info('Successfully created and published bundle product', {
        component: 'bundle-product',
        operation: 'create-and-publish'
      }, { productId: bundleProduct.id });

      return bundleProduct;

    } catch (error) {
      AppLogger.error('Error creating bundle product', {
        component: 'bundle-product',
        operation: 'create-and-publish'
      }, error);
      throw error;
    }
  }

  /**
   * Calculate bundle price from component products with discount application
   */
  private static async calculateBundlePrice(admin: any, componentProducts: any[], pricing: any) {
    AppLogger.info('Calculating price for component products', {
      component: 'bundle-product',
      operation: 'calculate-price'
    }, { productCount: componentProducts.length });

    try {
      let totalPrice = 0;

      // Get prices for all component products
      for (const product of componentProducts) {
        const productPrice = await this.getProductPrice(admin, product.id);
        const quantity = product.minQuantity || 1;
        totalPrice += parseFloat(productPrice) * quantity;
        AppLogger.debug('Product pricing', {
          component: 'bundle-product',
          operation: 'calculate-price'
        }, { productId: product.id, price: productPrice, quantity });
      }

      // Apply discount if configured
      if (pricing && pricing.enabled && pricing.rules && pricing.rules.length > 0) {
        const rule = pricing.rules[0];

        if (pricing.method === 'percentage_off') {
          const discountPercent = parseFloat(rule.discountValue) || 0;
          totalPrice = totalPrice * (1 - discountPercent / 100);
          AppLogger.debug('Applied percentage discount', {
            component: 'bundle-product',
            operation: 'calculate-price'
          }, { discountPercent });
        } else if (pricing.method === 'fixed_amount_off') {
          const discountAmount = parseFloat(rule.discountValue) || 0;
          totalPrice = Math.max(totalPrice - discountAmount, 0.01);
          AppLogger.debug('Applied fixed amount discount', {
            component: 'bundle-product',
            operation: 'calculate-price'
          }, { discountAmount });
        } else if (pricing.method === 'fixed_bundle_price') {
          totalPrice = parseFloat(rule.discountValue) || 1.00;
          AppLogger.debug('Set fixed bundle price', {
            component: 'bundle-product',
            operation: 'calculate-price'
          }, { totalPrice });
        }
      }

      // Ensure minimum price
      const finalPrice = Math.max(totalPrice, 0.01).toFixed(2);
      AppLogger.info('Final bundle price calculated', {
        component: 'bundle-product',
        operation: 'calculate-price'
      }, { finalPrice });

      return finalPrice;

    } catch (error) {
      AppLogger.error('Error calculating bundle price', {
        component: 'bundle-product',
        operation: 'calculate-price'
      }, error);
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
      AppLogger.error('Error fetching product price', {
        component: 'bundle-product',
        operation: 'get-product-price'
      }, error);
      return "1.00";
    }
  }

  /**
   * Create bundle product with proper configuration
   */
  private static async createBundleProduct(admin: any, bundle: any, price: string) {
    AppLogger.info('Creating bundle product with price', {
      component: 'bundle-product',
      operation: 'create-product'
    }, { price });

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
        AppLogger.error('Product creation errors', {
          component: 'bundle-product',
          operation: 'create-product'
        }, data.data.productCreate.userErrors);
        return null;
      }

      const product = data.data?.productCreate?.product;
      AppLogger.info('Created bundle product', {
        component: 'bundle-product',
        operation: 'create-product'
      }, { productId: product?.id });

      return product;

    } catch (error) {
      AppLogger.error('Error creating bundle product', {
        component: 'bundle-product',
        operation: 'create-product'
      }, error);
      return null;
    }
  }

  /**
   * Publish bundle product to online store sales channel
   */
  private static async publishToOnlineStore(admin: any, productId: string) {
    AppLogger.info('Publishing bundle product to online store', {
      component: 'bundle-product',
      operation: 'publish'
    }, { productId });

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
        AppLogger.error('Online store publication not found', {
          component: 'bundle-product',
          operation: 'publish'
        });
        return false;
      }

      const publicationId = onlineStorePublication.node.id;
      AppLogger.debug('Found online store publication', {
        component: 'bundle-product',
        operation: 'publish'
      }, { publicationId });

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
        AppLogger.error('Publishing errors', {
          component: 'bundle-product',
          operation: 'publish'
        }, publishData.data.publishablePublish.userErrors);
        return false;
      }

      AppLogger.info('Successfully published bundle product to online store', {
        component: 'bundle-product',
        operation: 'publish'
      });
      return true;

    } catch (error) {
      AppLogger.error('Error publishing to online store', {
        component: 'bundle-product',
        operation: 'publish'
      }, error);
      return false;
    }
  }

  /**
   * Set up automatic bundle extension injection for bundle product
   */
  private static async setupBundleAutoInjection(admin: any, productId: string, bundleId: string) {
    AppLogger.info('Setting up automatic bundle extension injection', {
      component: 'bundle-product',
      operation: 'setup-auto-injection',
      bundleId
    }, { productId });

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
        AppLogger.info('Successfully set up automatic bundle extension injection', {
          component: 'bundle-product',
          operation: 'setup-auto-injection',
          bundleId
        });
      } else {
        AppLogger.warn('Auto-injection setup warning', {
          component: 'bundle-product',
          operation: 'setup-auto-injection',
          bundleId
        }, { error: result.error });
        // Note: This is not a fatal error - the bundle widget will still work via JavaScript detection
      }

      return result.success;

    } catch (error) {
      AppLogger.error('Error setting up auto-injection', {
        component: 'bundle-product',
        operation: 'setup-auto-injection',
        bundleId
      }, error);
      // Don't throw - this is not critical for bundle functionality
      return false;
    }
  }

  /**
   * Set bundle-specific metafields for isolation
   */
  private static async setBundleProductMetafields(admin: any, productId: string, bundle: any) {
    AppLogger.info('Setting bundle isolation metafields on product', {
      component: 'bundle-product',
      operation: 'set-metafields'
    }, { productId });

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
        AppLogger.error('Metafield errors during isolation metafield setup', {
          component: 'bundle-product',
          operation: 'set-metafields'
        }, data.data.metafieldsSet.userErrors);
        return false;
      }

      AppLogger.info('Set isolation metafields', {
        component: 'bundle-product',
        operation: 'set-metafields'
      }, { count: data.data?.metafieldsSet?.metafields?.length || 0 });
      return true;

    } catch (error) {
      AppLogger.error('Error setting isolation metafields', {
        component: 'bundle-product',
        operation: 'set-metafields'
      }, error);
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
    AppLogger.info('Updating bundle product configuration', {
      component: 'bundle-product',
      operation: 'update-config'
    }, { bundleProductId });

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

      AppLogger.info('Successfully updated bundle product configuration', {
        component: 'bundle-product',
        operation: 'update-config'
      }, { bundleProductId });
      return true;

    } catch (error) {
      AppLogger.error('Error updating bundle product', {
        component: 'bundle-product',
        operation: 'update-config'
      }, error);
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
      AppLogger.error('Error getting first variant ID', {
        component: 'bundle-product',
        operation: 'get-variant-id'
      }, error);
      return null;
    }
  }

  /**
   * Update variant price
   */
  private static async updateVariantPrice(admin: any, variantId: string, price: string) {
    AppLogger.info('Updating variant price', {
      component: 'bundle-product',
      operation: 'update-price'
    }, { variantId, price });

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
        AppLogger.error('Price update errors', {
          component: 'bundle-product',
          operation: 'update-price'
        }, data.data.productVariantUpdate.userErrors);
        return false;
      }

      AppLogger.info('Updated variant price successfully', {
        component: 'bundle-product',
        operation: 'update-price'
      });
      return true;

    } catch (error) {
      AppLogger.error('Error updating variant price', {
        component: 'bundle-product',
        operation: 'update-price'
      }, error);
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
    AppLogger.info('Updating bundle configuration metafields', {
      component: 'bundle-product',
      operation: 'update-config-metafields'
    }, { productId });

    try {
      // Create comprehensive bundle configuration
      // Legacy metafield setting removed - now using $app:bundle_config via bundle-isolation.server.ts
      AppLogger.info('Skipping legacy metafield writes - using $app:bundle_config instead', {
        component: 'bundle-product',
        operation: 'update-config-metafields'
      });
      return true;

    } catch (error) {
      AppLogger.error('Error setting configuration metafields', {
        component: 'bundle-product',
        operation: 'update-config-metafields'
      }, error);
      return false;
    }
  }

  /**
   * Clean up bundle product (delete from Shopify)
   */
  static async deleteBundleProduct(admin: any, productId: string) {
    AppLogger.info('Deleting bundle product', {
      component: 'bundle-product',
      operation: 'delete'
    }, { productId });

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
        AppLogger.error('Product deletion errors', {
          component: 'bundle-product',
          operation: 'delete'
        }, data.data.productDelete.userErrors);
        return false;
      }

      AppLogger.info('Successfully deleted bundle product', {
        component: 'bundle-product',
        operation: 'delete'
      }, { deletedProductId: data.data?.productDelete?.deletedProductId });
      return true;

    } catch (error) {
      AppLogger.error('Error deleting bundle product', {
        component: 'bundle-product',
        operation: 'delete'
      }, error);
      return false;
    }
  }
}