import { json, type ActionFunctionArgs } from "@remix-run/node";
import { requireAdminSession } from "../../../lib/auth-guards.server";
import db from "../../../db.server";
import { AppLogger } from "../../../lib/logger";
import { MetafieldCleanupService } from "../../../services/metafield-cleanup.server";
import { BundleStatus, BundleType } from "../../../constants/bundle";

async function addProductImage(admin: any, productId: string, imageUrl: string, altText?: string) {
  const CREATE_MEDIA = `
    mutation productCreateMedia($productId: ID!, $media: [CreateMediaInput!]!) {
      productCreateMedia(productId: $productId, media: $media) {
        media {
          alt
          mediaContentType
          status
        }
        mediaUserErrors {
          field
          message
        }
      }
    }
  `;

  try {
    const response = await admin.graphql(CREATE_MEDIA, {
      variables: {
        productId,
        media: [
          {
            originalSource: imageUrl,
            alt: altText || "Bundle product image",
            mediaContentType: "IMAGE"
          }
        ]
      }
    });

    const data = await response.json();

    if (data.data?.productCreateMedia?.mediaUserErrors?.length > 0) {
      const errors = data.data.productCreateMedia.mediaUserErrors;
      AppLogger.error("Failed to add product image", {
        component: "app.bundles.cart-transform",
        operation: "add-product-image"
      }, { errors, productId, imageUrl });
      return { success: false, errors };
    }

    AppLogger.info("Product image added successfully", {
      component: "app.bundles.cart-transform",
      productId,
      imageUrl
    });

    return { success: true };
  } catch (error) {
    AppLogger.error("Error adding product image", {
      component: "app.bundles.cart-transform",
      operation: "add-product-image"
    }, error);
    return { success: false, error };
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const { session, admin } = await requireAdminSession(request);
  const shop = session.shop;

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "cloneBundle") {
    const bundleId = formData.get("bundleId") as string;

    try {
      const originalBundle = await db.bundle.findUnique({
        where: { id: bundleId, shopId: shop },
        include: {
          steps: {
            include: {
              StepProduct: true
            }
          },
          pricing: true
        },
      });

      if (!originalBundle) {
        return json({ error: "Bundle not found" }, { status: 404 });
      }

      const clonedBundleName = `${originalBundle.name} (Copy)`;
      let bundlePrice = "1.00";
      try {
        const { calculateBundlePrice } = await import("../../../services/bundles/pricing-calculation.server");
        bundlePrice = await calculateBundlePrice(admin, originalBundle);
      } catch (priceError) {
        AppLogger.warn("Failed to calculate bundle price for clone, using fallback", {
          component: "app.bundles.cart-transform", operation: "clone-bundle"
        }, priceError);
      }

      const productResponse = await admin.graphql(`
        mutation CreateBundleProduct($input: ProductInput!) {
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
      `, {
        variables: {
          input: {
            title: clonedBundleName,
            descriptionHtml: originalBundle.description || `${clonedBundleName} - Bundle Product`,
            productType: "Bundle",
            vendor: "Bundle Builder",
            status: "DRAFT",
            tags: ["WP-Bundles"],
            variants: [
              {
                price: bundlePrice,
                inventoryPolicy: "CONTINUE",
                requiresShipping: true,
                taxable: true,
                weight: 0,
                weightUnit: "POUNDS"
              }
            ]
          }
        }
      });

      const productData = await productResponse.json();

      if (productData.data?.productCreate?.userErrors?.length > 0) {
        AppLogger.error("Product creation failed", { component: "app.bundles.cart-transform", operation: "clone-bundle" }, { errors: productData.data.productCreate.userErrors });
        return json({ error: "Failed to create bundle product in Shopify" }, { status: 500 });
      }

      const shopifyProductId = productData.data?.productCreate?.product?.id;
      const clonedBundle = await db.bundle.create({
        data: {
          name: clonedBundleName,
          description: originalBundle.description,
          shopId: shop,
          bundleType: BundleType.PRODUCT_PAGE,
          status: BundleStatus.DRAFT,
          shopifyProductId,
          templateName: originalBundle.templateName,
        },
      });

      if (originalBundle.steps && originalBundle.steps.length > 0) {
        for (const step of originalBundle.steps) {
          const clonedStep = await db.bundleStep.create({
            data: {
              bundleId: clonedBundle.id,
              name: step.name,
              products: step.products || [],
              collections: step.collections || [],
              displayVariantsAsIndividual: step.displayVariantsAsIndividual,
              icon: step.icon,
              position: step.position,
              minQuantity: step.minQuantity,
              maxQuantity: step.maxQuantity,
              enabled: step.enabled,
              conditionType: step.conditionType,
              conditionOperator: step.conditionOperator,
              conditionValue: step.conditionValue,
            },
          });

          if (step.StepProduct && step.StepProduct.length > 0) {
            for (const stepProduct of step.StepProduct) {
              await db.stepProduct.create({
                data: {
                  stepId: clonedStep.id,
                  productId: stepProduct.productId,
                  title: stepProduct.title,
                  variants: stepProduct.variants || [],
                  imageUrl: stepProduct.imageUrl,
                  minQuantity: stepProduct.minQuantity,
                  maxQuantity: stepProduct.maxQuantity,
                  position: stepProduct.position,
                },
              });
            }
          }
        }
      }

      if (originalBundle.pricing) {
        await db.bundlePricing.create({
          data: {
            bundleId: clonedBundle.id,
            enabled: originalBundle.pricing.enabled,
            method: originalBundle.pricing.method,
            rules: originalBundle.pricing.rules || [],
            messages: originalBundle.pricing.messages || [],
            showFooter: originalBundle.pricing.showFooter,
          },
        });
      }

      return json({
        success: true,
        message: "Bundle cloned successfully",
        bundleId: clonedBundle.id
      });
    } catch (error) {
      AppLogger.error("Failed to clone bundle", { component: "app.bundles.cart-transform", operation: "clone-bundle" }, error);
      return json({ error: "Failed to clone bundle" }, { status: 500 });
    }
  }

  if (intent === "deleteBundle") {
    const bundleId = formData.get("bundleId") as string;

    try {
      const bundle = await db.bundle.findUnique({
        where: { id: bundleId, shopId: shop },
        include: {
          steps: {
            include: {
              StepProduct: true
            }
          }
        }
      });

      if (!bundle) {
        return json({ error: "Bundle not found" }, { status: 404 });
      }

      const componentProductIds = Array.from(new Set(
        bundle.steps
          .flatMap(step => step.StepProduct || [])
          .map(sp => sp.productId)
          .filter(Boolean)
      ));

      if (bundle.shopifyProductId) {
        await MetafieldCleanupService.cleanupBundleMetafields(
          admin,
          bundleId,
          bundle.shopifyProductId,
          componentProductIds
        );
      }

      await db.bundle.delete({
        where: { id: bundleId, shopId: shop },
      });

      AppLogger.info("Bundle deleted successfully",
        { component: "app.bundles.cart-transform", operation: "delete-bundle", bundleId });

      return json({
        success: true,
        message: "Bundle deleted successfully"
      });
    } catch (error) {
      AppLogger.error("Failed to delete bundle", { component: "app.bundles.cart-transform", operation: "delete-bundle" }, error);
      return json({ error: "Failed to delete bundle" }, { status: 500 });
    }
  }

  const bundleName = formData.get("bundleName");
  const description = formData.get("description");

  if (typeof bundleName !== "string" || bundleName.length === 0) {
    return json({ error: "Bundle name is required" }, { status: 400 });
  }

  try {
    const productInput: any = {
      title: bundleName,
      descriptionHtml: description || `<h2>${bundleName}</h2><p>${description || "Complete bundle package with curated products."}</p><p>Build your perfect bundle by selecting from our hand-picked collection of products.</p>`,
      productType: "Bundle",
      vendor: "Bundle Builder",
      status: "ACTIVE",
      tags: ["WP-Bundles"],
    };

    const appUrl = process.env.SHOPIFY_APP_URL;
    const mediaInput = appUrl ? [
      {
        originalSource: `${appUrl}/bundle.png`,
        alt: `${bundleName} - Bundle`,
        mediaContentType: "IMAGE"
      }
    ] : undefined;

    const productResponse = await admin.graphql(`
      mutation CreateBundleProduct($product: ProductCreateInput!, $media: [CreateMediaInput!]) {
        productCreate(product: $product, media: $media) {
          product {
            id
            title
            handle
            status
            variants(first: 1) {
              edges {
                node {
                  id
                  title
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
    `, {
      variables: {
        product: productInput,
        ...(mediaInput && { media: mediaInput })
      }
    });

    const productData = await productResponse.json();

    if (productData.data?.productCreate?.userErrors?.length > 0) {
      const errors = productData.data.productCreate.userErrors;
      const errorMessages = errors.map((e: any) => e.message).join(", ");
      AppLogger.error("Product creation failed", { component: "app.bundles.cart-transform", operation: "create-bundle" }, { errors });
      return json({ error: `Shopify API error: ${errorMessages}` }, { status: 500 });
    }

    const shopifyProductId = productData.data?.productCreate?.product?.id;

    if (!shopifyProductId) {
      AppLogger.error("No product ID returned from Shopify", { component: "app.bundles.cart-transform", operation: "create-bundle" });
      return json({ error: "Failed to get product ID from Shopify" }, { status: 500 });
    }

    const newBundle = await db.bundle.create({
      data: {
        name: bundleName,
        description: typeof description === "string" ? description : `${bundleName} - Bundle Product`,
        shopId: shop,
        bundleType: BundleType.PRODUCT_PAGE,
        status: BundleStatus.DRAFT,
        shopifyProductId,
      },
    });

    return json({
      success: true,
      bundleId: newBundle.id,
      bundleProductId: shopifyProductId,
      redirectTo: `/app/bundles/cart-transform/configure/${newBundle.id}`
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    AppLogger.error("Failed to create cart transform bundle", { component: "app.bundles.cart-transform", operation: "create-bundle" }, error);
    return json({ error: `Failed to create bundle: ${errorMessage}` }, { status: 500 });
  }
}
