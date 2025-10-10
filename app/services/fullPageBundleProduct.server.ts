// Full-Page Bundle Parent Product Service
// Handles auto-creation and management of parent products for full-page bundles

/**
 * Create a parent product for a full-page bundle
 * This product serves as the container in the cart for all bundle items
 */
export async function createBundleParentProduct(
  admin: any,
  bundleId: string,
  bundleName: string,
  visible: boolean = true
): Promise<{ id: string; title: string }> {
  console.log(
    `📦 [FULL_PAGE_BUNDLE] Creating parent product for bundle: ${bundleId}`
  );

  try {
    const productTitle = `EasyBundleId : ${bundleId}`;

    // GraphQL mutation to create product
    const CREATE_PRODUCT_MUTATION = `
      mutation productCreate($input: ProductInput!) {
        productCreate(input: $input) {
          product {
            id
            title
            handle
            status
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await admin.graphql(CREATE_PRODUCT_MUTATION, {
      variables: {
        input: {
          title: productTitle,
          status: visible ? "ACTIVE" : "DRAFT",
          productType: "Bundle",
          vendor: "Wolfpack Bundles",
          tags: ["bundle", "full-page-bundle", bundleId],
          descriptionHtml: `<p>This is a bundle container product for ${bundleName}.</p><p>Bundle ID: ${bundleId}</p>`,
          // Set metafields to identify this as a bundle parent
          metafields: [
            {
              namespace: "wolfpack",
              key: "bundle_type",
              value: "full_page_parent",
              type: "single_line_text_field",
            },
            {
              namespace: "wolfpack",
              key: "bundle_id",
              value: bundleId,
              type: "single_line_text_field",
            },
          ],
        },
      },
    });

    const responseJson = await response.json();

    if (
      responseJson.data?.productCreate?.userErrors &&
      responseJson.data.productCreate.userErrors.length > 0
    ) {
      console.error(
        `❌ [FULL_PAGE_BUNDLE] Error creating product:`,
        responseJson.data.productCreate.userErrors
      );
      throw new Error(
        responseJson.data.productCreate.userErrors[0].message
      );
    }

    const product = responseJson.data.productCreate.product;

    console.log(
      `✅ [FULL_PAGE_BUNDLE] Parent product created: ${product.id}`
    );

    return {
      id: product.id,
      title: product.title,
    };
  } catch (error) {
    console.error(
      `❌ [FULL_PAGE_BUNDLE] Error creating parent product:`,
      error
    );
    throw new Error("Failed to create bundle parent product");
  }
}

/**
 * Update an existing bundle parent product
 */
export async function updateBundleParentProduct(
  admin: any,
  productId: string,
  updates: {
    title?: string;
    visible?: boolean;
    description?: string;
  }
): Promise<void> {
  console.log(
    `🔄 [FULL_PAGE_BUNDLE] Updating parent product: ${productId}`
  );

  try {
    const UPDATE_PRODUCT_MUTATION = `
      mutation productUpdate($input: ProductInput!) {
        productUpdate(input: $input) {
          product {
            id
            title
            status
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const input: any = {
      id: productId,
    };

    if (updates.title) {
      input.title = updates.title;
    }

    if (updates.visible !== undefined) {
      input.status = updates.visible ? "ACTIVE" : "DRAFT";
    }

    if (updates.description) {
      input.descriptionHtml = updates.description;
    }

    const response = await admin.graphql(UPDATE_PRODUCT_MUTATION, {
      variables: { input },
    });

    const responseJson = await response.json();

    if (
      responseJson.data?.productUpdate?.userErrors &&
      responseJson.data.productUpdate.userErrors.length > 0
    ) {
      console.error(
        `❌ [FULL_PAGE_BUNDLE] Error updating product:`,
        responseJson.data.productUpdate.userErrors
      );
      throw new Error(
        responseJson.data.productUpdate.userErrors[0].message
      );
    }

    console.log(`✅ [FULL_PAGE_BUNDLE] Parent product updated successfully`);
  } catch (error) {
    console.error(
      `❌ [FULL_PAGE_BUNDLE] Error updating parent product:`,
      error
    );
    throw error;
  }
}

/**
 * Delete a bundle parent product
 */
export async function deleteBundleParentProduct(
  admin: any,
  productId: string
): Promise<void> {
  console.log(
    `🗑️ [FULL_PAGE_BUNDLE] Deleting parent product: ${productId}`
  );

  try {
    const DELETE_PRODUCT_MUTATION = `
      mutation productDelete($input: ProductDeleteInput!) {
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
        input: {
          id: productId,
        },
      },
    });

    const responseJson = await response.json();

    if (
      responseJson.data?.productDelete?.userErrors &&
      responseJson.data.productDelete.userErrors.length > 0
    ) {
      console.error(
        `❌ [FULL_PAGE_BUNDLE] Error deleting product:`,
        responseJson.data.productDelete.userErrors
      );
      throw new Error(
        responseJson.data.productDelete.userErrors[0].message
      );
    }

    console.log(`✅ [FULL_PAGE_BUNDLE] Parent product deleted successfully`);
  } catch (error) {
    console.error(
      `❌ [FULL_PAGE_BUNDLE] Error deleting parent product:`,
      error
    );
    throw error;
  }
}

/**
 * Publish parent product to online store sales channel
 */
export async function publishParentProduct(
  admin: any,
  productId: string
): Promise<void> {
  console.log(
    `📢 [FULL_PAGE_BUNDLE] Publishing parent product to online store: ${productId}`
  );

  try {
    // First, get the online store publication ID
    const PUBLICATIONS_QUERY = `
      query {
        publications(first: 10) {
          edges {
            node {
              id
              name
            }
          }
        }
      }
    `;

    const pubResponse = await admin.graphql(PUBLICATIONS_QUERY);
    const pubResponseJson = await pubResponse.json();

    const onlineStore = pubResponseJson.data.publications.edges.find(
      (pub: any) => pub.node.name === "Online Store"
    );

    if (!onlineStore) {
      console.warn(`⚠️ [FULL_PAGE_BUNDLE] Online Store publication not found`);
      return;
    }

    // Publish the product
    const PUBLISH_MUTATION = `
      mutation publishablePublish($id: ID!, $input: [PublicationInput!]!) {
        publishablePublish(id: $id, input: $input) {
          publishable {
            availablePublicationsCount {
              count
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await admin.graphql(PUBLISH_MUTATION, {
      variables: {
        id: productId,
        input: [
          {
            publicationId: onlineStore.node.id,
          },
        ],
      },
    });

    const responseJson = await response.json();

    if (
      responseJson.data?.publishablePublish?.userErrors &&
      responseJson.data.publishablePublish.userErrors.length > 0
    ) {
      console.error(
        `❌ [FULL_PAGE_BUNDLE] Error publishing product:`,
        responseJson.data.publishablePublish.userErrors
      );
    } else {
      console.log(
        `✅ [FULL_PAGE_BUNDLE] Parent product published successfully`
      );
    }
  } catch (error) {
    console.error(
      `❌ [FULL_PAGE_BUNDLE] Error publishing parent product:`,
      error
    );
    // Don't throw here, publishing failure shouldn't break bundle creation
  }
}
