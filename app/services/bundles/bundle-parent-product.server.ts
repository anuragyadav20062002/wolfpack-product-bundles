import db from "../../db.server";
import type { ShopifyAdmin } from "../../lib/auth-guards.server";
import { AppLogger } from "../../lib/logger";
import { buildBundleProductDescriptionHtml } from "../../lib/bundle-product-description.server";
import { buildGeneratedBundleProductMetadata } from "../../lib/bundle-product-data.server";
import { buildBundleProductPlaceholderMediaInput } from "../../lib/bundle-product-media.server";

type BundleParentProductRecord = {
  id: string;
  name: string;
  shopifyProductId?: string | null;
  shopifyProductHandle?: string | null;
};

type ShopifyUserError = {
  field?: string[] | null;
  message: string;
  code?: string | null;
};

type ParentProductNode = {
  id: string;
  handle: string;
  status: string;
  variants?: {
    nodes?: Array<{ id?: string | null }>;
  } | null;
};

export type BundleParentProductResult = {
  productId: string;
  variantId: string;
  handle: string;
  status: string;
  created: boolean;
};

export class BundleParentProductError extends Error {
  operation: string;
  userErrors: ShopifyUserError[];

  constructor(operation: string, userErrors: ShopifyUserError[]) {
    const details = userErrors
      .map((error) => {
        const field = error.field?.length ? ` (${error.field.join(".")})` : "";
        return `${error.message}${field}`;
      })
      .join("; ");
    super(`Failed to ${operation}: ${details || "Shopify returned an unknown error"}`);
    this.name = "BundleParentProductError";
    this.operation = operation;
    this.userErrors = userErrors;
  }
}

function throwTransportErrors(operation: string, errors: unknown[] | undefined) {
  if (!errors?.length) return;
  const userErrors = errors.map((error) => ({
    message:
      typeof error === "object" && error && "message" in error
        ? String(error.message)
        : String(error),
  }));
  throw new BundleParentProductError(operation, userErrors);
}

function throwUserErrors(operation: string, userErrors: ShopifyUserError[] | undefined) {
  if (userErrors?.length) {
    throw new BundleParentProductError(operation, userErrors);
  }
}

async function loadParentProduct(
  admin: ShopifyAdmin,
  productId: string,
): Promise<ParentProductNode | null> {
  const response = await admin.graphql(
    `
      query GetBundleParentProduct($id: ID!) {
        product(id: $id) {
          id
          handle
          status
          variants(first: 1) {
            nodes { id }
          }
        }
      }
    `,
    { variables: { id: productId } },
  );
  const data = (await response.json()) as {
    data?: { product?: ParentProductNode | null };
    errors?: unknown[];
  };
  throwTransportErrors("load parent product", data.errors);
  return data.data?.product ?? null;
}

async function loadShopName(admin: ShopifyAdmin): Promise<string | null> {
  const response = await admin.graphql(`
    query GetBundleParentShop {
      shop { name }
    }
  `);
  const data = (await response.json()) as {
    data?: { shop?: { name?: string | null } };
    errors?: unknown[];
  };
  throwTransportErrors("load shop name", data.errors);
  return data.data?.shop?.name?.trim() ?? null;
}

async function createParentProduct(input: {
  admin: ShopifyAdmin;
  appUrl?: string;
  bundle: BundleParentProductRecord;
}): Promise<ParentProductNode> {
  const shopName = await loadShopName(input.admin);
  const productMetadata = buildGeneratedBundleProductMetadata({
    bundleName: input.bundle.name,
    shopName,
  });
  const media = buildBundleProductPlaceholderMediaInput(
    input.appUrl,
    input.bundle.name,
  );
  const response = await input.admin.graphql(
    `
      mutation CreateBundleParentProduct($product: ProductCreateInput!, $media: [CreateMediaInput!]) {
        productCreate(product: $product, media: $media) {
          product {
            id
            handle
            status
            variants(first: 1) {
              nodes { id }
            }
          }
          userErrors { field message }
        }
      }
    `,
    {
      variables: {
        product: {
          ...productMetadata,
          status: "UNLISTED",
          descriptionHtml: buildBundleProductDescriptionHtml({
            bundleName: input.bundle.name,
            status: "unlisted",
          }),
          tags: [
            "WP-Bundles",
            "wolfpack-bundle-parent",
            "wolfpack-hide-bundle-options",
          ],
        },
        ...(media ? { media } : {}),
      },
    },
  );
  const data = (await response.json()) as {
    data?: {
      productCreate?: {
        product?: ParentProductNode | null;
        userErrors?: ShopifyUserError[];
      };
    };
    errors?: unknown[];
  };
  throwTransportErrors("create parent product", data.errors);
  throwUserErrors("create parent product", data.data?.productCreate?.userErrors);
  const product = data.data?.productCreate?.product;
  if (!product?.id || !product.handle) {
    throw new BundleParentProductError("create parent product", [
      { message: "Shopify did not return a product ID and handle" },
    ]);
  }
  return product;
}

async function configureParentVariant(
  admin: ShopifyAdmin,
  productId: string,
  variantId: string,
) {
  const response = await admin.graphql(
    `
      mutation ConfigureBundleParentVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
        productVariantsBulkUpdate(productId: $productId, variants: $variants) {
          productVariants { id }
          userErrors { field message code }
        }
      }
    `,
    {
      variables: {
        productId,
        variants: [
          {
            id: variantId,
            price: "0.00",
            inventoryPolicy: "CONTINUE",
            taxable: false,
            requiresComponents: true,
          },
        ],
      },
    },
  );
  const data = (await response.json()) as {
    data?: {
      productVariantsBulkUpdate?: { userErrors?: ShopifyUserError[] };
    };
    errors?: unknown[];
  };
  throwTransportErrors("configure parent variant", data.errors);
  throwUserErrors(
    "configure parent variant",
    data.data?.productVariantsBulkUpdate?.userErrors,
  );
}

async function publishParentToOnlineStore(
  admin: ShopifyAdmin,
  productId: string,
) {
  const publicationsResponse = await admin.graphql(`
    query GetOnlineStorePublication {
      publications(first: 50) {
        nodes {
          id
          catalog { title }
        }
      }
    }
  `);
  const publicationsData = (await publicationsResponse.json()) as {
    data?: {
      publications?: {
        nodes?: Array<{
          id: string;
          catalog?: { title?: string | null } | null;
        }>;
      };
    };
    errors?: unknown[];
  };
  throwTransportErrors("load Online Store publication", publicationsData.errors);
  const onlineStore = publicationsData.data?.publications?.nodes?.find(
    (publication) =>
      publication.catalog?.title?.endsWith(" for Online Store") === true,
  );
  if (!onlineStore) {
    throw new BundleParentProductError("load Online Store publication", [
      { message: "Online Store publication is not available for this shop" },
    ]);
  }

  const response = await admin.graphql(
    `
      mutation PublishBundleParentProduct($id: ID!, $input: [PublicationInput!]!) {
        publishablePublish(id: $id, input: $input) {
          publishable { availablePublicationsCount { count } }
          userErrors { field message }
        }
      }
    `,
    {
      variables: {
        id: productId,
        input: [{ publicationId: onlineStore.id }],
      },
    },
  );
  const data = (await response.json()) as {
    data?: { publishablePublish?: { userErrors?: ShopifyUserError[] } };
    errors?: unknown[];
  };
  throwTransportErrors("publish parent product", data.errors);
  throwUserErrors("publish parent product", data.data?.publishablePublish?.userErrors);
}

export async function ensureBundleParentProduct(input: {
  admin: ShopifyAdmin;
  shopDomain: string;
  appUrl?: string;
  bundle: BundleParentProductRecord;
}): Promise<BundleParentProductResult> {
  let product = input.bundle.shopifyProductId
    ? await loadParentProduct(input.admin, input.bundle.shopifyProductId)
    : null;
  let created = false;

  if (!product) {
    product = await createParentProduct(input);
    created = true;
    await db.bundle.update({
      where: { id: input.bundle.id, shopId: input.shopDomain },
      data: {
        shopifyProductId: product.id,
        shopifyProductHandle: product.handle,
      },
    });
  } else if (product.handle !== input.bundle.shopifyProductHandle) {
    await db.bundle.update({
      where: { id: input.bundle.id, shopId: input.shopDomain },
      data: { shopifyProductHandle: product.handle },
    });
  }

  const variantId = product.variants?.nodes?.[0]?.id;
  if (!variantId) {
    throw new BundleParentProductError("configure parent variant", [
      { message: "Shopify parent product has no default variant" },
    ]);
  }

  await configureParentVariant(input.admin, product.id, variantId);
  await publishParentToOnlineStore(input.admin, product.id);

  AppLogger.info("Bundle parent product contract ensured", {
    component: "bundle-parent-product",
    bundleId: input.bundle.id,
    productId: product.id,
    created,
  });

  return {
    productId: product.id,
    variantId,
    handle: product.handle,
    status: product.status,
    created,
  };
}
