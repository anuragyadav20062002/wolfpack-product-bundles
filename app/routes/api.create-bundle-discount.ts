import { json, type ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export async function action({ request }: ActionFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);

  try {
    const formData = await request.formData();
    const bundleId = formData.get("bundleId") as string;
    const sessionId = formData.get("sessionId") as string; // or customerId for logged-in users

    if (!bundleId) {
      return json({ error: "Bundle ID is required" }, { status: 400 });
    }

    // Get bundle details
    const bundle = await db.bundle.findUnique({
      where: { id: bundleId, shopId: session.shop },
    });

    if (!bundle) {
      return json({ error: "Bundle not found" }, { status: 404 });
    }

    // Create unique discount title
    const discountTitle = `Bundle-${bundleId}-Session-${sessionId}`;

    // Check if discount already exists (to avoid duplicates)
    const existingDiscountsResponse = await admin.graphql(`
      query {
        discountAutomaticNodes(first: 10, query: "title:${discountTitle}") {
          nodes {
            id
            title
            status
          }
        }
      }
    `);

    const existingData = await existingDiscountsResponse.json();
    const existingDiscount =
      existingData.data.discountAutomaticNodes.nodes.find(
        (d: any) => d.title === discountTitle,
      );

    if (existingDiscount) {
      return json({
        success: true,
        discountId: existingDiscount.id,
        message: "Discount already exists",
      });
    }

    // Note: Cleanup of expired discounts would be handled by a separate cron job
    // For now, we'll just create the discount

    // Create new discount
    const functionId = "8b585225-7750-405c-bfc3-7b1c463ca679";
    const now = new Date();
    const startsAt = now.toISOString();
    const endsAt = new Date(now.getTime() + 30 * 60 * 1000).toISOString();

    const mutation = `
      mutation {
        discountAutomaticAppCreate(
          automaticAppDiscount: {
            title: "${discountTitle}"
            functionId: "${functionId}"
            discountClasses: [PRODUCT]
            startsAt: "${startsAt}"
            endsAt: "${endsAt}"
            combinesWith: {
              orderDiscounts: false
              productDiscounts: false
              shippingDiscounts: false
            }
          }
        ) {
          automaticAppDiscount {
            discountId
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

    const response = await admin.graphql(mutation);
    const data = await response.json();

    if (data.data?.discountAutomaticAppCreate?.userErrors?.length > 0) {
      console.error(
        "Discount creation errors:",
        data.data.discountAutomaticAppCreate.userErrors,
      );
      return json(
        {
          error: "Failed to create discount",
          details: data.data.discountAutomaticAppCreate.userErrors,
        },
        { status: 500 },
      );
    }

    const discountId =
      data.data.discountAutomaticAppCreate.automaticAppDiscount.discountId;

    return json({
      success: true,
      discountId,
      message: "Discount created successfully",
    });
  } catch (error) {
    console.error("Error creating bundle discount:", error);
    return json(
      {
        error: "Failed to create discount",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
