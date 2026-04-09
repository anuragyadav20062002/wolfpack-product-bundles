import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSubmit, useActionData, useNavigation } from "@remix-run/react";
import {
  Page,
  Frame,
  Toast,
  Layout,
  Card,
  BlockStack,
  Text,
  Button,
  InlineStack,
  Banner,
  Box,
} from "@shopify/polaris";
import { Modal, SaveBar, useAppBridge } from "@shopify/app-bridge-react";
import { requireAdminSession } from "../../../lib/auth-guards.server";
import { AppLogger } from "../../../lib/logger";
import { useCallback, useEffect, useRef } from "react";
import { prisma } from "../../../db.server";

import { useDesignControlPanelState } from "../../../hooks/useDesignControlPanelState";
import { BundleType } from "../../../constants/bundle";

import { SettingsPanel } from "../../../components/design-control-panel/settings";
import { PreviewPanel } from "../../../components/design-control-panel/preview";
import { NavigationSidebar } from "../../../components/design-control-panel/NavigationSidebar";
import { CustomCssCard, CssGuideContent } from "../../../components/design-control-panel/CustomCssCard";

import { DEFAULT_SETTINGS, mergeSettings } from "../../../components/design-control-panel/config";
import { handleSaveSettings } from "./handlers.server";
import { BillingService } from "../../../services/billing.server";
import designControlPanelStyles from "../../../styles/routes/design-control-panel.module.css";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await requireAdminSession(request);
  const shopId = session.shop;
  const appUrl = (process.env.SHOPIFY_APP_URL ?? "").replace(/\/$/, "");

  const [productPageSettings, fullPageSettings] = await Promise.all([
    prisma.designSettings.findUnique({
      where: { shopId_bundleType: { shopId, bundleType: "product_page" } },
    }),
    prisma.designSettings.findUnique({
      where: { shopId_bundleType: { shopId, bundleType: "full_page" } },
    }),
  ]);

  const settings = {
    product_page: mergeSettings(productPageSettings, DEFAULT_SETTINGS.product_page),
    full_page: mergeSettings(fullPageSettings, DEFAULT_SETTINGS.full_page),
  };

  // App-served preview pages — same origin as app, no X-Frame-Options issues.
  // CSS variables are pushed in real-time via postMessage by PreviewPanel.
  const pdpPreviewUrl = appUrl
    ? `${appUrl}/api/preview/pdp?shop=${shopId}`
    : null;
  const fpbPreviewUrl = appUrl
    ? `${appUrl}/api/preview/fpb?shop=${shopId}`
    : null;

  const canAccessDcp = await BillingService.isFeatureAvailable(shopId, "design_control_panel");

  return json({
    shopId,
    settings,
    previewUrls: { pdp: pdpPreviewUrl, fpb: fpbPreviewUrl },
    isPaywalled: !canAccessDcp
  });
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    const { session } = await requireAdminSession(request);
    const shopId = session.shop;
    const formData = await request.json();
    return handleSaveSettings(shopId, formData);
  } catch (error) {
    AppLogger.error("Error saving design settings", {
      component: "app.design-control-panel",
      operation: "action",
    }, error instanceof Error ? error : new Error(String(error)));
    return json({ success: false, message: "Failed to save design settings" }, { status: 500 });
  }
}

// ─── SVG Illustrations ────────────────────────────────────────────────────────

function FullPageSvg() {
  return (
    <svg width="220" height="140" viewBox="0 0 220 140" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Browser chrome */}
      <rect x="8" y="8" width="204" height="124" rx="8" fill="#F3F0FF" stroke="#7132FF" strokeWidth="1.5" />
      <rect x="8" y="8" width="204" height="20" rx="8" fill="#E9E2FF" />
      <rect x="8" y="20" width="204" height="8" fill="#E9E2FF" />
      {/* Browser dots */}
      <circle cx="22" cy="18" r="3" fill="#C4B5FD" />
      <circle cx="34" cy="18" r="3" fill="#C4B5FD" />
      <circle cx="46" cy="18" r="3" fill="#C4B5FD" />
      {/* URL bar */}
      <rect x="58" y="13" width="104" height="10" rx="5" fill="#DDD6FE" />

      {/* Left step timeline */}
      <rect x="16" y="36" width="36" height="88" rx="4" fill="#EDE9FF" />
      {/* Step circles */}
      <circle cx="34" cy="54" r="8" fill="#7132FF" />
      <text x="34" y="58" textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">1</text>
      <line x1="34" y1="62" x2="34" y2="72" stroke="#C4B5FD" strokeWidth="1.5" strokeDasharray="2 2" />
      <circle cx="34" cy="80" r="8" fill="#7132FF" opacity="0.4" />
      <text x="34" y="84" textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">2</text>
      <line x1="34" y1="88" x2="34" y2="98" stroke="#C4B5FD" strokeWidth="1.5" strokeDasharray="2 2" />
      <circle cx="34" cy="106" r="8" fill="#7132FF" opacity="0.2" />
      <text x="34" y="110" textAnchor="middle" fontSize="8" fill="#7132FF" fontWeight="bold">3</text>

      {/* Product grid (2×3) */}
      <rect x="60" y="36" width="40" height="36" rx="4" fill="#DDD6FE" />
      <rect x="106" y="36" width="40" height="36" rx="4" fill="#DDD6FE" />
      <rect x="152" y="36" width="40" height="36" rx="4" fill="#DDD6FE" />
      <rect x="60" y="78" width="40" height="36" rx="4" fill="#DDD6FE" />
      <rect x="106" y="78" width="40" height="36" rx="4" fill="#DDD6FE" />
      <rect x="152" y="78" width="40" height="36" rx="4" fill="#DDD6FE" />
      {/* Card accent lines */}
      <rect x="64" y="62" width="32" height="4" rx="2" fill="#A78BFA" />
      <rect x="110" y="62" width="32" height="4" rx="2" fill="#A78BFA" />
      <rect x="156" y="62" width="32" height="4" rx="2" fill="#A78BFA" />

      {/* Footer bar */}
      <rect x="16" y="118" width="188" height="10" rx="3" fill="#7132FF" opacity="0.15" />
      <rect x="152" y="119" width="40" height="8" rx="3" fill="#7132FF" opacity="0.7" />
    </svg>
  );
}

function ProductPageSvg() {
  return (
    <svg width="220" height="140" viewBox="0 0 220 140" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Background page */}
      <rect x="8" y="8" width="204" height="124" rx="8" fill="#F7F7F7" stroke="#E0E0E0" strokeWidth="1.5" />
      {/* Page chrome */}
      <rect x="8" y="8" width="204" height="16" rx="8" fill="#EBEBEB" />
      <rect x="8" y="16" width="204" height="8" fill="#EBEBEB" />
      <circle cx="20" cy="16" r="3" fill="#D0D0D0" />
      <circle cx="30" cy="16" r="3" fill="#D0D0D0" />
      <circle cx="40" cy="16" r="3" fill="#D0D0D0" />
      {/* Page product image placeholder */}
      <rect x="16" y="30" width="56" height="64" rx="4" fill="#E3E3E3" />
      <line x1="16" y1="30" x2="72" y2="94" stroke="#D0D0D0" strokeWidth="1" />
      <line x1="72" y1="30" x2="16" y2="94" stroke="#D0D0D0" strokeWidth="1" />
      {/* Page text lines */}
      <rect x="80" y="34" width="60" height="6" rx="3" fill="#D0D0D0" />
      <rect x="80" y="46" width="40" height="5" rx="2.5" fill="#E3E3E3" />
      <rect x="80" y="56" width="50" height="5" rx="2.5" fill="#E3E3E3" />
      {/* Add to bundle button on page */}
      <rect x="80" y="68" width="80" height="14" rx="5" fill="#1A1A1A" opacity="0.7" />
      <rect x="88" y="72" width="60" height="4" rx="2" fill="white" opacity="0.5" />

      {/* Modal overlay backdrop */}
      <rect x="8" y="8" width="204" height="124" rx="8" fill="rgba(0,0,0,0.18)" />

      {/* Modal card */}
      <rect x="30" y="20" width="160" height="110" rx="8" fill="white" />
      <rect x="30" y="20" width="160" height="22" rx="8" fill="#F0F0F0" />
      <rect x="30" y="34" width="160" height="8" fill="#F0F0F0" />

      {/* Modal tabs */}
      <rect x="36" y="23" width="46" height="12" rx="4" fill="#1A1A1A" />
      <rect x="86" y="23" width="46" height="12" rx="4" fill="#E8E8E8" />
      <rect x="136" y="23" width="46" height="12" rx="4" fill="#E8E8E8" />
      <rect x="40" y="26" width="36" height="4" rx="2" fill="white" opacity="0.7" />
      <rect x="90" y="26" width="36" height="4" rx="2" fill="#B0B0B0" />
      <rect x="140" y="26" width="36" height="4" rx="2" fill="#B0B0B0" />

      {/* Modal product grid 2×2 */}
      <rect x="36" y="44" width="68" height="36" rx="4" fill="#F3F3F3" />
      <rect x="114" y="44" width="68" height="36" rx="4" fill="#F3F3F3" />
      <rect x="36" y="84" width="68" height="30" rx="4" fill="#F3F3F3" />
      <rect x="114" y="84" width="68" height="30" rx="4" fill="#F3F3F3" />
      {/* Card title lines */}
      <rect x="40" y="70" width="56" height="4" rx="2" fill="#C8C8C8" />
      <rect x="118" y="70" width="56" height="4" rx="2" fill="#C8C8C8" />

      {/* Modal footer */}
      <rect x="30" y="118" width="160" height="12" rx="4" fill="#1A1A1A" opacity="0.85" />
      <rect x="130" y="120" width="52" height="8" rx="3" fill="#1A1A1A" />
      <rect x="134" y="122" width="40" height="4" rx="2" fill="white" opacity="0.5" />

      {/* Close button */}
      <circle cx="182" cy="26" r="6" fill="#E0E0E0" />
      <line x1="179" y1="23" x2="185" y2="29" stroke="#888" strokeWidth="1.5" />
      <line x1="185" y1="23" x2="179" y2="29" stroke="#888" strokeWidth="1.5" />
    </svg>
  );
}

// ─── Route Component ──────────────────────────────────────────────────────────

export default function DesignControlPanel() {
  const { settings, previewUrls, isPaywalled } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const shopify = useAppBridge();

  // Separate hook instances — one per bundle type, state fully isolated
  const fullPageState = useDesignControlPanelState(settings, BundleType.FULL_PAGE);
  const productPageState = useDesignControlPanelState(settings, BundleType.PRODUCT_PAGE);

  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isLoading = navigation.state === "submitting";

  // Track which bundle type was last submitted (to route actionData to correct state)
  const lastSavedBundleType = useRef<BundleType>(BundleType.PRODUCT_PAGE);

  // Save bar visibility refs
  const fullPageSaveBarVisibleRef = useRef(false);
  const productPageSaveBarVisibleRef = useRef(false);
  const fullPageSaveBarTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const productPageSaveBarTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ── Save bar management — full page ──────────────────────────────────────────
  useEffect(() => {
    if (fullPageSaveBarTimeoutRef.current) clearTimeout(fullPageSaveBarTimeoutRef.current);

    if (fullPageState.hasUnsavedChanges) {
      if (!fullPageSaveBarVisibleRef.current) {
        void shopify.saveBar.show('dcp-full-page-save-bar');
        fullPageSaveBarVisibleRef.current = true;
      }
    } else {
      fullPageSaveBarTimeoutRef.current = setTimeout(() => {
        if (!fullPageState.hasUnsavedChanges && fullPageSaveBarVisibleRef.current) {
          void shopify.saveBar.hide('dcp-full-page-save-bar');
          fullPageSaveBarVisibleRef.current = false;
        }
      }, 100);
    }

    return () => { if (fullPageSaveBarTimeoutRef.current) clearTimeout(fullPageSaveBarTimeoutRef.current); };
  }, [fullPageState.hasUnsavedChanges, shopify]);

  // ── Save bar management — product page ───────────────────────────────────────
  useEffect(() => {
    if (productPageSaveBarTimeoutRef.current) clearTimeout(productPageSaveBarTimeoutRef.current);

    if (productPageState.hasUnsavedChanges) {
      if (!productPageSaveBarVisibleRef.current) {
        void shopify.saveBar.show('dcp-product-page-save-bar');
        productPageSaveBarVisibleRef.current = true;
      }
    } else {
      productPageSaveBarTimeoutRef.current = setTimeout(() => {
        if (!productPageState.hasUnsavedChanges && productPageSaveBarVisibleRef.current) {
          void shopify.saveBar.hide('dcp-product-page-save-bar');
          productPageSaveBarVisibleRef.current = false;
        }
      }, 100);
    }

    return () => { if (productPageSaveBarTimeoutRef.current) clearTimeout(productPageSaveBarTimeoutRef.current); };
  }, [productPageState.hasUnsavedChanges, shopify]);

  // ── Action data handler ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!actionData) return;

    const targetState = lastSavedBundleType.current === BundleType.FULL_PAGE ? fullPageState : productPageState;
    const saveBarId = lastSavedBundleType.current === BundleType.FULL_PAGE ? 'dcp-full-page-save-bar' : 'dcp-product-page-save-bar';

    targetState.setToastActive(true);
    targetState.setToastMessage(actionData.message);
    targetState.setToastError(!actionData.success);

    if (actionData.success) {
      void shopify.saveBar.hide(saveBarId);
      if (lastSavedBundleType.current === BundleType.FULL_PAGE) {
        fullPageSaveBarVisibleRef.current = false;
      } else {
        productPageSaveBarVisibleRef.current = false;
      }
      targetState.markAsSaved();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionData]);

  // ── Save handlers ─────────────────────────────────────────────────────────────
  const handleSaveFullPage = useCallback(() => {
    lastSavedBundleType.current = BundleType.FULL_PAGE;
    submit(
      { bundleType: BundleType.FULL_PAGE, settings: fullPageState.getSettingsForSave() },
      { method: "post", encType: "application/json" }
    );
  }, [fullPageState, submit]);

  const handleSaveProductPage = useCallback(() => {
    lastSavedBundleType.current = BundleType.PRODUCT_PAGE;
    submit(
      { bundleType: BundleType.PRODUCT_PAGE, settings: productPageState.getSettingsForSave() },
      { method: "post", encType: "application/json" }
    );
  }, [productPageState, submit]);

  const handleSaveCustomCss = useCallback((bundleType: BundleType) => {
    lastSavedBundleType.current = bundleType;
    const targetState = bundleType === BundleType.FULL_PAGE ? fullPageState : productPageState;
    submit(
      { bundleType, settings: targetState.getSettingsForSave() },
      { method: "post", encType: "application/json" }
    );
  }, [fullPageState, productPageState, submit]);

  // ── Modal handlers ────────────────────────────────────────────────────────────
  const handleOpenFullPageModal = useCallback(() => {
    void shopify.modal.show('dcp-full-page-modal');
  }, [shopify]);

  const handleOpenProductPageModal = useCallback(() => {
    void shopify.modal.show('dcp-product-page-modal');
  }, [shopify]);

  const handleOpenCssGuide = useCallback(() => {
    void shopify.modal.show('css-guide-modal');
  }, [shopify]);

  // Toast rendered once — from whichever state is active
  const activeToastState = fullPageState.toastActive ? fullPageState : productPageState;

  return (
    <Frame>
      <Page
        title="Design Control Panel"
        subtitle="Customize the appearance of your bundles"
        backAction={{ content: "Go to Bundles", url: "/app/dashboard" }}
      >
        {/* ── Paywall Banner (Grow plan required, shown on PROD for Free users) ── */}
        {isPaywalled && (
          <Box paddingBlockEnd="400">
            <Banner
              title="Design Control Panel is a Grow plan feature"
              tone="warning"
              action={{ content: "Upgrade to Grow", url: "/app/pricing" }}
            >
              <p>
                Unlock full design customization — colors, typography, hover animations, and
                custom CSS — by upgrading to the Grow plan for $9.99/month.
              </p>
            </Banner>
          </Box>
        )}

        {/* ── Bundle-Type Entry Cards ─────────────────────────────────────────── */}
        <div className={designControlPanelStyles.landingCardsRow}>
          {/* Landing Page Bundles */}
          <Card>
            <div className={designControlPanelStyles.bundleCardInner}>
              <div className={designControlPanelStyles.bundleCardSvgWrapper}>
                <FullPageSvg />
              </div>
              <BlockStack gap="100">
                <Text as="h2" variant="headingMd">
                  Landing Page Bundles
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  Customize storefront UI for full page bundles
                </Text>
              </BlockStack>
              <InlineStack>
                <Button
                  variant="primary"
                  onClick={handleOpenFullPageModal}
                  disabled={isPaywalled}
                  url={isPaywalled ? "/app/pricing" : undefined}
                >
                  {isPaywalled ? "Upgrade to Customize" : "Customize"}
                </Button>
              </InlineStack>
            </div>
          </Card>

          {/* Product Bundles */}
          <Card>
            <div className={designControlPanelStyles.bundleCardInner}>
              <div className={designControlPanelStyles.bundleCardSvgWrapper} style={{ background: "#F7F7F7" }}>
                <ProductPageSvg />
              </div>
              <BlockStack gap="100">
                <Text as="h2" variant="headingMd">
                  Product Bundles
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  Customize storefront UI for product page bundles
                </Text>
              </BlockStack>
              <InlineStack>
                <Button
                  variant="primary"
                  onClick={handleOpenProductPageModal}
                  disabled={isPaywalled}
                  url={isPaywalled ? "/app/pricing" : undefined}
                >
                  {isPaywalled ? "Upgrade to Customize" : "Customize"}
                </Button>
              </InlineStack>
            </div>
          </Card>
        </div>

        {/* ── Custom CSS Section ──────────────────────────────────────────────── */}
        <Layout>
          <Layout.Section>
            <div style={{ marginTop: "20px", opacity: isPaywalled ? 0.5 : 1, pointerEvents: isPaywalled ? "none" : undefined }}>
              <CustomCssCard
                fullPageCss={fullPageState.settings.customCss ?? ""}
                productPageCss={productPageState.settings.customCss ?? ""}
                onFullPageCssChange={(v) => fullPageState.updateSetting("customCss", v)}
                onProductPageCssChange={(v) => productPageState.updateSetting("customCss", v)}
                onSave={handleSaveCustomCss}
                onOpenCssGuide={handleOpenCssGuide}
                isLoading={isLoading}
              />
            </div>
          </Layout.Section>
        </Layout>

        {/* ── Full-Page Bundle Customization Modal ────────────────────────────── */}
        <Modal id="dcp-full-page-modal" variant="max">
          <div className={designControlPanelStyles.modalContainer}>
            <NavigationSidebar
              bundleType={BundleType.FULL_PAGE}
              expandedSection={fullPageState.expandedSection}
              activeSubSection={fullPageState.activeSubSection}
              onToggleSection={fullPageState.toggleSection}
              onSubSectionClick={fullPageState.handleSubSectionClick}
            />
            <div className={designControlPanelStyles.contentArea}>
              <div className={designControlPanelStyles.previewPanel}>
                <div className={designControlPanelStyles.previewWrapper}>
                  <PreviewPanel
                    settings={fullPageState.settings}
                    bundleType={BundleType.FULL_PAGE}
                    previewUrl={previewUrls.fpb}
                    activeSubSection={fullPageState.activeSubSection}
                  />
                </div>
              </div>
              <div className={designControlPanelStyles.settingsPanel}>
                <SettingsPanel
                  activeSubSection={fullPageState.activeSubSection}
                  settings={fullPageState.settings}
                  onUpdate={fullPageState.updateSetting}
                  onBatchUpdate={fullPageState.updateSettings}
                  customCssHelpOpen={fullPageState.customCssHelpOpen}
                  setCustomCssHelpOpen={fullPageState.setCustomCssHelpOpen}
                  defaultSettings={DEFAULT_SETTINGS.full_page}
                />
              </div>
            </div>
          </div>
        </Modal>

        {/* ── Product Bundle Customization Modal ──────────────────────────────── */}
        <Modal id="dcp-product-page-modal" variant="max">
          <div className={designControlPanelStyles.modalContainer}>
            <NavigationSidebar
              bundleType={BundleType.PRODUCT_PAGE}
              expandedSection={productPageState.expandedSection}
              activeSubSection={productPageState.activeSubSection}
              onToggleSection={productPageState.toggleSection}
              onSubSectionClick={productPageState.handleSubSectionClick}
            />
            <div className={designControlPanelStyles.contentArea}>
              <div className={designControlPanelStyles.previewPanel}>
                <div className={designControlPanelStyles.previewWrapper}>
                  <PreviewPanel
                    settings={productPageState.settings}
                    bundleType={BundleType.PRODUCT_PAGE}
                    previewUrl={previewUrls.pdp}
                    activeSubSection={productPageState.activeSubSection}
                  />
                </div>
              </div>
              <div className={designControlPanelStyles.settingsPanel}>
                <SettingsPanel
                  activeSubSection={productPageState.activeSubSection}
                  settings={productPageState.settings}
                  onUpdate={productPageState.updateSetting}
                  onBatchUpdate={productPageState.updateSettings}
                  customCssHelpOpen={productPageState.customCssHelpOpen}
                  setCustomCssHelpOpen={productPageState.setCustomCssHelpOpen}
                  defaultSettings={DEFAULT_SETTINGS.product_page}
                />
              </div>
            </div>
          </div>
        </Modal>

        {/* ── CSS Guide Modal ─────────────────────────────────────────────────── */}
        <Modal id="css-guide-modal" variant="max">
          <div style={{ padding: "20px" }}>
            <CssGuideContent />
          </div>
        </Modal>

        {/* ── Save Bars ───────────────────────────────────────────────────────── */}
        <SaveBar id="dcp-full-page-save-bar">
          <button variant="primary" onClick={handleSaveFullPage} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save'}
          </button>
          <button onClick={fullPageState.handleDiscard} disabled={isLoading}>
            Discard
          </button>
        </SaveBar>

        <SaveBar id="dcp-product-page-save-bar">
          <button variant="primary" onClick={handleSaveProductPage} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save'}
          </button>
          <button onClick={productPageState.handleDiscard} disabled={isLoading}>
            Discard
          </button>
        </SaveBar>
      </Page>

      {/* ── Toast ────────────────────────────────────────────────────────────── */}
      {activeToastState.toastActive && (
        <Toast
          content={activeToastState.toastMessage}
          onDismiss={() => activeToastState.setToastActive(false)}
          error={activeToastState.toastError}
        />
      )}
    </Frame>
  );
}
