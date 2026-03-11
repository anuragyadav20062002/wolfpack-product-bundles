/**
 * Onboarding Wizard
 *
 * Shown to new merchants after the landing screen.
 * Covers: bundle creation → widget install → design → analytics → go live.
 */

import { type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  InlineStack,
  Text,
  Button,
  Badge,
  Select,
  Checkbox,
  Banner,
  List,
  Divider,
} from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../../shopify.server";
import { useState } from "react";
import { AppLogger } from "../../lib/logger";
import styles from "../../styles/routes/app-index.module.css";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  // App API key (client_id) is required for the theme editor deep link.
  // Per Shopify docs: addAppBlockId={api_key}/{handle}
  const apiKey = process.env.SHOPIFY_API_KEY;
  const blockHandle = "bundle-product-page";

  return {
    shop: session.shop,
    apiKey,
    blockHandle,
  };
};

// ── Step content definitions ─────────────────────────────────
const STEP_TITLES = [
  "Create Your First Bundle",
  "Install the Widget in Your Theme",
  "Customize Your Bundle Design",
  "Track Performance & Go Live",
];

export default function Onboarding() {
  const { shop, apiKey, blockHandle } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  useAppBridge();

  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Theme editor widget install options
  const [selectedTemplate, setSelectedTemplate] = useState("product");
  const [selectedTarget, setSelectedTarget] = useState("newAppsSection");
  const [showAdvancedPlacement, setShowAdvancedPlacement] = useState(false);

  const totalSteps = STEP_TITLES.length;

  /** Generate Shopify theme editor deep link per official docs */
  const generateThemeEditorLink = (
    template: string,
    target: string
  ): string => {
    const appBlockId = `${apiKey}/${blockHandle}`;
    const params = new URLSearchParams({
      template,
      addAppBlockId: appBlockId,
      target,
    });
    return `https://${shop}/admin/themes/current/editor?${params.toString()}`;
  };

  const handleOpenThemeEditor = () => {
    const url = generateThemeEditorLink(selectedTemplate, selectedTarget);
    AppLogger.info("Opening theme editor from onboarding", {
      shop,
      template: selectedTemplate,
      target: selectedTarget,
    });
    // Open in a new tab to preserve the embedded app session
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
    <Page
      title="Setup Guide"
      subtitle="Follow these steps to launch product bundles on your store"
      backAction={{
        content: "Home",
        onAction: () => navigate("/app"),
      }}
    >
      <Layout>
        {/* ── Progress header ── */}
        <Layout.Section>
          <div className={styles.onboardingHero}>
            <div className={styles.onboardingHeroInner}>
              <div style={{ fontSize: 40 }}>🐺</div>
              <div className={styles.onboardingHeroText}>
                <h2>Welcome to Wolfpack: Product Bundles</h2>
                <p>
                  Complete these{" "}
                  <strong style={{ color: "#ffffff" }}>{totalSteps} steps</strong> to
                  set up bundles, customize your design, and start driving
                  revenue.&nbsp;
                  {completedSteps.size > 0 && (
                    <span style={{ color: "rgba(255,255,255,0.6)" }}>
                      {completedSteps.size}/{totalSteps} done ✓
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </Layout.Section>

        {/* ── Step cards ── */}
        <Layout.Section>
          <BlockStack gap="400">

            {/* ── Step 1: Create Bundle ───────────────────── */}
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <InlineStack gap="300" blockAlign="center">
                    <div
                      className={`${styles.stepBadge} ${
                        completedSteps.has(0) ? styles.stepBadgeComplete : ""
                      }`}
                    >
                      {completedSteps.has(0) ? "✓" : "1"}
                    </div>
                    <Text variant="headingMd" as="h3">
                      {STEP_TITLES[0]}
                    </Text>
                    {currentStep === 0 && !completedSteps.has(0) && (
                      <Badge tone="info">Current</Badge>
                    )}
                    {completedSteps.has(0) && (
                      <Badge tone="success">Done</Badge>
                    )}
                  </InlineStack>
                </InlineStack>

                <Text variant="bodyMd" as="p" tone="subdued">
                  Choose a bundle type and set up your first bundle in the
                  Dashboard. You can create as many bundles as your plan allows.
                </Text>

                {/* Bundle type cards */}
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
                      A dedicated Shopify page with step-by-step tabs, a
                      timeline header, and sidebar or footer layouts.
                    </div>
                  </div>
                </div>

                <BlockStack gap="200">
                  <InlineStack gap="200" wrap>
                    <span className={styles.featureBadge}>✦ Mix & Match steps</span>
                    <span className={styles.featureBadge}>✦ Quantity conditions</span>
                    <span className={styles.featureBadge}>✦ Collection filters</span>
                    <span className={`${styles.featureBadge} ${styles.featureBadgeGreen}`}>✦ Smart discount rules</span>
                  </InlineStack>
                </BlockStack>

                <InlineStack gap="200">
                  <Button
                    variant="primary"
                    onClick={() => {
                      handleStepAction(0);
                      navigate("/app/dashboard");
                    }}
                  >
                    Create Your First Bundle
                  </Button>
                  {currentStep === 0 && (
                    <Button onClick={() => goToStep(1)}>Skip for now</Button>
                  )}
                </InlineStack>
              </BlockStack>
            </Card>

            {/* ── Step 2: Install Widget ──────────────────── */}
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <InlineStack gap="300" blockAlign="center">
                    <div
                      className={`${styles.stepBadge} ${
                        completedSteps.has(1) ? styles.stepBadgeComplete : ""
                      }`}
                    >
                      {completedSteps.has(1) ? "✓" : "2"}
                    </div>
                    <Text variant="headingMd" as="h3">
                      {STEP_TITLES[1]}
                    </Text>
                    {currentStep === 1 && !completedSteps.has(1) && (
                      <Badge tone="info">Current</Badge>
                    )}
                    {completedSteps.has(1) && (
                      <Badge tone="success">Done</Badge>
                    )}
                  </InlineStack>
                </InlineStack>

                <Text variant="bodyMd" as="p" tone="subdued">
                  Add the Wolfpack bundle widget to your Shopify theme using the
                  theme editor deep link below. Your theme must be Online Store
                  2.0 compatible (JSON templates).
                </Text>

                <Divider />

                <Banner tone="info">
                  <BlockStack gap="200">
                    <Text variant="bodyMd" as="p" fontWeight="semibold">
                      Where should bundles appear?
                    </Text>
                    <Text variant="bodyMd" as="p" tone="subdued">
                      Select the page template and we&apos;ll open the theme editor
                      with the bundle block ready to add.
                    </Text>
                  </BlockStack>
                </Banner>

                <Card>
                  <BlockStack gap="400">
                    <Select
                      label="Page template"
                      options={[
                        {
                          label: "Product Pages (Recommended)",
                          value: "product",
                        },
                        { label: "Home Page", value: "index" },
                        { label: "Collection Pages", value: "collection" },
                      ]}
                      value={selectedTemplate}
                      onChange={setSelectedTemplate}
                      helpText="Product pages are recommended — bundles are linked to specific products."
                    />

                    <Checkbox
                      label="Show advanced placement options"
                      checked={showAdvancedPlacement}
                      onChange={setShowAdvancedPlacement}
                    />

                    {showAdvancedPlacement && (
                      <Select
                        label="Block placement target"
                        options={[
                          {
                            label: "New Apps Section (Recommended)",
                            value: "newAppsSection",
                          },
                          { label: "Main Section", value: "mainSection" },
                          {
                            label: "Header Section Group",
                            value: "sectionGroup:header",
                          },
                          {
                            label: "Footer Section Group",
                            value: "sectionGroup:footer",
                          },
                        ]}
                        value={selectedTarget}
                        onChange={setSelectedTarget}
                        helpText="Where on the template the bundle widget block will be inserted."
                      />
                    )}
                  </BlockStack>
                </Card>

                <Banner tone="info">
                  <BlockStack gap="200">
                    <Text variant="bodyMd" as="p" fontWeight="semibold">
                      Installation steps:
                    </Text>
                    <List type="number">
                      <List.Item>
                        Click &quot;Open Theme Editor&quot; — the bundle block will be
                        pre-selected
                      </List.Item>
                      <List.Item>
                        Position the block near the product form (below
                        &quot;Add to Cart&quot;)
                      </List.Item>
                      <List.Item>
                        Preview your changes to confirm placement
                      </List.Item>
                      <List.Item>
                        Click &quot;Save&quot; in the theme editor to publish
                      </List.Item>
                    </List>
                  </BlockStack>
                </Banner>

                <Banner tone="warning">
                  <Text variant="bodyMd" as="p">
                    <strong>Note:</strong> The bundle widget only displays on
                    products that are configured as bundle containers. After
                    creating a bundle, assign it to a product in the bundle
                    settings.
                  </Text>
                </Banner>

                <InlineStack gap="200">
                  <Button
                    variant="primary"
                    onClick={handleOpenThemeEditor}
                  >
                    Open Theme Editor
                  </Button>
                  {currentStep === 1 && (
                    <Button onClick={() => goToStep(2)}>Skip for now</Button>
                  )}
                </InlineStack>
              </BlockStack>
            </Card>

            {/* ── Step 3: Customize Design ────────────────── */}
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <InlineStack gap="300" blockAlign="center">
                    <div
                      className={`${styles.stepBadge} ${
                        completedSteps.has(2) ? styles.stepBadgeComplete : ""
                      }`}
                    >
                      {completedSteps.has(2) ? "✓" : "3"}
                    </div>
                    <Text variant="headingMd" as="h3">
                      {STEP_TITLES[2]}
                    </Text>
                    {currentStep === 2 && !completedSteps.has(2) && (
                      <Badge tone="info">Current</Badge>
                    )}
                    {completedSteps.has(2) && (
                      <Badge tone="success">Done</Badge>
                    )}
                  </InlineStack>
                </InlineStack>

                <Text variant="bodyMd" as="p" tone="subdued">
                  The Design Control Panel gives you full control over how your
                  bundles look — no coding required. Changes apply instantly to
                  your storefront.
                </Text>

                <BlockStack gap="300">
                  <InlineStack gap="200" wrap>
                    <span className={styles.featureBadge}>🎨 Colors & typography</span>
                    <span className={styles.featureBadge}>🖼️ Promo banner with images/GIFs</span>
                    <span className={styles.featureBadge}>⚡ Loading animations</span>
                  </InlineStack>
                  <InlineStack gap="200" wrap>
                    <span className={`${styles.featureBadge} ${styles.featureBadgeGreen}`}>📐 Footer & header layouts</span>
                    <span className={`${styles.featureBadge} ${styles.featureBadgeGreen}`}>💅 Custom CSS injection</span>
                    <span className={`${styles.featureBadge} ${styles.featureBadgeGreen}`}>🔢 Discount messaging templates</span>
                  </InlineStack>
                </BlockStack>

                <Banner tone="info">
                  <Text variant="bodyMd" as="p">
                    The DCP has separate settings for{" "}
                    <strong>Product Page</strong> and{" "}
                    <strong>Full-Page</strong> bundle types. You can customize
                    each independently with a live preview on the right.
                  </Text>
                </Banner>

                <InlineStack gap="200">
                  <Button
                    variant="primary"
                    onClick={() => {
                      handleStepAction(2);
                      navigate("/app/design-control-panel");
                    }}
                  >
                    Open Design Control Panel
                  </Button>
                  {currentStep === 2 && (
                    <Button onClick={() => goToStep(3)}>Skip for now</Button>
                  )}
                </InlineStack>
              </BlockStack>
            </Card>

            {/* ── Step 4: Analytics & Go Live ─────────────── */}
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <InlineStack gap="300" blockAlign="center">
                    <div
                      className={`${styles.stepBadge} ${
                        completedSteps.has(3) ? styles.stepBadgeComplete : ""
                      }`}
                    >
                      {completedSteps.has(3) ? "✓" : "4"}
                    </div>
                    <Text variant="headingMd" as="h3">
                      {STEP_TITLES[3]}
                    </Text>
                    {currentStep === 3 && !completedSteps.has(3) && (
                      <Badge tone="info">Current</Badge>
                    )}
                    {completedSteps.has(3) && (
                      <Badge tone="success">Done</Badge>
                    )}
                  </InlineStack>
                </InlineStack>

                <Text variant="bodyMd" as="p" tone="subdued">
                  Wolfpack includes a built-in UTM attribution system. Add UTM
                  parameters to your ad links and see exactly which campaigns,
                  platforms, and bundles are driving revenue.
                </Text>

                <BlockStack gap="300">
                  <InlineStack gap="200" wrap>
                    <span className={`${styles.featureBadge} ${styles.featureBadgeOrange}`}>📊 Revenue by platform</span>
                    <span className={`${styles.featureBadge} ${styles.featureBadgeOrange}`}>📈 Revenue by campaign</span>
                    <span className={`${styles.featureBadge} ${styles.featureBadgeOrange}`}>🎯 Top bundles by ad revenue</span>
                  </InlineStack>
                </BlockStack>

                <Banner tone="info">
                  <BlockStack gap="200">
                    <Text variant="bodyMd" as="p" fontWeight="semibold">
                      How UTM tracking works:
                    </Text>
                    <List type="number">
                      <List.Item>
                        Add UTM params to your ad links —{" "}
                        <code
                          style={{
                            background: "#f0f4ff",
                            padding: "1px 6px",
                            borderRadius: 4,
                            fontSize: 12,
                          }}
                        >
                          ?utm_source=facebook&amp;utm_campaign=bundles
                        </code>
                      </List.Item>
                      <List.Item>
                        The web pixel captures UTM params on the first page
                        view and stores them in the browser session
                      </List.Item>
                      <List.Item>
                        At checkout, attribution data is saved and appears on
                        the Analytics dashboard
                      </List.Item>
                    </List>
                  </BlockStack>
                </Banner>

                <Text variant="bodyMd" as="p" tone="subdued">
                  The attribution pixel is already installed — no additional
                  setup required. Start tagging your ad links and the data will
                  appear automatically.
                </Text>

                <InlineStack gap="200">
                  <Button
                    variant="primary"
                    onClick={() => {
                      handleStepAction(3);
                      navigate("/app/dashboard");
                    }}
                  >
                    Go to Dashboard
                  </Button>
                  <Button
                    onClick={() => {
                      handleStepAction(3);
                      navigate("/app/attribution");
                    }}
                  >
                    View Analytics
                  </Button>
                </InlineStack>
              </BlockStack>
            </Card>

          </BlockStack>
        </Layout.Section>

        {/* ── Help section ── */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <Text variant="headingMd" as="h2">
                  Need help getting set up?
                </Text>
              </InlineStack>
              <Text variant="bodyMd" as="p" tone="subdued">
                Our support team is here to help. Reach out any time and
                we&apos;ll get you sorted.
              </Text>
              <InlineStack gap="200" wrap>
                <Button
                  url="mailto:support@wolfpack-bundles.com"
                  external
                >
                  Email Support
                </Button>
                <Button
                  url="https://docs.wolfpack-bundles.com"
                  external
                >
                  View Documentation
                </Button>
                <Button
                  onClick={() => navigate("/app/dashboard")}
                >
                  Skip to Dashboard
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
