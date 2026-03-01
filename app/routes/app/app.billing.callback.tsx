import { useEffect } from "react";
import { json, type LoaderFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { Page, Card, BlockStack, Text, Spinner, Banner } from "@shopify/polaris";
import { authenticate } from "../../shopify.server";
import { BillingService } from "../../services/billing.server";
import { AppLogger } from "../../lib/logger";

/**
 * Billing Callback Handler
 *
 * This route handles the return from Shopify's billing confirmation page.
 * After a merchant approves a subscription, Shopify redirects here with the charge_id.
 *
 * Flow:
 * 1. Shopify redirects to this page after subscription approval
 * 2. We confirm the subscription in our database
 * 3. Redirect to billing page with success message
 *
 * URL: /app/billing/callback?charge_id=gid://shopify/AppSubscription/12345
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const { session, admin } = await authenticate.admin(request);
  const shopDomain = session.shop;

  try {
    const url = new URL(request.url);
    const chargeId = url.searchParams.get("charge_id");

    // If no charge_id, something went wrong
    if (!chargeId) {
      AppLogger.error("Billing callback missing charge_id", {
        component: "app.billing.callback",
        operation: "loader"
      }, { shop: shopDomain, url: request.url });

      return redirect("/app/billing?error=missing_charge_id");
    }

    AppLogger.info("Processing billing callback", {
      component: "app.billing.callback",
      operation: "loader"
    }, { shop: shopDomain, chargeId });

    // IMPROVED: Confirm subscription with Shopify API verification
    const result = await BillingService.confirmSubscription(admin, shopDomain, chargeId);

    if (!result.success) {
      AppLogger.error("Failed to confirm subscription", {
        component: "app.billing.callback",
        operation: "loader"
      }, { shop: shopDomain, error: result.error });

      return redirect(`/app/billing?error=${encodeURIComponent(result.error || "confirmation_failed")}`);
    }

    // Success! Redirect to billing page
    AppLogger.info("Subscription confirmed successfully", {
      component: "app.billing.callback",
      operation: "loader"
    }, { shop: shopDomain, chargeId });

    return redirect("/app/billing?upgraded=true");

  } catch (error) {
    AppLogger.error("Error in billing callback", {
      component: "app.billing.callback",
      operation: "loader"
    }, error);

    return redirect(`/app/billing?error=unexpected_error`);
  }
}

export default function BillingCallback() {
  // This component should rarely render because loader redirects immediately
  // But if it does render (during loading), show a nice loading state
  return (
    <Page title="Confirming Subscription">
      <Card>
        <BlockStack gap="400" align="center">
          <Spinner size="large" />
          <Text as="p" variant="bodyMd" alignment="center">
            Please wait while we confirm your subscription...
          </Text>
          <Text as="p" variant="bodyMd" tone="subdued" alignment="center">
            You will be redirected momentarily.
          </Text>
        </BlockStack>
      </Card>
    </Page>
  );
}
