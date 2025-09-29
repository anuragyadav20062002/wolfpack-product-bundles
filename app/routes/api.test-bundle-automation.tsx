import { json, type ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { BundleAutoInjectionService } from "../services/bundle-auto-injection.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  try {
    console.log("🧪 [BUNDLE_AUTOMATION_TEST] Testing bundle automation system");

    // Get injection status for all bundle products
    const injectionStatus = await BundleAutoInjectionService.getBundleInjectionStatus(
      admin,
      session.shop
    );

    console.log("📊 [BUNDLE_AUTOMATION_TEST] Injection status results:", injectionStatus);

    const summary = {
      timestamp: new Date().toISOString(),
      shop: session.shop,
      totalBundles: injectionStatus.length,
      workingInjections: injectionStatus.filter((status: any) => status.injectionWorking).length,
      failedInjections: injectionStatus.filter((status: any) => !status.injectionWorking).length,
      details: injectionStatus
    };

    console.log("✅ [BUNDLE_AUTOMATION_TEST] Bundle automation test completed successfully");

    return json({
      success: true,
      summary,
      message: "Bundle automation system tested successfully"
    });

  } catch (error) {
    console.error("❌ [BUNDLE_AUTOMATION_TEST] Test failed:", error);

    return json({
      success: false,
      error: (error as Error).message,
      message: "Bundle automation test failed"
    }, { status: 500 });
  }
};

// GET handler for simple status check
export const loader = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  try {
    console.log("🔍 [BUNDLE_AUTOMATION_CHECK] Checking bundle automation status");

    // Quick check of injection status
    const injectionStatus = await BundleAutoInjectionService.getBundleInjectionStatus(
      admin,
      session.shop
    );

    const quickSummary = {
      shop: session.shop,
      bundleCount: injectionStatus.length,
      automationWorking: injectionStatus.filter((status: any) => status.injectionWorking).length > 0,
      lastChecked: new Date().toISOString()
    };

    console.log("📋 [BUNDLE_AUTOMATION_CHECK] Quick status:", quickSummary);

    return json({
      success: true,
      status: quickSummary,
      message: "Bundle automation status retrieved"
    });

  } catch (error) {
    console.error("❌ [BUNDLE_AUTOMATION_CHECK] Status check failed:", error);

    return json({
      success: false,
      error: (error as Error).message,
      message: "Bundle automation status check failed"
    }, { status: 500 });
  }
};