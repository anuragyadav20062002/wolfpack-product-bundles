/**
 * Onboarding Wizard
 *
 * Shown to new merchants after the landing screen.
 * Covers: bundle creation → widget install → design → analytics → go live.
 */

import { type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { requireAdminSession } from "../../lib/auth-guards.server";
import { useState, useEffect, useRef } from "react";
import { AppLogger } from "../../lib/logger";
import styles from "../../styles/routes/app-index.module.css";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await requireAdminSession(request);

  const apiKey = process.env.SHOPIFY_API_KEY;
  const blockHandle = "bundle-product-page";

  return {
    shop: session.shop,
    apiKey,
    blockHandle,
  };
};

const STEP_TITLES = [
  "Create Your First Bundle",
  "Install the Widget in Your Theme",
  "Customize Your Bundle Design",
  "Track Performance & Go Live",
];

export default function Onboarding() {
  const { shop, apiKey, blockHandle } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const [selectedTemplate, setSelectedTemplate] = useState("product");
  const [selectedTarget, setSelectedTarget] = useState("newAppsSection");
  const [showAdvancedPlacement, setShowAdvancedPlacement] = useState(false);

  const templateSelectRef = useRef<HTMLElement>(null);
  const targetSelectRef = useRef<HTMLElement>(null);

  // s-select doesn't apply the value attribute until after slot children mount
  useEffect(() => {
    if (templateSelectRef.current) (templateSelectRef.current as any).value = selectedTemplate;
  }, [selectedTemplate]);

  useEffect(() => {
    if (targetSelectRef.current) (targetSelectRef.current as any).value = selectedTarget;
  }, [selectedTarget]);

  const totalSteps = STEP_TITLES.length;

  const generateThemeEditorLink = (template: string, target: string): string => {
    const appBlockId = `${apiKey}/${blockHandle}`;
    const params = new URLSearchParams({ template, addAppBlockId: appBlockId, target });
    return `https://${shop}/admin/themes/current/editor?${params.toString()}`;
  };

  const handleOpenThemeEditor = () => {
    const url = generateThemeEditorLink(selectedTemplate, selectedTarget);
    AppLogger.info("Opening theme editor from onboarding", {
      shop,
      template: selectedTemplate,
      target: selectedTarget,
    });
    window.open(url, "_blank");
    markStepComplete(1);
  };

  const markStepComplete = (stepIndex: number) => {
    setCompletedSteps((prev) => new Set(prev).add(stepIndex));
  };

  const goToStep = (index: number) => setCurrentStep(index);

  const handleStepAction = (stepIndex: number) => {
    markStepComplete(stepIndex);
    if (stepIndex < totalSteps - 1) {
      setCurrentStep(stepIndex + 1);
    }
  };

  return (
    <>
      <ui-title-bar title="Setup Guide">
        <button variant="breadcrumb" onClick={() => navigate("/app")}>
          Home
        </button>
      </ui-title-bar>

      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 4px 88px" }}>
        <s-stack direction="block" gap="large">

          {/* Progress header */}
          <div className={styles.onboardingHero}>
            <div className={styles.onboardingHeroInner}>
              <div style={{ fontSize: 40 }}>🐺</div>
              <div className={styles.onboardingHeroText}>
                <h2>Welcome to Wolfpack: Product Bundles</h2>
                <p>
                  Complete these{" "}
                  <strong style={{ color: "#ffffff" }}>{totalSteps} steps</strong> to
                  set up bundles, customize your design, and start driving revenue.&nbsp;
                  {completedSteps.size > 0 && (
                    <span style={{ color: "rgba(255,255,255,0.6)" }}>
                      {completedSteps.size}/{totalSteps} done ✓
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Step 1: Create Bundle */}
          <s-section>
            <s-stack direction="block" gap="base">
              <s-stack direction="inline" justifyContent="space-between" alignItems="center">
                <s-stack direction="inline" alignItems="center" gap="small">
                  <div
                    className={`${styles.stepBadge} ${
                      completedSteps.has(0) ? styles.stepBadgeComplete : ""
                    }`}
                  >
                    {completedSteps.has(0) ? "✓" : "1"}
                  </div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{STEP_TITLES[0]}</h3>
                  {currentStep === 0 && !completedSteps.has(0) && (
                    <s-badge tone="info">Current</s-badge>
                  )}
                  {completedSteps.has(0) && (
                    <s-badge tone="success">Done</s-badge>
                  )}
                </s-stack>
              </s-stack>

              <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
                Choose a bundle type and set up your first bundle in the Dashboard. You can create as many bundles as your plan allows.
              </p>

              <div className={styles.bundleTypeGrid}>
                <div className={`${styles.bundleTypeCard} ${styles.bundleTypeCardActive}`}>
                  <div className={styles.bundleTypeCardTitle}>
                    🛒 Product Page Bundle
                    <span className={styles.recommendedBadge}>Recommended</span>
                  </div>
                  <div className={styles.bundleTypeCardDesc}>
                    A slide-out drawer widget that appears on product pages.
                    Customers build their bundle without leaving the page.
                  </div>
                </div>
                <div className={styles.bundleTypeCard}>
                  <div className={styles.bundleTypeCardTitle}>
                    📄 Full-Page Bundle
                  </div>
                  <div className={styles.bundleTypeCardDesc}>
                    A dedicated Shopify page with step-by-step tabs, a timeline header, and sidebar or footer layouts.
                  </div>
                </div>
              </div>

              <s-stack direction="block" gap="small-100">
                <s-stack direction="inline" gap="small-100" wrap>
                  <span className={styles.featureBadge}>✦ Mix &amp; Match steps</span>
                  <span className={styles.featureBadge}>✦ Quantity conditions</span>
                  <span className={styles.featureBadge}>✦ Collection filters</span>
                  <span className={`${styles.featureBadge} ${styles.featureBadgeGreen}`}>✦ Smart discount rules</span>
                </s-stack>
              </s-stack>

              <s-stack direction="inline" gap="small-100">
                <s-button
                  variant="primary"
                  onClick={() => {
                    handleStepAction(0);
                    navigate("/app/dashboard");
                  }}
                >
                  Create Your First Bundle
                </s-button>
                {currentStep === 0 && (
                  <s-button onClick={() => goToStep(1)}>Skip for now</s-button>
                )}
              </s-stack>
            </s-stack>
          </s-section>

          {/* Step 2: Install Widget */}
          <s-section>
            <s-stack direction="block" gap="base">
              <s-stack direction="inline" justifyContent="space-between" alignItems="center">
                <s-stack direction="inline" alignItems="center" gap="small">
                  <div
                    className={`${styles.stepBadge} ${
                      completedSteps.has(1) ? styles.stepBadgeComplete : ""
                    }`}
                  >
                    {completedSteps.has(1) ? "✓" : "2"}
                  </div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{STEP_TITLES[1]}</h3>
                  {currentStep === 1 && !completedSteps.has(1) && (
                    <s-badge tone="info">Current</s-badge>
                  )}
                  {completedSteps.has(1) && (
                    <s-badge tone="success">Done</s-badge>
                  )}
                </s-stack>
              </s-stack>

              <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
                Add the Wolfpack bundle widget to your Shopify theme using the theme editor deep link below.
                Your theme must be Online Store 2.0 compatible (JSON templates).
              </p>

              <s-divider />

              <s-banner tone="info">
                <s-stack direction="block" gap="small-100">
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Where should bundles appear?</p>
                  <p style={{ margin: 0, fontSize: 13, color: "#6d7175" }}>
                    Select the page template and we&apos;ll open the theme editor with the bundle block ready to add.
                  </p>
                </s-stack>
              </s-banner>

              <s-section>
                <s-stack direction="block" gap="base">
                  <s-select
                    ref={templateSelectRef}
                    label="Page template"
                    helpText="Product pages are recommended — bundles are linked to specific products."
                    onChange={(e: Event) =>
                      setSelectedTemplate((e.target as HTMLSelectElement).value)
                    }
                  >
                    <option value="product">Product Pages (Recommended)</option>
                    <option value="index">Home Page</option>
                    <option value="collection">Collection Pages</option>
                  </s-select>

                  <s-checkbox
                    label="Show advanced placement options"
                    checked={showAdvancedPlacement || undefined}
                    onChange={(e: Event) =>
                      setShowAdvancedPlacement((e.target as HTMLInputElement).checked)
                    }
                  />

                  {showAdvancedPlacement && (
                    <s-select
                      ref={targetSelectRef}
                      label="Block placement target"
                      helpText="Where on the template the bundle widget block will be inserted."
                      onChange={(e: Event) =>
                        setSelectedTarget((e.target as HTMLSelectElement).value)
                      }
                    >
                      <option value="newAppsSection">New Apps Section (Recommended)</option>
                      <option value="mainSection">Main Section</option>
                      <option value="sectionGroup:header">Header Section Group</option>
                      <option value="sectionGroup:footer">Footer Section Group</option>
                    </s-select>
                  )}
                </s-stack>
              </s-section>

              <s-banner tone="info">
                <s-stack direction="block" gap="small-100">
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Installation steps:</p>
                  <ol style={{ margin: "0 0 0 20px", padding: 0 }}>
                    <li style={{ fontSize: 13, marginBottom: 4 }}>
                      Click &quot;Open Theme Editor&quot; — the bundle block will be pre-selected
                    </li>
                    <li style={{ fontSize: 13, marginBottom: 4 }}>
                      Position the block near the product form (below &quot;Add to Cart&quot;)
                    </li>
                    <li style={{ fontSize: 13, marginBottom: 4 }}>
                      Preview your changes to confirm placement
                    </li>
                    <li style={{ fontSize: 13 }}>
                      Click &quot;Save&quot; in the theme editor to publish
                    </li>
                  </ol>
                </s-stack>
              </s-banner>

              <s-banner tone="warning">
                <p style={{ margin: 0, fontSize: 13 }}>
                  <strong>Note:</strong> The bundle widget only displays on products that are configured as bundle
                  containers. After creating a bundle, assign it to a product in the bundle settings.
                </p>
              </s-banner>

              <s-stack direction="inline" gap="small-100">
                <s-button variant="primary" onClick={handleOpenThemeEditor}>
                  Open Theme Editor
                </s-button>
                {currentStep === 1 && (
                  <s-button onClick={() => goToStep(2)}>Skip for now</s-button>
                )}
              </s-stack>
            </s-stack>
          </s-section>

          {/* Step 3: Customize Design */}
          <s-section>
            <s-stack direction="block" gap="base">
              <s-stack direction="inline" justifyContent="space-between" alignItems="center">
                <s-stack direction="inline" alignItems="center" gap="small">
                  <div
                    className={`${styles.stepBadge} ${
                      completedSteps.has(2) ? styles.stepBadgeComplete : ""
                    }`}
                  >
                    {completedSteps.has(2) ? "✓" : "3"}
                  </div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{STEP_TITLES[2]}</h3>
                  {currentStep === 2 && !completedSteps.has(2) && (
                    <s-badge tone="info">Current</s-badge>
                  )}
                  {completedSteps.has(2) && (
                    <s-badge tone="success">Done</s-badge>
                  )}
                </s-stack>
              </s-stack>

              <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
                The Design Control Panel gives you full control over how your bundles look — no coding required.
                Changes apply instantly to your storefront.
              </p>

              <s-stack direction="block" gap="small">
                <s-stack direction="inline" gap="small-100" wrap>
                  <span className={styles.featureBadge}>🎨 Colors &amp; typography</span>
                  <span className={styles.featureBadge}>🖼️ Promo banner with images/GIFs</span>
                  <span className={styles.featureBadge}>⚡ Loading animations</span>
                </s-stack>
                <s-stack direction="inline" gap="small-100" wrap>
                  <span className={`${styles.featureBadge} ${styles.featureBadgeGreen}`}>📐 Footer &amp; header layouts</span>
                  <span className={`${styles.featureBadge} ${styles.featureBadgeGreen}`}>💅 Custom CSS injection</span>
                  <span className={`${styles.featureBadge} ${styles.featureBadgeGreen}`}>🔢 Discount messaging templates</span>
                </s-stack>
              </s-stack>

              <s-banner tone="info">
                <p style={{ margin: 0, fontSize: 13 }}>
                  The DCP has separate settings for <strong>Product Page</strong> and{" "}
                  <strong>Full-Page</strong> bundle types. You can customize each independently with a live preview on the right.
                </p>
              </s-banner>

              <s-stack direction="inline" gap="small-100">
                <s-button
                  variant="primary"
                  onClick={() => {
                    handleStepAction(2);
                    navigate("/app/design-control-panel");
                  }}
                >
                  Open Design Control Panel
                </s-button>
                {currentStep === 2 && (
                  <s-button onClick={() => goToStep(3)}>Skip for now</s-button>
                )}
              </s-stack>
            </s-stack>
          </s-section>

          {/* Step 4: Analytics & Go Live */}
          <s-section>
            <s-stack direction="block" gap="base">
              <s-stack direction="inline" justifyContent="space-between" alignItems="center">
                <s-stack direction="inline" alignItems="center" gap="small">
                  <div
                    className={`${styles.stepBadge} ${
                      completedSteps.has(3) ? styles.stepBadgeComplete : ""
                    }`}
                  >
                    {completedSteps.has(3) ? "✓" : "4"}
                  </div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{STEP_TITLES[3]}</h3>
                  {currentStep === 3 && !completedSteps.has(3) && (
                    <s-badge tone="info">Current</s-badge>
                  )}
                  {completedSteps.has(3) && (
                    <s-badge tone="success">Done</s-badge>
                  )}
                </s-stack>
              </s-stack>

              <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
                Wolfpack includes a built-in UTM attribution system. Add UTM parameters to your ad links and see
                exactly which campaigns, platforms, and bundles are driving revenue.
              </p>

              <s-stack direction="block" gap="small">
                <s-stack direction="inline" gap="small-100" wrap>
                  <span className={`${styles.featureBadge} ${styles.featureBadgeOrange}`}>📊 Revenue by platform</span>
                  <span className={`${styles.featureBadge} ${styles.featureBadgeOrange}`}>📈 Revenue by campaign</span>
                  <span className={`${styles.featureBadge} ${styles.featureBadgeOrange}`}>🎯 Top bundles by ad revenue</span>
                </s-stack>
              </s-stack>

              <s-banner tone="info">
                <s-stack direction="block" gap="small-100">
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>How UTM tracking works:</p>
                  <ol style={{ margin: "0 0 0 20px", padding: 0 }}>
                    <li style={{ fontSize: 13, marginBottom: 4 }}>
                      Add UTM params to your ad links —{" "}
                      <code style={{ background: "#f0f4ff", padding: "1px 6px", borderRadius: 4, fontSize: 12 }}>
                        ?utm_source=facebook&amp;utm_campaign=bundles
                      </code>
                    </li>
                    <li style={{ fontSize: 13, marginBottom: 4 }}>
                      The web pixel captures UTM params on the first page view and stores them in the browser session
                    </li>
                    <li style={{ fontSize: 13 }}>
                      At checkout, attribution data is saved and appears on the Analytics dashboard
                    </li>
                  </ol>
                </s-stack>
              </s-banner>

              <p style={{ margin: 0, fontSize: 13, color: "#6d7175" }}>
                The attribution pixel is already installed — no additional setup required.
                Start tagging your ad links and the data will appear automatically.
              </p>

              <s-stack direction="inline" gap="small-100">
                <s-button
                  variant="primary"
                  onClick={() => {
                    handleStepAction(3);
                    navigate("/app/dashboard");
                  }}
                >
                  Go to Dashboard
                </s-button>
                <s-button
                  onClick={() => {
                    handleStepAction(3);
                    navigate("/app/attribution");
                  }}
                >
                  View Analytics
                </s-button>
              </s-stack>
            </s-stack>
          </s-section>

          {/* Help section */}
          <s-section>
            <s-stack direction="block" gap="base">
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Need help getting set up?</h2>
              <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
                Our support team is here to help. Reach out any time and we&apos;ll get you sorted.
              </p>
              <s-stack direction="inline" gap="small-100" wrap>
                <s-button
                  onClick={() => {
                    if (window.$crisp) {
                      window.$crisp.push(["do", "chat:open"]);
                    }
                  }}
                >
                  Chat with Support
                </s-button>
                <s-button href="https://docs.wolfpack-bundles.com" target="_blank">
                  View Documentation
                </s-button>
                <s-button onClick={() => navigate("/app/dashboard")}>
                  Skip to Dashboard
                </s-button>
              </s-stack>
            </s-stack>
          </s-section>

        </s-stack>
      </div>
    </>
  );
}

declare global {
  interface Window {
    $crisp?: any[];
  }
}
