import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useFetcher, useNavigate, useLoaderData, Form, useNavigation, useActionData, Link, useSearchParams } from "@remix-run/react";
import { requireAdminSession } from "../../../lib/auth-guards.server";
import db from "../../../db.server";
import { AppLogger } from "../../../lib/logger";
import { BillingService } from "../../../services/billing.server";
import { useCallback, useRef, useEffect, useMemo, memo, useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { checkAppEmbedEnabled } from "../../../services/theme/app-embed-check.server";
import { UpgradePromptBanner } from "../../../components/UpgradePromptBanner";
import { ProxyHealthBanner } from "../../../components/ProxyHealthBanner";
import { useDashboardState } from "../../../hooks/useDashboardState";
import { BundleStatus, BundleType } from "../../../constants/bundle";

import {
  handleCloneBundle,
  handleDeleteBundle,
  handleCreateBundle,
} from "./handlers";

import type { BundleActionsButtonsProps } from "./types";

import dashboardStyles from "./dashboard.module.css";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, admin } = await requireAdminSession(request);

  const bundles = await db.bundle.findMany({
    where: {
      shopId: session.shop,
      status: { in: [BundleStatus.ACTIVE, BundleStatus.DRAFT, BundleStatus.UNLISTED] }
    },
    select: {
      id: true, name: true, status: true, bundleType: true, createdAt: true,
      shopifyProductId: true, shopifyProductHandle: true, shopifyPageHandle: true,
      pricing: { select: { enabled: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const bundlesNeedingBackfill = bundles.filter(
    b => b.bundleType === BundleType.PRODUCT_PAGE && b.shopifyProductId && !b.shopifyProductHandle
  );

  if (bundlesNeedingBackfill.length > 0) {
    try {
      const productIds = bundlesNeedingBackfill.map(b => b.shopifyProductId).filter(Boolean);
      const GET_PRODUCTS = `query GetProductHandles($ids: [ID!]!) { nodes(ids: $ids) { ... on Product { id handle } } }`;
      const response = await admin.graphql(GET_PRODUCTS, { variables: { ids: productIds } });
      const data = await response.json();
      if (data.data?.nodes) {
        for (const node of data.data.nodes) {
          if (node?.id && node?.handle) {
            const bundleToUpdate = bundlesNeedingBackfill.find(b => b.shopifyProductId === node.id);
            if (bundleToUpdate) {
              bundleToUpdate.shopifyProductHandle = node.handle;
              await db.bundle.update({ where: { id: bundleToUpdate.id }, data: { shopifyProductHandle: node.handle } });
            }
          }
        }
      }
    } catch (error) {
      AppLogger.error("Failed to backfill product handles", { component: "app.dashboard", operation: "backfill-product-handles" }, error);
    }
  }

  const bundlesWithPreview = bundles.map(bundle => ({
    ...bundle,
    previewHandle: bundle.bundleType === BundleType.PRODUCT_PAGE ? bundle.shopifyProductHandle : bundle.shopifyPageHandle
  }));

  const embedCheck = await checkAppEmbedEnabled(admin, session.shop);
  const themeEditorUrl = embedCheck.themeId
    ? `https://${session.shop}/admin/themes/${embedCheck.themeId.split("/").pop()}/editor?context=apps&appEmbed=63077bb0483a6ce08a2d6139b14d170b%2Fbundle-full-page-embed`
    : null;

  let subscriptionInfo = null;
  try {
    subscriptionInfo = await BillingService.getSubscriptionInfo(session.shop);
  } catch (error) {
    AppLogger.error("Failed to fetch subscription info", { component: "app.dashboard", operation: "get-subscription-info" }, error);
  }

  const appUrl = process.env.SHOPIFY_APP_URL;
  if (appUrl) {
    void (async () => {
      try {
        const existingPixelRes = await admin.graphql(`query { webPixel { id settings } }`);
        const existingPixelData = await existingPixelRes.json();
        const existingId = existingPixelData.data?.webPixel?.id;
        const existingSettings = existingPixelData.data?.webPixel?.settings as Record<string, string> | null;
        if (existingId && existingSettings?.app_server_url === appUrl) {
          // Pixel correct — nothing to do.
        } else {
          if (existingId) {
            await admin.graphql(`mutation webPixelDelete($id: ID!) { webPixelDelete(id: $id) { deletedWebPixelId userErrors { field message } } }`, { variables: { id: existingId } });
          }
          const createRes = await admin.graphql(
            `mutation webPixelCreate($webPixel: WebPixelInput!) { webPixelCreate(webPixel: $webPixel) { userErrors { field message code } webPixel { id settings } } }`,
            { variables: { webPixel: { settings: { app_server_url: appUrl } } } }
          );
          const createData = await createRes.json();
          const errs = createData.data?.webPixelCreate?.userErrors || [];
          if (errs.length > 0) {
            AppLogger.warn("UTM pixel create/reconnect had errors on dashboard load", { component: "app.dashboard", operation: "ensure-web-pixel" }, errs);
          }
        }
      } catch (_err) { /* Non-critical */ }
    })();
  }

  let proxyHealthy = true;
  try {
    const controller = new AbortController();
    const proxyTimer = setTimeout(() => controller.abort(), 3000);
    const proxyRes = await fetch(`https://${session.shop}/apps/product-bundles/api/proxy-health`, { signal: controller.signal });
    clearTimeout(proxyTimer);
    if (proxyRes.status === 404) {
      const ct = proxyRes.headers.get('content-type') ?? '';
      if (ct.includes('text/html')) {
        proxyHealthy = false;
        AppLogger.warn('App proxy health check failed', { component: 'app.dashboard', operation: 'proxy-health-check', shop: session.shop });
      }
    }
  } catch { /* Timeout — default healthy */ }

  let ownerFirstName = '';
  try {
    const shopRes = await admin.graphql(`query { shop { billingAddress { firstName } } }`);
    const shopData = await shopRes.json();
    ownerFirstName = shopData?.data?.shop?.billingAddress?.firstName ?? '';
  } catch { /* Non-critical */ }

  return json({
    bundles: bundlesWithPreview, shop: session.shop, appUrl, proxyHealthy, ownerFirstName,
    subscription: subscriptionInfo ? {
      plan: subscriptionInfo.plan,
      currentBundleCount: subscriptionInfo.currentBundleCount,
      bundleLimit: subscriptionInfo.bundleLimit,
      canCreateBundle: subscriptionInfo.canCreateBundle,
    } : null,
    themeEditorUrl,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, admin } = await requireAdminSession(request);
  const formData = await request.formData();
  const intent = formData.get("intent");
  if (intent === "cloneBundle") return handleCloneBundle(admin, session, formData);
  if (intent === "deleteBundle") return handleDeleteBundle(admin, session, formData);
  return handleCreateBundle(admin, session, formData);
};

const STATUS_BADGES = {
  active: <s-badge tone="success">active</s-badge>,
  draft: <s-badge tone="info">draft</s-badge>,
  unlisted: <s-badge tone="warning">unlisted</s-badge>,
} as const;

const BUNDLE_TYPE_LABELS: Record<string, string> = {
  product_page: 'Product page',
  full_page: 'Full page',
};

const BundleActionsButtons = memo(({ bundleId, onEdit, onClone, onDelete, onPreview, bundle }: Omit<BundleActionsButtonsProps, 'moreOpen' | 'onMoreToggle'>) => (
  <div className={dashboardStyles.bundleActions}>
    <s-button
      id={`edit-${bundleId}`}
      icon="edit"
      variant="tertiary"
      interestFor={`tooltip-edit-${bundleId}`}
      onClick={() => onEdit(bundle)}
      accessibilityLabel="Edit bundle"
    />
    <s-tooltip id={`tooltip-edit-${bundleId}`}>Edit bundle</s-tooltip>

    <s-button
      id={`preview-${bundleId}`}
      icon="view"
      variant="tertiary"
      interestFor={`tooltip-preview-${bundleId}`}
      onClick={() => onPreview(bundle)}
      disabled={!bundle.previewHandle || undefined}
      accessibilityLabel="Preview bundle"
    />
    <s-tooltip id={`tooltip-preview-${bundleId}`}>
      {bundle.previewHandle ? "Preview in store" : "Save bundle to preview"}
    </s-tooltip>

    <s-button
      id={`more-${bundleId}`}
      icon="menu-horizontal"
      variant="tertiary"
      commandFor={`more-popover-${bundleId}`}
      command="--toggle"
      accessibilityLabel="More actions"
    />
    <s-popover id={`more-popover-${bundleId}`}>
      <s-stack direction="block" gap="none">
        <s-button variant="tertiary" icon="duplicate" onClick={() => onClone(bundleId)}>Clone bundle</s-button>
        <s-button variant="tertiary" tone="critical" icon="delete" onClick={() => onDelete(bundleId)}>Delete bundle</s-button>
      </s-stack>
    </s-popover>
  </div>
));

BundleActionsButtons.displayName = 'BundleActionsButtons';

export default function Dashboard() {
  const { bundles, subscription, shop, proxyHealthy, appUrl, themeEditorUrl } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const fetcher = useFetcher();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const shopify = useAppBridge();

  const dashboardState = useDashboardState();
  const {
    openCreateModal, closeCreateModal,
    bundleName, setBundleName,
    description, setDescription,
    bundleType, setBundleType,
    fullPageLayout, setFullPageLayout,
    bundleToDelete, openDeleteModal, closeDeleteModal,
  } = dashboardState;

  // Refs for imperative web component modal control
  const createModalRef = useRef<any>(null);
  const deleteModalRef = useRef<any>(null);

  // Refs for controlled web component inputs
  const bundleNameRef = useRef<any>(null);
  const descriptionRef = useRef<any>(null);
  const searchRef = useRef<any>(null);
  const langSelectRef = useRef<any>(null);
  const perPageSelectRef = useRef<any>(null);
  const statusSelectRef = useRef<any>(null);
  const typeSelectRef = useRef<any>(null);

  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const fetcherIntentRef = useRef<string | null>(null);
  const cloningBundleTypeRef = useRef<string | null>(null);

  const isSubmitting = navigation.state === "submitting";

  // Bundle name input — keep React state in sync for disabled button condition
  useEffect(() => {
    const el = bundleNameRef.current;
    if (!el) return;
    const handler = (e: Event) => setBundleName((e.target as HTMLInputElement).value ?? '');
    el.addEventListener('input', handler);
    return () => el.removeEventListener('input', handler);
  }, [setBundleName]);

  // Description input
  useEffect(() => {
    const el = descriptionRef.current;
    if (!el) return;
    const handler = (e: Event) => setDescription((e.target as HTMLInputElement).value ?? '');
    el.addEventListener('input', handler);
    return () => el.removeEventListener('input', handler);
  }, [setDescription]);

  // Handle successful bundle creation
  useEffect(() => {
    if (actionData && 'success' in actionData && actionData.success && 'redirectTo' in actionData && actionData.redirectTo) {
      closeCreateModal();
      createModalRef.current?.hideOverlay?.();
      navigate(actionData.redirectTo);
    }
  }, [actionData, navigate, closeCreateModal]);

  useEffect(() => {
    const image = new Image();
    image.src = "/Parth.jpeg";
    if (image.complete) { setParthImageLoaded(true); return; }
    image.onload = () => setParthImageLoaded(true);
    image.onerror = () => setParthImageLoaded(true);
  }, []);

  // Handle clone/delete responses
  useEffect(() => {
    if (fetcher.state !== 'idle' || !fetcher.data) return;
    const intent = fetcherIntentRef.current;
    if (!intent) return;
    const data = fetcher.data as Record<string, unknown>;
    if (data.success) {
      if (intent === 'cloneBundle' && data.bundleId) {
        shopify.toast.show('Bundle cloned successfully');
        const routeBase = cloningBundleTypeRef.current === BundleType.FULL_PAGE ? 'full-page-bundle' : 'product-page-bundle';
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
    createModalRef.current?.showOverlay?.();
  }, [openCreateModal]);

  const handleCloseModal = useCallback(() => {
    closeCreateModal();
    createModalRef.current?.hideOverlay?.();
  }, [closeCreateModal]);

  const handleSubmit = useCallback(() => {
    submitButtonRef.current?.click();
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
    deleteModalRef.current?.showOverlay?.();
  }, [openDeleteModal]);

  const handleConfirmDelete = useCallback(() => {
    if (bundleToDelete) {
      fetcherIntentRef.current = 'deleteBundle';
      const formData = new FormData();
      formData.append("intent", "deleteBundle");
      formData.append("bundleId", bundleToDelete);
      fetcher.submit(formData, { method: "post" });
      closeDeleteModal();
      deleteModalRef.current?.hideOverlay?.();
    }
  }, [bundleToDelete, fetcher, closeDeleteModal]);

  const handleCancelDelete = useCallback(() => {
    closeDeleteModal();
    deleteModalRef.current?.hideOverlay?.();
  }, [closeDeleteModal]);

  const handlePreviewBundle = useCallback((bundle: typeof bundles[number]) => {
    if (!bundle.previewHandle) return;
    const previewBase = `https://${shop}`;
    if (bundle.bundleType === BundleType.PRODUCT_PAGE) {
      window.open(`${previewBase}/products/${bundle.previewHandle}`, '_blank');
    } else {
      window.open(`${previewBase}/pages/${bundle.previewHandle}`, '_blank');
    }
  }, [shop]);

  const getStatusDisplay = (status: string) => {
    return STATUS_BADGES[status as keyof typeof STATUS_BADGES] || <s-badge tone="info">{status}</s-badge>;
  };

  const getBundleTypeDisplay = (bundleType: string) => {
    return BUNDLE_TYPE_LABELS[bundleType] || bundleType;
  };

  const [bundleFilter, setBundleFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [bundlesPerPage, setBundlesPerPage] = useState(20);
  const [activeResource, setActiveResource] = useState<string>('bundle-inspirations');
  const [parthImageLoaded, setParthImageLoaded] = useState(false);

  const languageOptions = [
    { label: "English", value: "en" },
    { label: "French", value: "fr" },
    { label: "German", value: "de" },
    { label: "Spanish", value: "es" },
    { label: "Japanese", value: "ja" },
    { label: "Portuguese (BR)", value: "pt-BR" },
  ];

  const rawLocale = searchParams.get("locale") ?? "en";
  const selectedLanguage = languageOptions.some(o => o.value === rawLocale) ? rawLocale : "en";

  const handleLanguageChange = useCallback((locale: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set("locale", locale);
      return next;
    });
  }, [setSearchParams]);

  // Language select change event
  useEffect(() => {
    const el = langSelectRef.current;
    if (!el) return;
    const handler = (e: Event) => {
      const val = (e as CustomEvent).detail?.value ?? (e.target as HTMLSelectElement).value ?? '';
      if (val) handleLanguageChange(val);
    };
    el.addEventListener('change', handler);
    return () => el.removeEventListener('change', handler);
  }, [handleLanguageChange]);

  // Bundles per page select
  useEffect(() => {
    const el = perPageSelectRef.current;
    if (!el) return;
    const handler = (e: Event) => {
      const val = (e as CustomEvent).detail?.value ?? (e.target as HTMLSelectElement).value ?? '';
      if (val) { setBundlesPerPage(Number(val)); setCurrentPage(1); }
    };
    el.addEventListener('change', handler);
    return () => el.removeEventListener('change', handler);
  }, []);

  // Status filter select
  useEffect(() => {
    const el = statusSelectRef.current;
    if (!el) return;
    const handler = (e: Event) => {
      const val = (e as CustomEvent).detail?.value ?? (e.target as HTMLSelectElement).value ?? '';
      if (val !== undefined && val !== null) { setStatusFilter(val); setCurrentPage(1); }
    };
    el.addEventListener('change', handler);
    return () => el.removeEventListener('change', handler);
  }, []);

  // Type filter select
  useEffect(() => {
    const el = typeSelectRef.current;
    if (!el) return;
    const handler = (e: Event) => {
      const val = (e as CustomEvent).detail?.value ?? (e.target as HTMLSelectElement).value ?? '';
      if (val !== undefined && val !== null) { setTypeFilter(val); setCurrentPage(1); }
    };
    el.addEventListener('change', handler);
    return () => el.removeEventListener('change', handler);
  }, []);

  // Search field input
  useEffect(() => {
    const el = searchRef.current;
    if (!el) return;
    const handler = (e: Event) => {
      setBundleFilter((e.target as HTMLInputElement).value ?? '');
      setCurrentPage(1);
    };
    el.addEventListener('input', handler);
    return () => el.removeEventListener('input', handler);
  }, []);

  const handleSyncCollections = useCallback(() => {
    shopify.toast.show('Collections synced');
  }, [shopify]);

  const handleBellClick = useCallback(() => {
    navigate('/app/events');
  }, [navigate]);

  const handleAppEmbedCardClick = useCallback(() => {
    if (themeEditorUrl) {
      window.open(themeEditorUrl, "_blank", "noopener,noreferrer");
      return;
    }
    shopify.toast.show("Theme editor link is unavailable for this store.", { isError: true });
  }, [shopify, themeEditorUrl]);

  const filteredBundles = useMemo(() =>
    bundles
      .filter(b => typeFilter === "all" || b.bundleType === typeFilter)
      .filter(b => statusFilter === "all" || b.status === statusFilter)
      .filter(b => !bundleFilter || b.name.toLowerCase().includes(bundleFilter.toLowerCase())),
    [bundles, typeFilter, statusFilter, bundleFilter]
  );

  const totalPages = Math.max(1, Math.ceil(filteredBundles.length / bundlesPerPage));
  const effectivePage = Math.min(currentPage, totalPages);

  const pagedBundles = useMemo(() =>
    filteredBundles.slice((effectivePage - 1) * bundlesPerPage, effectivePage * bundlesPerPage),
    [filteredBundles, effectivePage, bundlesPerPage]
  );

  return (
    <>
      {/* Create Bundle Modal */}
      <s-modal
        ref={createModalRef}
        id="create-bundle-modal"
        heading="Create New Bundle"
        onHide={handleCloseModal}
      >
        <s-button
          slot="primaryAction"
          variant="primary"
          loading={isSubmitting || undefined}
          disabled={!bundleName.trim() || undefined}
          onClick={handleSubmit}
        >
          Create Bundle
        </s-button>
        <s-button slot="secondaryActions" onClick={handleCloseModal}>Cancel</s-button>
        <Form method="post">
          <s-stack direction="block" gap="base">
            <s-text-field
              ref={bundleNameRef}
              label="Bundle name"
              value={bundleName}
              name="bundleName"
              autocomplete="off"
              error={actionData && 'error' in actionData ? String(actionData.error) : undefined}
              details="Choose a descriptive name for your bundle"
              required
            />
            <s-text-area
              ref={descriptionRef}
              label="Description"
              value={description}
              name="description"
              rows={3}
              autocomplete="off"
              details="Optional: Add more details about what this bundle offers"
            />

            <s-stack direction="block" gap="small">
              <s-heading>Bundle Type</s-heading>
              <s-text color="subdued">Click on the thumbnails to watch demo videos</s-text>
              <div className={dashboardStyles.bundleTypeGrid}>
                <div
                  className={`${dashboardStyles.bundleTypeCard} ${bundleType[0] === BundleType.PRODUCT_PAGE ? dashboardStyles.bundleTypeCardSelected : ''}`}
                  onClick={() => setBundleType([BundleType.PRODUCT_PAGE])}
                >
                  <s-stack direction="block" gap="small">
                    <a
                      href="https://www.loom.com/share/6eda102958f3453f9379ac4c70fcda29"
                      target="_blank" rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className={dashboardStyles.bundleThumbnailLink}
                    >
                      <img src="/pdp.jpeg" alt="Product Page Bundle Demo" className={dashboardStyles.bundleThumbnailImg} />
                      <div className={dashboardStyles.bundlePlayButton}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="white"><path d="M5 3l12 7-12 7V3z" /></svg>
                      </div>
                    </a>
                    <s-stack direction="block" gap="small-100">
                      <s-text><strong>Product Page Bundle</strong></s-text>
                      <s-text color="subdued">Display bundle builder on existing product pages (recommended for most stores)</s-text>
                    </s-stack>
                  </s-stack>
                </div>

                <div
                  className={`${dashboardStyles.bundleTypeCard} ${bundleType[0] === BundleType.FULL_PAGE ? dashboardStyles.bundleTypeCardSelected : ''}`}
                  onClick={() => setBundleType([BundleType.FULL_PAGE])}
                >
                  <s-stack direction="block" gap="small">
                    <a
                      href="https://www.loom.com/share/dc6b075589df45eead93edaa7acfb08c"
                      target="_blank" rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className={dashboardStyles.bundleThumbnailLink}
                    >
                      <img src="/full.jpeg" alt="Full Page Bundle Demo" className={dashboardStyles.bundleThumbnailImg} />
                      <div className={dashboardStyles.bundlePlayButton}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="white"><path d="M5 3l12 7-12 7V3z" /></svg>
                      </div>
                    </a>
                    <s-stack direction="block" gap="small-100">
                      <s-text><strong>Full Page Bundle</strong></s-text>
                      <s-text color="subdued">Create a dedicated landing page for your bundle with tabs and full customization</s-text>
                    </s-stack>
                  </s-stack>
                </div>
              </div>
            </s-stack>

            {bundleType[0] === BundleType.FULL_PAGE && (
              <s-stack direction="block" gap="small">
                <s-heading>Page Layout</s-heading>
                <div className={dashboardStyles.layoutGrid}>
                  <div
                    onClick={() => setFullPageLayout("footer_bottom")}
                    style={{
                      border: fullPageLayout === "footer_bottom" ? "2px solid var(--p-color-border-interactive)" : "1px solid var(--p-color-border-secondary)",
                      borderRadius: "8px", padding: "8px", cursor: "pointer",
                      background: fullPageLayout === "footer_bottom" ? "var(--p-color-bg-surface-selected)" : "var(--p-color-bg-surface)",
                      transition: "border 0.15s, background 0.15s",
                    }}
                  >
                    <s-stack direction="block" gap="small-100" alignItems="center">
                      <svg width="100" height="68" viewBox="0 0 140 96" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="1" y="1" width="138" height="94" rx="4" stroke="#D1D5DB" strokeWidth="1" fill="#F9FAFB" />
                        <rect x="12" y="8" width="24" height="18" rx="3" fill="#E5E7EB" /><rect x="42" y="8" width="24" height="18" rx="3" fill="#E5E7EB" />
                        <rect x="72" y="8" width="24" height="18" rx="3" fill="#E5E7EB" /><rect x="102" y="8" width="24" height="18" rx="3" fill="#E5E7EB" />
                        <rect x="12" y="30" width="24" height="18" rx="3" fill="#E5E7EB" /><rect x="42" y="30" width="24" height="18" rx="3" fill="#E5E7EB" />
                        <rect x="72" y="30" width="24" height="18" rx="3" fill="#E5E7EB" /><rect x="102" y="30" width="24" height="18" rx="3" fill="#E5E7EB" />
                        <rect x="16" y="64" width="108" height="26" rx="6" fill="white" stroke="#D1D5DB" strokeWidth="1" />
                        <rect x="16" y="63" width="108" height="2" rx="1" fill="rgba(0,0,0,0.04)" />
                        <rect x="24" y="70" width="12" height="12" rx="3" fill="#E5E7EB" /><rect x="40" y="70" width="12" height="12" rx="3" fill="#E5E7EB" />
                        <rect x="56" y="70" width="12" height="12" rx="3" fill="#E5E7EB" /><rect x="75" y="72" width="22" height="4" rx="2" fill="#D1D5DB" />
                        <rect x="75" y="79" width="14" height="3" rx="1.5" fill="#E5E7EB" /><rect x="104" y="69" width="14" height="14" rx="4" fill="#111111" />
                      </svg>
                      <s-text><strong>Floating cart card</strong></s-text>
                    </s-stack>
                  </div>

                  <div
                    onClick={() => setFullPageLayout("footer_side")}
                    style={{
                      border: fullPageLayout === "footer_side" ? "2px solid var(--p-color-border-interactive)" : "1px solid var(--p-color-border-secondary)",
                      borderRadius: "8px", padding: "8px", cursor: "pointer",
                      background: fullPageLayout === "footer_side" ? "var(--p-color-bg-surface-selected)" : "var(--p-color-bg-surface)",
                      transition: "border 0.15s, background 0.15s",
                    }}
                  >
                    <s-stack direction="block" gap="small-100" alignItems="center">
                      <svg width="100" height="68" viewBox="0 0 140 96" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="1" y="1" width="138" height="94" rx="4" stroke="#D1D5DB" strokeWidth="1" fill="#F9FAFB" />
                        <rect x="10" y="10" width="22" height="16" rx="2" fill="#E5E7EB" /><rect x="36" y="10" width="22" height="16" rx="2" fill="#E5E7EB" />
                        <rect x="62" y="10" width="22" height="16" rx="2" fill="#E5E7EB" /><rect x="10" y="32" width="22" height="16" rx="2" fill="#E5E7EB" />
                        <rect x="36" y="32" width="22" height="16" rx="2" fill="#E5E7EB" /><rect x="62" y="32" width="22" height="16" rx="2" fill="#E5E7EB" />
                        <rect x="10" y="54" width="22" height="16" rx="2" fill="#E5E7EB" /><rect x="36" y="54" width="22" height="16" rx="2" fill="#E5E7EB" />
                        <rect x="62" y="54" width="22" height="16" rx="2" fill="#E5E7EB" />
                        <rect x="90" y="1" width="49" height="94" rx="0" fill="#7C3AED" opacity="0.85" />
                        <rect x="97" y="12" width="34" height="4" rx="2" fill="white" opacity="0.8" />
                        <rect x="97" y="24" width="34" height="10" rx="2" fill="white" opacity="0.15" />
                        <rect x="97" y="40" width="34" height="10" rx="2" fill="white" opacity="0.15" />
                        <rect x="97" y="56" width="34" height="10" rx="2" fill="white" opacity="0.15" />
                        <rect x="97" y="74" width="34" height="14" rx="3" fill="white" opacity="0.7" />
                      </svg>
                      <s-text><strong>Sidebar panel</strong></s-text>
                    </s-stack>
                  </div>
                </div>
              </s-stack>
            )}

            <input type="hidden" name="bundleType" value={bundleType[0]} />
            {bundleType[0] === BundleType.FULL_PAGE && <input type="hidden" name="fullPageLayout" value={fullPageLayout} />}
            <button ref={submitButtonRef} type="submit" className={dashboardStyles.hiddenSubmit} aria-hidden="true" />
          </s-stack>
        </Form>
      </s-modal>

      {/* Delete Confirmation Modal */}
      <s-modal
        ref={deleteModalRef}
        id="delete-bundle-modal"
        heading="Delete Bundle?"
        onHide={handleCancelDelete}
      >
        <s-button slot="primaryAction" variant="primary" tone="critical" loading={fetcher.state === 'submitting' || undefined} onClick={handleConfirmDelete}>Delete</s-button>
        <s-button slot="secondaryActions" onClick={handleCancelDelete}>Cancel</s-button>
        <s-text color="subdued">
          This action cannot be undone. All bundle configuration, steps, and discount rules will be permanently deleted.
        </s-text>
      </s-modal>

      <div className={dashboardStyles.dashboardPage}>
        <div className={dashboardStyles.dashboardLayout}>

          {/* Header */}
          <div className={dashboardStyles.dashboardHeader}>
            <div className={dashboardStyles.dashboardTitleBlock}>
              <h1 className={dashboardStyles.dashboardTitle}>Dashboard: Wolfpack Bundle Builder</h1>
              <p className={dashboardStyles.dashboardSubtitle}>Access your bundles, Customer support and more.</p>
            </div>
            <div className={dashboardStyles.dashboardActions}>
              <div className={dashboardStyles.languageSelect}>
                <s-select
                  ref={langSelectRef}
                  label="Language"
                  labelAccessibilityVisibility="exclusive"
                  value={selectedLanguage}
                >
                  {languageOptions.map(o => (
                    <s-option key={o.value} value={o.value}>{o.label}</s-option>
                  ))}
                </s-select>
              </div>
              <s-button icon="refresh" onClick={handleSyncCollections}>Sync Collections</s-button>
              <s-button variant="primary" icon="plus" onClick={handleCreateBundle}>Create Bundle</s-button>
              <s-button icon="notification" onClick={handleBellClick} accessibilityLabel="Changelog" />
            </div>
          </div>

          {/* Banners */}
          {!proxyHealthy && <ProxyHealthBanner shop={shop} appUrl={appUrl} />}
          {subscription && (
            <UpgradePromptBanner
              plan={subscription.plan}
              currentBundleCount={subscription.currentBundleCount}
              bundleLimit={subscription.bundleLimit}
              canCreateBundle={subscription.canCreateBundle}
            />
          )}

          {/* Top cards */}
          <div className={dashboardStyles.topCardsGrid}>
            <s-section padding="none">
              <div className={dashboardStyles.supportCard}>
                <div className={dashboardStyles.supportAvatarWrap}>
                  {!parthImageLoaded && (
                    <div className={dashboardStyles.supportAvatarSkeleton}>
                      <s-spinner accessibilityLabel="Loading Parth profile photo" />
                    </div>
                  )}
                  <img
                    src="/Parth.jpeg"
                    alt="Parth, Founder"
                    className={`${dashboardStyles.supportAvatarImage} ${parthImageLoaded ? dashboardStyles.supportAvatarImageLoaded : ""}`}
                    onLoad={() => setParthImageLoaded(true)}
                  />
                </div>
                <div className={dashboardStyles.supportContent}>
                  <s-stack direction="block" gap="base">
                    <s-stack direction="block" gap="small-100">
                      <s-heading>Need help? Speak to Parth, the Founder!</s-heading>
                      <s-text color="subdued">Get support with bundle setup, custom styling, and technical issues.</s-text>
                    </s-stack>
                    <s-text color="subdued">
                      <span className={dashboardStyles.onlineNow}>ONLINE NOW</span> • Mon-Fri • Replies within 1 hour
                    </s-text>
                  </s-stack>
                </div>
                <div className={dashboardStyles.supportCta}>
                  <s-button variant="primary" inlineSize="fill" onClick={handleDirectChat}>Chat with Parth</s-button>
                </div>
              </div>
            </s-section>

            <button type="button" className={dashboardStyles.appEmbedCard} onClick={handleAppEmbedCardClick}>
              <s-stack direction="block" gap="base">
                <div className={dashboardStyles.appEmbedCardHeader}>
                  <s-heading>App Embeds</s-heading>
                  <s-icon type="external" color="subdued" />
                </div>
                <img src="/appEmbed.png" alt="Theme editor app embeds instructions" className={dashboardStyles.appEmbedImage} />
                <s-text color="subdued">Click on Online store → Edit Theme → Enable the toggle and Save it</s-text>
              </s-stack>
            </button>
          </div>

          {/* Bundles panel */}
          <s-section padding="none">
            <div className={dashboardStyles.bundlesPanel}>
              <div className={dashboardStyles.bundlesToolbar}>
                <div className={dashboardStyles.filterGroup}>
                  <div className={dashboardStyles.filterSelectWrap}>
                    <s-select ref={statusSelectRef} label="Status" value={statusFilter}>
                      <s-option value="all">Status</s-option>
                      <s-option value="active">Active</s-option>
                      <s-option value="draft">Draft</s-option>
                      <s-option value="unlisted">Unlisted</s-option>
                    </s-select>
                  </div>
                  <div className={dashboardStyles.filterSelectWrap}>
                    <s-select ref={typeSelectRef} label="Bundle type" value={typeFilter}>
                      <s-option value="all">Bundle type</s-option>
                      <s-option value="product_page">Product page</s-option>
                      <s-option value="full_page">Full page</s-option>
                    </s-select>
                  </div>
                </div>
                <div className={dashboardStyles.searchField}>
                  <s-text-field
                    ref={searchRef}
                    label="Search bundles"
                    labelAccessibilityVisibility="exclusive"
                    icon="search"
                    placeholder="Search...."
                    value={bundleFilter}
                    autocomplete="off"
                  />
                </div>
              </div>

              <div className={dashboardStyles.bundlesTableShell}>
                <div className={dashboardStyles.bundlesTableHeader}>
                  <span>Bundle Name</span>
                  <span>Status</span>
                  <span>Type</span>
                  <span>Actions</span>
                </div>

                {bundles.length === 0 ? (
                  <div className={dashboardStyles.emptyBundlesState}>
                    <div className={dashboardStyles.emptyBundlesIcon}>
                      <s-icon type="package" />
                    </div>
                    <s-stack direction="block" gap="small" alignItems="center">
                      <s-heading>No bundles yet</s-heading>
                      <s-text color="subdued">
                        You haven't created any bundles for your store. Start now
                        and boost your sales by grouping your best products.
                      </s-text>
                    </s-stack>
                  </div>
                ) : (
                  <>
                    {pagedBundles.map((bundle) => (
                      <div key={bundle.id} className={dashboardStyles.bundleTableRow}>
                        <span className={dashboardStyles.bundleTableCell}>{bundle.name}</span>
                        <span className={dashboardStyles.bundleTableCell}>{getStatusDisplay(bundle.status)}</span>
                        <span className={dashboardStyles.bundleTableCell}>{getBundleTypeDisplay(bundle.bundleType)}</span>
                        <span className={dashboardStyles.bundleTableCell}>
                          <BundleActionsButtons
                            bundleId={bundle.id}
                            bundleType={bundle.bundleType}
                            bundle={bundle}
                            onEdit={handleEditBundle}
                            onClone={handleCloneBundle}
                            onDelete={handleDeleteBundle}
                            onPreview={handlePreviewBundle}
                          />
                        </span>
                      </div>
                    ))}

                    {filteredBundles.length === 0 && (
                      <div className={dashboardStyles.noFilteredBundles}>
                        No bundles match the current filters
                      </div>
                    )}

                    {filteredBundles.length > 0 && (
                      <div className={dashboardStyles.paginationBar}>
                        <s-stack direction="inline" gap="small-100">
                          <s-button variant="tertiary" disabled={effectivePage <= 1 || undefined} onClick={() => setCurrentPage(p => p - 1)} accessibilityLabel="Previous page">‹</s-button>
                          <s-text>{`Page ${effectivePage} of ${totalPages}`}</s-text>
                          <s-button variant="tertiary" disabled={effectivePage >= totalPages || undefined} onClick={() => setCurrentPage(p => p + 1)} accessibilityLabel="Next page">›</s-button>
                        </s-stack>
                        <div className={dashboardStyles.perPageSelectWrap}>
                          <s-select ref={perPageSelectRef} label="Bundles per page" value={String(bundlesPerPage)}>
                            <s-option value="10">10 per page</s-option>
                            <s-option value="20">20 per page</s-option>
                            <s-option value="50">50 per page</s-option>
                          </s-select>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </s-section>

          {/* Resources card */}
          <div className={dashboardStyles.resourcesCard}>
            <div className={dashboardStyles.resourcesLayout}>
              <div className={dashboardStyles.resourcesList}>
                <button
                  type="button"
                  className={`${dashboardStyles.resourceItem} ${activeResource === 'bundle-inspirations' ? dashboardStyles.resourceItemActive : ''}`}
                  onClick={() => setActiveResource('bundle-inspirations')}
                >
                  <div className={dashboardStyles.resourceItemIcon}><s-icon type="image" /></div>
                  <span className={dashboardStyles.resourceItemLabel}>Bundle Inspiration</span>
                </button>
                <button type="button" className={dashboardStyles.resourceItem} onClick={handleDirectChat}>
                  <div className={dashboardStyles.resourceItemIcon}><s-icon type="question-circle" /></div>
                  <span className={dashboardStyles.resourceItemLabel}>Support</span>
                </button>
                <Link to="/app/events" className={dashboardStyles.resourceItem}>
                  <div className={dashboardStyles.resourceItemIcon}><s-icon type="notification" /></div>
                  <span className={dashboardStyles.resourceItemLabel}>Explore Update</span>
                </Link>
                <a href="https://wolfpackapps.com/" target="_blank" rel="noopener noreferrer" className={dashboardStyles.resourceItem}>
                  <div className={dashboardStyles.resourceItemIcon}><s-icon type="code" /></div>
                  <span className={dashboardStyles.resourceItemLabel}>SDK Documentation</span>
                </a>
              </div>

              <div className={dashboardStyles.resourcesThumbnails}>
                <a href="https://wolfpackapps.com/" target="_blank" rel="noopener noreferrer" className={dashboardStyles.resourceThumbnailCard}>
                  <img src="/bundleGallery.png" alt="Bundle Gallery" className={dashboardStyles.resourceThumbnailImage} />
                  <div className={dashboardStyles.resourceThumbnailFooter}>
                    <span>Bundle Gallery</span>
                    <s-icon type="external" color="subdued" />
                  </div>
                </a>
                <a href="https://wolfpackapps.com/" target="_blank" rel="noopener noreferrer" className={dashboardStyles.resourceThumbnailCard}>
                  <img src="/bundleGallery.png" alt="Interactive Demo" className={dashboardStyles.resourceThumbnailImage} />
                  <div className={dashboardStyles.resourceThumbnailFooter}>
                    <span>Bundle Gallery</span>
                    <s-icon type="external" color="subdued" />
                  </div>
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
