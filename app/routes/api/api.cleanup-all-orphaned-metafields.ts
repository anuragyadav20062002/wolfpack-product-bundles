/**
 * API Route to cleanup ALL orphaned bundle metafields across the store
 *
 * Purpose: Removes all bundle-related metafields when bundles were deleted
 * but metafields were left behind (orphaned data).
 *
 * Usage:
 * GET /api/cleanup-all-orphaned-metafields
 *
 * Process:
 * 1. Query ALL products with bundle metafields
 * 2. Delete metafield VALUES from all products
 * 3. Clean up shop-level metafields
 * 4. Optionally delete metafield definitions
 *
 * When to use:
 * - After deleting all bundles but metafields remain
 * - When "Unstructured metafields" page shows orphaned data
 * - Before fresh bundle setup
 * - As part of complete app cleanup
 *
 * CAUTION: This deletes ALL bundle metafields from ALL products!
 */

import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../../shopify.server";
import { AppLogger } from "../../lib/logger";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  const url = new URL(request.url);
  const deleteDefinitions = url.searchParams.get("deleteDefinitions") === "true";

  AppLogger.info('Starting bulk cleanup of orphaned metafields', {
    component: 'cleanup-orphaned',
    operation: 'start'
  }, { deleteDefinitions });

  try {
    let totalProductsCleaned = 0;
    let totalMetafieldsDeleted = 0;

    // Step 1: Query for products with bundle metafields
    AppLogger.info('Querying products with bundle metafields', {
      component: 'cleanup-orphaned',
      operation: 'query-products'
    });

    const QUERY_PRODUCTS_WITH_METAFIELDS = `
      query GetProductsWithBundleMetafields($first: Int!, $after: String) {
        products(first: $first, after: $after) {
          pageInfo {
            hasNextPage
            endCursor
          }
          edges {
            node {
              id
              title
              metafields(first: 50, namespace: "app--261615583233") {
                edges {
                  node {
                    id
                    namespace
                    key
                  }
                }
              }
              isolationMetafields: metafields(first: 50, namespace: "app--261615583233--bundle_isolation") {
                edges {
                  node {
                    id
                    namespace
                    key
                  }
                }
              }
            }
          }
        }
      }
    `;

    let hasNextPage = true;
    let cursor = null;
    const productsWithMetafields = [];

    // Paginate through all products
    while (hasNextPage) {
      const response = await admin.graphql(QUERY_PRODUCTS_WITH_METAFIELDS, {
        variables: {
          first: 50,
          after: cursor
        }
      });

      const data = await response.json();

      if (data.errors) {
        AppLogger.error('GraphQL errors querying products', {
          component: 'cleanup-orphaned',
          operation: 'query-products'
        }, data.errors);
        break;
      }

      const products = data.data?.products?.edges || [];

      // Collect products that have bundle metafields
      for (const edge of products) {
        const product = edge.node;
        const hasAppMetafields = product.metafields?.edges?.length > 0;
        const hasIsolationMetafields = product.isolationMetafields?.edges?.length > 0;

        if (hasAppMetafields || hasIsolationMetafields) {
          productsWithMetafields.push(product);
        }
      }

      hasNextPage = data.data?.products?.pageInfo?.hasNextPage || false;
      cursor = data.data?.products?.pageInfo?.endCursor;
    }

    AppLogger.info('Found products with bundle metafields', {
      component: 'cleanup-orphaned',
      operation: 'query-products'
    }, { count: productsWithMetafields.length });

    // Step 2: Delete metafields from each product
    for (const product of productsWithMetafields) {
      const metafieldsToDelete = [];

      // Collect metafield identifiers
      for (const edge of product.metafields?.edges || []) {
        metafieldsToDelete.push({
          ownerId: product.id,
          namespace: edge.node.namespace,
          key: edge.node.key
        });
      }

      for (const edge of product.isolationMetafields?.edges || []) {
        metafieldsToDelete.push({
          ownerId: product.id,
          namespace: edge.node.namespace,
          key: edge.node.key
        });
      }

      if (metafieldsToDelete.length > 0) {
        try {
          const DELETE_METAFIELDS = `
            mutation DeleteMetafields($metafields: [MetafieldIdentifierInput!]!) {
              metafieldsDelete(metafields: $metafields) {
                deletedMetafields {
                  key
                  namespace
                  ownerId
                }
                userErrors {
                  field
                  message
                }
              }
            }
          `;

          const deleteResponse = await admin.graphql(DELETE_METAFIELDS, {
            variables: { metafields: metafieldsToDelete }
          });

          const deleteData = await deleteResponse.json();

          if (deleteData.data?.metafieldsDelete?.userErrors?.length > 0) {
            AppLogger.warn('Some metafields could not be deleted', {
              component: 'cleanup-orphaned',
              operation: 'delete-product-metafields'
            }, {
              productId: product.id,
              errors: deleteData.data.metafieldsDelete.userErrors
            });
          }

          const deletedCount = deleteData.data?.metafieldsDelete?.deletedMetafields?.length || 0;
          totalMetafieldsDeleted += deletedCount;
          totalProductsCleaned++;

          AppLogger.info('Deleted metafields from product', {
            component: 'cleanup-orphaned',
            operation: 'delete-product-metafields'
          }, {
            productId: product.id,
            productTitle: product.title,
            deletedCount
          });
        } catch (error) {
          AppLogger.error('Error deleting metafields from product', {
            component: 'cleanup-orphaned',
            operation: 'delete-product-metafields'
          }, { productId: product.id, error });
        }
      }
    }

    // Step 3: Clean up shop-level metafields
    AppLogger.info('Cleaning up shop-level metafields', {
      component: 'cleanup-orphaned',
      operation: 'cleanup-shop'
    });

    let shopMetafieldsDeleted = 0;

    try {
      // Get shop GID
      const shopResponse = await admin.graphql(`
        query GetShopId {
          shop {
            id
          }
        }
      `);

      const shopData = await shopResponse.json();
      const shopGid = shopData.data?.shop?.id;

      if (shopGid) {
        const shopMetafieldsToDelete = [
          { ownerId: shopGid, namespace: "$app", key: "bundleIndex" },
          { ownerId: shopGid, namespace: "$app", key: "serverUrl" },
          { ownerId: shopGid, namespace: "$app", key: "lastSync" }
        ];

        const DELETE_METAFIELDS = `
          mutation DeleteMetafields($metafields: [MetafieldIdentifierInput!]!) {
            metafieldsDelete(metafields: $metafields) {
              deletedMetafields {
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

        const shopDeleteResponse = await admin.graphql(DELETE_METAFIELDS, {
          variables: { metafields: shopMetafieldsToDelete }
        });

        const shopDeleteData = await shopDeleteResponse.json();
        shopMetafieldsDeleted = shopDeleteData.data?.metafieldsDelete?.deletedMetafields?.length || 0;
      }
    } catch (error) {
      AppLogger.error('Error cleaning up shop metafields', {
        component: 'cleanup-orphaned',
        operation: 'cleanup-shop'
      }, error);
    }

    // Step 4: Optionally delete metafield definitions
    let definitionsDeleted = 0;

    if (deleteDefinitions) {
      AppLogger.info('Deleting metafield definitions', {
        component: 'cleanup-orphaned',
        operation: 'delete-definitions'
      });

      try {
        // Query for app-scoped metafield definitions
        const QUERY_DEFINITIONS = `
          query GetMetafieldDefinitions {
            metafieldDefinitions(first: 50, ownerType: PRODUCT, namespace: "app--261615583233") {
              edges {
                node {
                  id
                  key
                  namespace
                }
              }
            }
            isolationDefinitions: metafieldDefinitions(first: 50, ownerType: PRODUCT, namespace: "app--261615583233--bundle_isolation") {
              edges {
                node {
                  id
                  key
                  namespace
                }
              }
            }
          }
        `;

        const defsResponse = await admin.graphql(QUERY_DEFINITIONS);
        const defsData = await defsResponse.json();

        const allDefinitions = [
          ...(defsData.data?.metafieldDefinitions?.edges || []),
          ...(defsData.data?.isolationDefinitions?.edges || [])
        ];

        for (const edge of allDefinitions) {
          try {
            const DELETE_DEFINITION = `
              mutation DeleteDefinition($id: ID!, $deleteAllAssociatedMetafields: Boolean!) {
                metafieldDefinitionDelete(
                  id: $id
                  deleteAllAssociatedMetafields: $deleteAllAssociatedMetafields
                ) {
                  deletedDefinitionId
                  userErrors {
                    field
                    message
                  }
                }
              }
            `;

            const deleteDefResponse = await admin.graphql(DELETE_DEFINITION, {
              variables: {
                id: edge.node.id,
                deleteAllAssociatedMetafields: true
              }
            });

            const deleteDefData = await deleteDefResponse.json();

            if (deleteDefData.data?.metafieldDefinitionDelete?.deletedDefinitionId) {
              definitionsDeleted++;
              AppLogger.info('Deleted metafield definition', {
                component: 'cleanup-orphaned',
                operation: 'delete-definitions'
              }, {
                definitionId: edge.node.id,
                namespace: edge.node.namespace,
                key: edge.node.key
              });
            }
          } catch (error) {
            AppLogger.error('Error deleting definition', {
              component: 'cleanup-orphaned',
              operation: 'delete-definitions'
            }, { definitionId: edge.node.id, error });
          }
        }
      } catch (error) {
        AppLogger.error('Error querying/deleting definitions', {
          component: 'cleanup-orphaned',
          operation: 'delete-definitions'
        }, error);
      }
    }

    AppLogger.info('Bulk cleanup completed', {
      component: 'cleanup-orphaned',
      operation: 'complete'
    }, {
      totalProductsCleaned,
      totalMetafieldsDeleted,
      shopMetafieldsDeleted,
      definitionsDeleted
    });

    return json({
      success: true,
      summary: {
        productsProcessed: productsWithMetafields.length,
        productsCleaned: totalProductsCleaned,
        totalMetafieldsDeleted,
        shopMetafieldsDeleted,
        definitionsDeleted: deleteDefinitions ? definitionsDeleted : 'skipped'
      },
      message: `Cleanup complete. Removed ${totalMetafieldsDeleted} metafields from ${totalProductsCleaned} products.`,
      nextSteps: deleteDefinitions ? [
        "All bundle metafields and definitions have been removed.",
        "Your store is now clean of all bundle-related data.",
        "You can now create fresh bundles if needed."
      ] : [
        "All bundle metafield VALUES have been removed.",
        "Metafield DEFINITIONS remain (can be reused for new bundles).",
        "To also remove definitions, call this endpoint with ?deleteDefinitions=true"
      ]
    });

  } catch (error) {
    AppLogger.error('Error during bulk cleanup', {
      component: 'cleanup-orphaned',
      operation: 'cleanup'
    }, error);

    return json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};
