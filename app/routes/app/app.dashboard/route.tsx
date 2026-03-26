import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useFetcher, useNavigate, useLoaderData, Form, useNavigation, useActionData, Link } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  InlineStack,
  ButtonGroup,
  Badge,
  DataTable,
  Modal,
  FormLayout,
  TextField,
  Icon,
  ChoiceList,
  Tooltip,
} from "@shopify/polaris";
import { PlusIcon, EditIcon, DuplicateIcon, DeleteIcon, AlertCircleIcon, AlertTriangleIcon, CheckCircleIcon, ViewIcon, ExternalIcon } from "@shopify/polaris-icons";
import { authenticate } from "../../../shopify.server";
import db from "../../../db.server";
import { AppLogger } from "../../../lib/logger";
import { BillingService } from "../../../services/billing.server";
import { useCallback, useRef, useEffect, useMemo, memo, useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { BundleSetupInstructions } from "../../../components/BundleSetupInstructions";
import { CartPropertyFixContent } from "../../../components/CartPropertyFixCard";
import { UpgradePromptBanner } from "../../../components/UpgradePromptBanner";
import { ProxyHealthBanner } from "../../../components/ProxyHealthBanner";
import { useDashboardState } from "../../../hooks/useDashboardState";
import { BundleStatus, BundleType } from "../../../constants/bundle";

// Action handlers - extracted to separate module for better organization
import {
  handleCloneBundle,
  handleDeleteBundle,
  handleCreateBundle,
} from "./handlers";

// Types - extracted to separate module for better organization
import type { BundleActionsButtonsProps } from "./types";

import dashboardStyles from "./dashboard.module.css";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);

  // Get active and draft bundles for the shop (exclude archived/deleted)
  // Only select fields needed for dashboard display to avoid over-fetching
  const bundles = await db.bundle.findMany({
    where: {
      shopId: session.shop,
      status: {
        in: [BundleStatus.ACTIVE, BundleStatus.DRAFT, BundleStatus.UNLISTED]
      }
    },
    select: {
      id: true,
      name: true,
      status: true,
      bundleType: true,
      createdAt: true,
      shopifyProductId: true, // For product page preview URL
      shopifyProductHandle: true, // For product page preview URL (stored in DB)
      shopifyPageHandle: true, // For full page preview URL
      pricing: {
        select: {
          enabled: true
        }
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Backfill: fetch + persist product handles for legacy bundles missing shopifyProductHandle
  const bundlesNeedingBackfill = bundles.filter(
    b => b.bundleType === BundleType.PRODUCT_PAGE && b.shopifyProductId && !b.shopifyProductHandle
  );

  if (bundlesNeedingBackfill.length > 0) {
    try {
      const productIds = bundlesNeedingBackfill.map(b => b.shopifyProductId).filter(Boolean);
      const GET_PRODUCTS = `
        query GetProductHandles($ids: [ID!]!) {
          nodes(ids: $ids) {
            ... on Product {
              id
              handle
            }
          }
        }
      `;

      const response = await admin.graphql(GET_PRODUCTS, {
        variables: { ids: productIds }
      });
      const data = await response.json();

      if (data.data?.nodes) {
        for (const node of data.data.nodes) {
          if (node?.id && node?.handle) {
            // Persist handle to DB so future loads skip GraphQL
            const bundleToUpdate = bundlesNeedingBackfill.find(b => b.shopifyProductId === node.id);
            if (bundleToUpdate) {
              bundleToUpdate.shopifyProductHandle = node.handle;
              await db.bundle.update({
                where: { id: bundleToUpdate.id },
                data: { shopifyProductHandle: node.handle }
              });
            }
          }
        }
      }
    } catch (error) {
      AppLogger.error("Failed to backfill product handles", {
        component: "app.dashboard",
        operation: "backfill-product-handles"
      }, error);
    }
  }

  // Enhance bundles with preview URLs — now purely from DB fields
  const bundlesWithPreview = bundles.map(bundle => ({
    ...bundle,
    previewHandle: bundle.bundleType === BundleType.PRODUCT_PAGE
      ? bundle.shopifyProductHandle
      : bundle.shopifyPageHandle
  }));

  // Get subscription info for upgrade prompt.
  // Wrapped in try-catch: on fresh install afterAuth may not yet have created the shop
  // record, so the DB query can fail. The upgrade banner is hidden gracefully on error.
  let subscriptionInfo = null;
  try {
    subscriptionInfo = await BillingService.getSubscriptionInfo(session.shop);
  } catch (error) {
    AppLogger.error("Failed to fetch subscription info", {
      component: "app.dashboard",
      operation: "get-subscription-info",
    }, error);
  }

  // Ensure UTM web pixel is activated for this shop (fire-and-forget, non-blocking).
  // Handles shops installed before the pixel extension was deployed.
  // Settings must be a plain object in variables — NOT JSON.stringify (causes validation failure).
  const appUrl = process.env.SHOPIFY_APP_URL;
  if (appUrl) {
    void (async () => {
      try {
        const existingPixelRes = await admin.graphql(`query { webPixel { id settings } }`);
        const existingPixelData = await existingPixelRes.json();
        const existingId = existingPixelData.data?.webPixel?.id;
        const existingSettings = existingPixelData.data?.webPixel?.settings as Record<string, string> | null;

        if (existingId && existingSettings?.app_server_url === appUrl) {
          // Pixel exists with correct URL — nothing to do.
          // Do NOT just update a pixel that already has correct settings: webPixelUpdate
          // cannot recover a "Disconnected" pixel. If the pixel ever becomes disconnected
          // the settings-match check will fail (settings become null/empty) and we fall
          // through to the delete-then-create path below.
        } else {
          // Pixel missing OR settings are stale/empty (includes the Disconnected case where
          // Shopify clears settings). Delete the old record first so we can create a fresh
          // one — webPixelCreate is the only operation that re-establishes the
          // extension↔store link after a pixel becomes Disconnected.
          if (existingId) {
            await admin.graphql(
              `mutation webPixelDelete($id: ID!) {
                 webPixelDelete(id: $id) { deletedWebPixelId userErrors { field message } }
               }`,
              { variables: { id: existingId } },
            );
          }

          const createRes = await admin.graphql(
            `mutation webPixelCreate($webPixel: WebPixelInput!) {
               webPixelCreate(webPixel: $webPixel) {
                 userErrors { field message code }
                 webPixel { id settings }
               }
             }`,
            { variables: { webPixel: { settings: { app_server_url: appUrl } } } },
          );
          const createData = await createRes.json();
          const errs = createData.data?.webPixelCreate?.userErrors || [];
          if (errs.length > 0) {
            AppLogger.warn("UTM pixel create/reconnect had errors on dashboard load", {
              component: "app.dashboard",
              operation: "ensure-web-pixel",
            }, errs);
          } else {
            AppLogger.info("UTM pixel created/reconnected on dashboard load", {
              component: "app.dashboard",
              operation: "ensure-web-pixel",
            }, { pixelId: createData.data?.webPixelCreate?.webPixel?.id });
          }
        }
      } catch (_err) {
        // Non-critical — scope may not yet be granted
      }
    })();
  }

  // Check whether the Shopify app proxy is reachable for this store.
  // Proxy is required for full-page bundle widgets and DCP design settings CSS.
  // We fetch the proxy health endpoint through the storefront so Shopify's routing
  // either forwards it to us (proxy healthy) or returns 404 (proxy not registered).
  // Timeout: 3 s. On timeout or non-404 error we default to healthy to avoid
  // false-positive banners.
  let proxyHealthy = true;
  try {
    const controller = new AbortController();
    const proxyTimer = setTimeout(() => controller.abort(), 3000);
    const proxyRes = await fetch(
      `https://${session.shop}/apps/product-bundles/api/proxy-health`,
      { signal: controller.signal }
    );
    clearTimeout(proxyTimer);
    // Only flag as broken on a definitive 404 from Shopify (empty body, text/html).
    // Any other status (200, 4xx from our server, 5xx) we treat as "proxy is working."
    if (proxyRes.status === 404) {
      const ct = proxyRes.headers.get('content-type') ?? '';
      // Shopify's own 404 returns text/html with empty body.
      // Our server's 404 would return application/json — that means proxy IS working.
      if (ct.includes('text/html')) {
        proxyHealthy = false;
        AppLogger.warn('App proxy health check failed — proxy not registered for shop', {
          component: 'app.dashboard',
          operation: 'proxy-health-check',
          shop: session.shop,
        });
      }
    }
  } catch {
    // Timeout or network error — default to healthy (avoid false positives)
  }

  return json({
    bundles: bundlesWithPreview,
    shop: session.shop,
    appUrl,
    proxyHealthy,
    subscription: subscriptionInfo ? {
      plan: subscriptionInfo.plan,
      currentBundleCount: subscriptionInfo.currentBundleCount,
      bundleLimit: subscriptionInfo.bundleLimit,
      canCreateBundle: subscriptionInfo.canCreateBundle,
    } : null,
  });
};

// Action handlers have been extracted to ./app.dashboard/handlers/
export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  // Clone bundle
  if (intent === "cloneBundle") {
    return handleCloneBundle(admin, session, formData);
  }

  // Delete bundle
  if (intent === "deleteBundle") {
    return handleDeleteBundle(admin, session, formData);
  }

  // Create new bundle (default action)
  return handleCreateBundle(admin, session, formData);
};

// Reusable status badge instances to prevent recreation on every render
const STATUS_BADGES = {
  active: <Badge tone="success">active</Badge>,
  draft: <Badge tone="info">draft</Badge>,
  unlisted: <Badge tone="warning">unlisted</Badge>,
} as const;

// Bundle type badge component
const BUNDLE_TYPE_BADGES = {
  product_page: <Badge tone="info">Product Page</Badge>,
  full_page: <Badge tone="attention">Full Page</Badge>,
} as const;

// Memoized component for bundle action buttons - Professional icon groups with tooltips
const BundleActionsButtons = memo(({ bundleId, bundleType, onEdit, onClone, onDelete, onPreview, bundle }: BundleActionsButtonsProps) => (
  <InlineStack gap="300" blockAlign="center">
    {/* Group 1: Edit & Clone (neutral actions) */}
    <ButtonGroup variant="segmented">
      <Tooltip content="Edit bundle">
        <Button
          size="micro"
          icon={EditIcon}
          onClick={() => onEdit(bundle)}
          accessibilityLabel="Edit bundle"
        />
      </Tooltip>
      <Tooltip content="Clone bundle">
        <Button
          size="micro"
          icon={DuplicateIcon}
          onClick={() => onClone(bundleId)}
          accessibilityLabel="Clone bundle"
        />
      </Tooltip>
    </ButtonGroup>

    {/* Group 2: Preview (view action) */}
    <Tooltip content={bundle.previewHandle ? "Preview in store" : "Save bundle to preview"}>
      {/* span captures pointer-events so tooltip fires even when button is disabled */}
      <span style={{ display: "inline-flex" }}>
        <Button
          size="micro"
          icon={ExternalIcon}
          onClick={() => onPreview(bundle)}
          accessibilityLabel="Preview bundle"
          disabled={!bundle.previewHandle}
        />
      </span>
    </Tooltip>

    {/* Group 3: Delete (destructive action - separate to prevent accidents) */}
    <Tooltip content="Delete bundle">
      <Button
        size="micro"
        icon={DeleteIcon}
        onClick={() => onDelete(bundleId)}
        accessibilityLabel="Delete bundle"
        tone="critical"
      />
    </Tooltip>
  </InlineStack>
));

BundleActionsButtons.displayName = 'BundleActionsButtons';

export default function Dashboard() {
  const { bundles, subscription, shop, proxyHealthy, appUrl } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const shopify = useAppBridge();

  // Use centralized dashboard state hook
  const dashboardState = useDashboardState();
  const {
    createModalOpen: modalOpen,
    openCreateModal,
    closeCreateModal,
    bundleName,
    setBundleName,
    description,
    setDescription,
    bundleType,
    setBundleType,
    deleteModalOpen,
    bundleToDelete,
    openDeleteModal,
    closeDeleteModal,
  } = dashboardState;

  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const fetcherIntentRef = useRef<string | null>(null);
  const cloningBundleTypeRef = useRef<string | null>(null);

  const isSubmitting = navigation.state === "submitting";

  // Handle successful bundle creation
  useEffect(() => {
    if (actionData && 'success' in actionData && actionData.success && 'redirectTo' in actionData && actionData.redirectTo) {
      closeCreateModal();
      navigate(actionData.redirectTo);
    }
  }, [actionData, navigate, closeCreateModal]);

  // Handle clone/delete responses (submitted via fetcher, not Form)
  useEffect(() => {
    if (fetcher.state !== 'idle' || !fetcher.data) return;
    const intent = fetcherIntentRef.current;
    if (!intent) return;

    const data = fetcher.data as Record<string, unknown>;
    if (data.success) {
      if (intent === 'cloneBundle' && data.bundleId) {
        shopify.toast.show('Bundle cloned successfully');
        const routeBase = cloningBundleTypeRef.current === BundleType.FULL_PAGE
          ? 'full-page-bundle'
          : 'product-page-bundle';
        navigate(`/app/bundles/${routeBase}/configure/${data.bundleId}`);
      } else if (intent === 'deleteBundle') {
        shopify.toast.show('Bundle deleted');
      }
    } else if (data.error) {
      shopify.toast.show(String(data.error), { isError: true, duration: 5000 });
    }

    fetcherIntentRef.current = null;
    cloningBundleTypeRef.current = null;
  }, [fetcher.state, fetcher.data, navigate, shopify]);

  const handleCreateBundle = useCallback(() => {
    openCreateModal();
  }, [openCreateModal]);

  const handleCloseModal = useCallback(() => {
    closeCreateModal();
  }, [closeCreateModal]);

  const handleSubmit = useCallback(() => {
    if (submitButtonRef.current) {
      submitButtonRef.current.click();
    }
  }, []);

  const handleDirectChat = () => {
    if (typeof window !== 'undefined' && (window as any).$crisp) {
      (window as any).$crisp.push(["do", "chat:open"]);
    }
  };

  const handleEditBundle = useCallback((bundle: typeof bundles[number]) => {
    const routeBase = bundle.bundleType === BundleType.FULL_PAGE ? 'full-page-bundle' : 'product-page-bundle';
    navigate(`/app/bundles/${routeBase}/configure/${bundle.id}`);
  }, [navigate]);

  const handleCloneBundle = useCallback((bundleId: string) => {
    if (confirm("Are you sure you want to clone this bundle?")) {
      const sourceBundle = bundles.find(b => b.id === bundleId);
      fetcherIntentRef.current = 'cloneBundle';
      cloningBundleTypeRef.current = sourceBundle?.bundleType ?? null;
      const formData = new FormData();
      formData.append("intent", "cloneBundle");
      formData.append("bundleId", bundleId);
      fetcher.submit(formData, { method: "post" });
    }
  }, [fetcher, bundles]);

  const handleDeleteBundle = useCallback((bundleId: string) => {
    openDeleteModal(bundleId);
  }, [openDeleteModal]);

  const handleConfirmDelete = useCallback(() => {
    if (bundleToDelete) {
      fetcherIntentRef.current = 'deleteBundle';
      const formData = new FormData();
      formData.append("intent", "deleteBundle");
      formData.append("bundleId", bundleToDelete);
      fetcher.submit(formData, { method: "post" });
      closeDeleteModal();
    }
  }, [bundleToDelete, fetcher, closeDeleteModal]);

  const handleCancelDelete = useCallback(() => {
    closeDeleteModal();
  }, [closeDeleteModal]);

  const handlePreviewBundle = useCallback((bundle: typeof bundles[number]) => {
    if (!bundle.previewHandle) {
      return;
    }

    // Build preview URL based on bundle type using shop domain
    const previewBase = `https://${shop}`;

    if (bundle.bundleType === BundleType.PRODUCT_PAGE) {
      // Product page bundles use /products/{handle}
      window.open(`${previewBase}/products/${bundle.previewHandle}`, '_blank');
    } else {
      // Full page bundles use /pages/{handle}
      window.open(`${previewBase}/pages/${bundle.previewHandle}`, '_blank');
    }
  }, [shop]);

  // Use reusable status badges to avoid recreation on every render
  const getStatusDisplay = (status: string) => {
    return STATUS_BADGES[status as keyof typeof STATUS_BADGES] || <Badge tone="info">{status}</Badge>;
  };

  // Get bundle type badge display
  const getBundleTypeDisplay = (bundleType: string) => {
    return BUNDLE_TYPE_BADGES[bundleType as keyof typeof BUNDLE_TYPE_BADGES] || <Badge>{bundleType}</Badge>;
  };

  const [bundleFilter, setBundleFilter] = useState("");

  // Memoize bundleRows to prevent unnecessary re-renders
  const bundleRows = useMemo(() => bundles
    .filter((b) => b.name.toLowerCase().includes(bundleFilter.toLowerCase()))
    .map((bundle) => [
    bundle.name,
    getStatusDisplay(bundle.status),
    getBundleTypeDisplay(bundle.bundleType),
    <BundleActionsButtons
      key={bundle.id}
      bundleId={bundle.id}
      bundleType={bundle.bundleType}
      bundle={bundle}
      onEdit={handleEditBundle}
      onClone={handleCloneBundle}
      onDelete={handleDeleteBundle}
      onPreview={handlePreviewBundle}
    />,
  ]), [bundles, handleEditBundle, handleCloneBundle, handlePreviewBundle, handleDeleteBundle]);

  return (
    <>
      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        title="Create New Bundle"
        primaryAction={{
          content: "Create Bundle",
          onAction: handleSubmit,
          loading: isSubmitting,
          disabled: !bundleName.trim(),
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: handleCloseModal,
          },
        ]}
      >
        <Modal.Section>
          <Form method="post">
            <FormLayout>
              <TextField
                label="Bundle name"
                value={bundleName}
                onChange={setBundleName}
                name="bundleName"
                autoComplete="off"
                error={actionData && 'error' in actionData ? actionData.error : undefined}
                helpText="Choose a descriptive name for your bundle"
                requiredIndicator
              />
              <TextField
                label="Description"
                value={description}
                onChange={setDescription}
                name="description"
                multiline={3}
                autoComplete="off"
                helpText="Optional: Add more details about what this bundle offers"
              />

              {/* Bundle Type Selection */}
              <BlockStack gap="200">
                <Text variant="headingSm" as="h4">Bundle Type</Text>
                <Text variant="bodySm" as="p" tone="subdued">
                  Click on the thumbnails to watch demo videos
                </Text>
                <div className={dashboardStyles.bundleTypeGrid}>
                  {/* Product Page Bundle */}
                  <div
                    className={`${dashboardStyles.bundleTypeCard} ${bundleType[0] === BundleType.PRODUCT_PAGE ? dashboardStyles.bundleTypeCardSelected : ''}`}
                    onClick={() => setBundleType([BundleType.PRODUCT_PAGE])}
                  >
                    <BlockStack gap="200">
                      <a
                        href="https://www.loom.com/share/6eda102958f3453f9379ac4c70fcda29"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className={dashboardStyles.bundleThumbnailLink}
                      >
                        <img
                          src="/pdp.jpeg"
                          alt="Product Page Bundle Demo"
                          className={dashboardStyles.bundleThumbnailImg}
                        />
                        <div className={dashboardStyles.bundlePlayButton}>
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="white">
                            <path d="M5 3l12 7-12 7V3z" />
                          </svg>
                        </div>
                      </a>
                      <BlockStack gap="100">
                        <Text variant="bodyMd" as="p" fontWeight="semibold">
                          Product Page Bundle
                        </Text>
                        <Text variant="bodySm" as="p" tone="subdued">
                          Display bundle builder on existing product pages (recommended for most stores)
                        </Text>
                      </BlockStack>
                    </BlockStack>
                  </div>

                  {/* Full Page Bundle */}
                  <div
                    className={`${dashboardStyles.bundleTypeCard} ${bundleType[0] === BundleType.FULL_PAGE ? dashboardStyles.bundleTypeCardSelected : ''}`}
                    onClick={() => setBundleType([BundleType.FULL_PAGE])}
                  >
                    <BlockStack gap="200">
                      <a
                        href="https://www.loom.com/share/dc6b075589df45eead93edaa7acfb08c"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className={dashboardStyles.bundleThumbnailLink}
                      >
                        <img
                          src="/full.jpeg"
                          alt="Full Page Bundle Demo"
                          className={dashboardStyles.bundleThumbnailImg}
                        />
                        <div className={dashboardStyles.bundlePlayButton}>
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="white">
                            <path d="M5 3l12 7-12 7V3z" />
                          </svg>
                        </div>
                      </a>
                      <BlockStack gap="100">
                        <Text variant="bodyMd" as="p" fontWeight="semibold">
                          Full Page Bundle
                        </Text>
                        <Text variant="bodySm" as="p" tone="subdued">
                          Create a dedicated landing page for your bundle with tabs and full customization
                        </Text>
                      </BlockStack>
                    </BlockStack>
                  </div>
                </div>
              </BlockStack>

              {/* Hidden input to pass bundleType to form */}
              <input type="hidden" name="bundleType" value={bundleType[0]} />

              <button
                ref={submitButtonRef}
                type="submit"
                className={dashboardStyles.hiddenSubmit}
                aria-hidden="true"
              />
            </FormLayout>
          </Form>
        </Modal.Section>
      </Modal>

      {/* Delete Confirmation Modal - Compact centered dialog */}
      <Modal
        open={deleteModalOpen}
        onClose={handleCancelDelete}
        title=""
        titleHidden
        size="small"
      >
        <Modal.Section>
          <BlockStack gap="300">
            <InlineStack gap="200" blockAlign="center">
              <div className={dashboardStyles.deleteModalIconWrapper}>
                <Icon source={AlertTriangleIcon} tone="critical" />
              </div>
              <Text variant="headingMd" as="h2">Delete Bundle?</Text>
            </InlineStack>

            <Text variant="bodyMd" as="p" tone="subdued">
              This action cannot be undone. All bundle configuration, steps, and discount rules will be permanently deleted.
            </Text>

            <InlineStack gap="200" align="end">
              <Button onClick={handleCancelDelete}>
                Cancel
              </Button>
              <Button
                tone="critical"
                onClick={handleConfirmDelete}
                loading={fetcher.state === 'submitting'}
              >
                Delete
              </Button>
            </InlineStack>
          </BlockStack>
        </Modal.Section>
      </Modal>

      <Page
        title="Dashboard: Wolfpack Bundle Builder"
        subtitle="Access your bundles, customer support & more."
      >
        <Layout>
          {/* Proxy Health Banner — shown when app proxy is not registered for this store */}
          {!proxyHealthy && (
            <Layout.Section>
              <ProxyHealthBanner shop={shop} appUrl={appUrl} />
            </Layout.Section>
          )}

          {/* Upgrade Prompt Banner for Free Users */}
          {subscription && (
            <Layout.Section>
              <UpgradePromptBanner
                plan={subscription.plan}
                currentBundleCount={subscription.currentBundleCount}
                bundleLimit={subscription.bundleLimit}
                canCreateBundle={subscription.canCreateBundle}
              />
            </Layout.Section>
          )}

          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <InlineStack gap="200" align="space-between">
                  <Text variant="headingSm" as="h3">
                    Your Bundles
                  </Text>
                  <InlineStack gap="200">
                    <Button
                      variant="primary"
                      icon={PlusIcon}
                      onClick={handleCreateBundle}
                    >
                      Create Bundle
                    </Button>
                  </InlineStack>
                </InlineStack>

                {bundles.length === 0 ? (
                  <Card>
                    <BlockStack gap="400" align="center" inlineAlign="center">
                      <BlockStack gap="200" align="center" inlineAlign="center">
                        <Text variant="headingLg" as="h2" alignment="center">
                          Create your first bundle
                        </Text>
                        <Text as="p" variant="bodyMd" tone="subdued" alignment="center">
                          Our bundles provide real-time cart updates and merge
                          bundle items into a single cart line with automatic price adjustments.
                        </Text>
                      </BlockStack>
                      <Button variant="primary" size="large" onClick={handleCreateBundle}>
                        Create Bundle
                      </Button>
                    </BlockStack>
                  </Card>
                ) : (
                  <BlockStack gap="300">
                    <TextField
                      label="Filter bundles"
                      labelHidden
                      placeholder="Filter by name…"
                      value={bundleFilter}
                      onChange={setBundleFilter}
                      clearButton
                      onClearButtonClick={() => setBundleFilter("")}
                      autoComplete="off"
                    />
                    <div className={dashboardStyles.dataTableWrapper}>
                      <DataTable
                        columnContentTypes={["text", "text", "text", "text"]}
                        headings={["Bundle Name", "Status", "Type", "Actions"]}
                        rows={bundleRows}
                      />
                      {bundleRows.length === 0 && bundleFilter && (
                        <div style={{ padding: "24px", textAlign: "center", color: "#6d7175", fontSize: 13 }}>
                          {`No bundles match "${bundleFilter}"`}
                        </div>
                      )}
                    </div>
                  </BlockStack>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>

          {/* Bottom section with setup instructions and account manager */}
          <Layout.Section>
            <div className={dashboardStyles.bottomSection}>
              {/* Setup guide (new merchants) → Cart property fix tip (returning merchants) */}
              <div className={`${dashboardStyles.bottomSectionCol} ${dashboardStyles.fadeIn}`}>
                {bundles.length === 0 ? (
                  <BundleSetupInstructions
                    title="Bundle Setup Steps"
                    subtitle="Follow these steps to create your bundle"
                    bundlesExist={false}
                    steps={[
                      {
                        id: "create_bundle",
                        title: 'Click "Create Bundle"',
                        description: "Click the \"Create\" button to start making your bundle.",
                        isClickable: true,
                        onClick: handleCreateBundle,
                      },
                      {
                        id: "name_description",
                        title: "Enter bundle name and description",
                        description: "Type a clear name and an optional description for your bundle.",
                        onClick: () => {},
                      },
                      {
                        id: "create_bundle_modal",
                        title: 'Click "Bundle Settings"',
                        description: "This will take you to your bundle set up page.",
                        onClick: () => {},
                      },
                      {
                        id: "add_steps",
                        title: "Add bundle steps and choose products",
                        description: "Add steps to your bundle, select products/collections you want.",
                        isClickable: false,
                        onClick: () => {},
                      },
                      {
                        id: "setup_pricing",
                        title: "Set discount rules and pricing",
                        description: "Choose how discounts and pricing should work for your bundle.",
                        isClickable: false,
                        onClick: () => {},
                      },
                      {
                        id: "publish",
                        title: "Save and publish your bundle",
                        description: "Save your settings to make your bundle live on your store.",
                        isClickable: false,
                        onClick: () => {},
                      },
                    ]}
                  />
                ) : (
                  <Card>
                    <BlockStack gap="200">
                      <Text variant="headingSm" as="h3">Cart Property Display Fix</Text>
                      <Text variant="bodySm" tone="subdued" as="p">
                        Some themes show internal bundle properties on the cart page. Here&apos;s a one-line Liquid fix.
                      </Text>
                    </BlockStack>
                    <div style={{ marginTop: 16 }}>
                      <CartPropertyFixContent />
                    </div>
                  </Card>
                )}
              </div>

              {/* Your Account Manager Card */}
              <div className={dashboardStyles.bottomSectionCol}>
                <Card>
                  <div className={dashboardStyles.accountManagerCard}>
                    {/* Header with gradient background */}
                    <div className={dashboardStyles.accountManagerHeader}>
                      <Text variant="headingSm" as="h4" tone="text-inverse">
                        Need Help? Speak to Parth!
                      </Text>
                    </div>

                    {/* Content area */}
                    <div className={dashboardStyles.accountManagerContent}>
                      <InlineStack gap="400" align="start" blockAlign="start">
                        <div className={dashboardStyles.accountManagerAvatarWrapper}>
                          <div className={dashboardStyles.accountManagerAvatar}>
                            <img
                              src="/Parth.jpeg"
                              alt="Parth (Founder)"
                              className={dashboardStyles.accountManagerAvatarImg}
                            />
                          </div>
                          {/* Online status indicator */}
                          <div className={dashboardStyles.accountManagerStatusIndicator} />
                        </div>

                        <BlockStack gap="200" align="start">
                          <BlockStack gap="100">
                            <Text as="h4" variant="bodyLg" fontWeight="semibold">
                              Parth
                            </Text>
                            <Text as="span" variant="bodySm" tone="subdued">
                              Founder
                            </Text>
                          </BlockStack>

                          {/* Services offered with icons */}
                          <BlockStack gap="150">
                            <InlineStack gap="200" align="start">
                              <div className={dashboardStyles.accountManagerServiceBullet} />
                              <Text as="span" variant="bodySm">
                                Bundle setup & publishing
                              </Text>
                            </InlineStack>
                            <InlineStack gap="200" align="start">
                              <div className={dashboardStyles.accountManagerServiceBullet} />
                              <Text as="span" variant="bodySm">
                                Custom design & styling
                              </Text>
                            </InlineStack>
                            <InlineStack gap="200" align="start">
                              <div className={dashboardStyles.accountManagerServiceBullet} />
                              <Text as="span" variant="bodySm">
                                Technical support
                              </Text>
                            </InlineStack>
                          </BlockStack>
                        </BlockStack>
                      </InlineStack>
                    </div>

                    {/* CTA Section */}
                    <div className={dashboardStyles.accountManagerCtaSection}>
                      <InlineStack gap="300" align="center">
                        <div className={dashboardStyles.accountManagerCtaText}>
                          <Text as="span" variant="bodySm" tone="subdued">
                            Available Mon-Fri • Responds within 1hr
                          </Text>
                        </div>
                      </InlineStack>
                      <div className={dashboardStyles.accountManagerCtaButton}>
                        <Button variant="primary" fullWidth onClick={handleDirectChat}>
                          Chat with Parth
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </Layout.Section>

          {/* Demo Section */}
          <Layout.Section>
            <Card>
              <BlockStack gap="300">
                <Text variant="headingSm" as="h4">
                  Bundles appear as separate products but your inventory syncs automatically. No need to worry about inventory tracking!
                </Text>
                <Link to="/app/pricing" className={dashboardStyles.demoPricingLink}>
                  <img
                    src="/demo.jpeg"
                    alt="Bundle Demo"
                    className={dashboardStyles.demoPricingImg}
                  />
                </Link>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    </>
  );
}
