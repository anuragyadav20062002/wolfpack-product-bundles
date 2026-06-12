import { defer, json, type ActionFunctionArgs, type LinksFunction, type LoaderFunctionArgs } from "@remix-run/node";
import { Await, useFetcher, useNavigate, useLoaderData, Link, useSearchParams } from "@remix-run/react";
import { OptimisedImage } from "../../../components/OptimisedImage";
import { loaderCache } from "../../../lib/loader-cache.server";
import { ServerTiming } from "../../../lib/server-timing.server";
import { requireAdminSession } from "../../../lib/auth-guards.server";
import db from "../../../db.server";
import { AppLogger } from "../../../lib/logger";
import { BillingService } from "../../../services/billing.server";
import { useCallback, useRef, useEffect, useMemo, memo, useState, Suspense } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { checkAppEmbedEnabled } from "../../../services/theme/app-embed-check.server";
import { ProxyHealthBanner } from "../../../components/ProxyHealthBanner";
import { DashboardBannerSkeleton } from "../../../components/skeletons/DashboardBannerSkeleton";
import { useDashboardState } from "../../../hooks/useDashboardState";
import { BundleStatus, BundleType } from "../../../constants/bundle";
import { useTranslation } from "react-i18next";
import { getBundleWizardConfigurePath, getBundleEditPath } from "../../../lib/bundle-navigation";
import { decideDashboardPreviewAction } from "../../../lib/dashboard-preview-action";
import { handleCreatePreviewPage } from "../app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server";
import { EnablePreviewModal } from "../../../components/EnablePreviewModal";
import { useEnablePreviewGate } from "../../../hooks/useEnablePreviewGate";
import { normalizeAdminLocale } from "../../../i18n/config";
import { saveShopAdminLocale } from "../../../services/admin-locale.server";

import {
  handleCloneBundle,
  handleDeleteBundle,
} from "./handlers";

import type { BundleActionsButtonsProps } from "./types";

import dashboardStyles from "./dashboard.module.css";

/**
 * Issue: admin-lcp-phase3-images-1 — preload the dashboard hero image via
 * a real `<link rel="preload" as="image">` emitted during HTML parse. This
 * replaces a post-hydration `new Image()` preload that fired only AFTER
 * useEffect — too late for LCP. Pulls the AVIF variant so most browsers
 * fetch ~30 KB instead of the 68 KB JPEG.
 */
export const links: LinksFunction = () => [
  {
    rel: "preload",
    as: "image",
    href: "/Parth.avif",
    type: "image/avif",
    fetchpriority: "high",
  } as ReturnType<LinksFunction>[number],
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Issue: admin-lcp-phase4-loaders-1.
  // Was: sequential awaits for bundles -> embed-check -> billing -> proxy-health -> shop-graphql.
  // Now: bundles first (required for the rest), then Promise.all the four independent
  // calls. embed-check + billing + shop-graphql additionally cached via loaderCache so
  // back-to-back admin navigations re-use the same result within 30 s.
  const timing = new ServerTiming();
  const { session, admin } = await timing.track("auth", () => requireAdminSession(request));

  const bundles = await timing.track("db.bundles", () => db.bundle.findMany({
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
  }));

  const bundlesNeedingBackfill = bundles.filter(
    b => b.bundleType === BundleType.PRODUCT_PAGE && b.shopifyProductId && !b.shopifyProductHandle
  );

  if (bundlesNeedingBackfill.length > 0) {
    try {
      const productIds = bundlesNeedingBackfill.map(b => b.shopifyProductId).filter(Boolean);
      const GET_PRODUCTS = `query GetProductHandles($ids: [ID!]!) { nodes(ids: $ids) { ... on Product { id handle } } }`;
      const response = await timing.track("graphql.product-handles", () => admin.graphql(GET_PRODUCTS, { variables: { ids: productIds } }));
      const data = await response.json();
      if (data.data?.nodes) {
        // Parallelise the per-bundle DB updates instead of awaiting each in series.
        const updates: Promise<unknown>[] = [];
        for (const node of data.data.nodes) {
          if (node?.id && node?.handle) {
            const bundleToUpdate = bundlesNeedingBackfill.find(b => b.shopifyProductId === node.id);
            if (bundleToUpdate) {
              bundleToUpdate.shopifyProductHandle = node.handle;
              updates.push(db.bundle.update({ where: { id: bundleToUpdate.id }, data: { shopifyProductHandle: node.handle } }));
            }
          }
        }
        if (updates.length > 0) await timing.track("db.backfill-updates", () => Promise.all(updates));
      }
    } catch (error) {
      AppLogger.error("Failed to backfill product handles", { component: "app.dashboard", operation: "backfill-product-handles" }, error);
    }
  }

  const bundlesWithPreview = bundles.map(bundle => ({
    ...bundle,
    previewHandle: bundle.bundleType === BundleType.PRODUCT_PAGE ? bundle.shopifyProductHandle : bundle.id
  }));

  const apiKey = process.env.SHOPIFY_API_KEY || "63077bb0483a6ce08a2d6139b14d170b";
  const SHORT_TTL_MS = 30_000;

  // Issue: admin-lcp-phase6-defer-skeletons-1.
  // embed-check stays eager — its outputs (`themeEditorUrl`, `appEmbedEnabled`)
  // are consumed inside `useCallback` click handlers that must be wired at
  // first render. Cached for ~30 s so its actual cost is usually <30 ms.
  // billing + proxy-health are kicked off concurrently here and surfaced via
  // a deferred `banners` promise so the bundles table can paint without
  // blocking on the 3-second proxy-health abort timeout.
  const billingPromise = loaderCache.memo(
    `billing:${session.shop}`,
    async () => {
      try { return await BillingService.getSubscriptionInfo(session.shop); }
      catch (error) {
        AppLogger.error("Failed to fetch subscription info", { component: "app.dashboard", operation: "get-subscription-info" }, error);
        return null;
      }
    },
    SHORT_TTL_MS,
  );
  const proxyHealthPromise = (async () => {
    try {
      const controller = new AbortController();
      const proxyTimer = setTimeout(() => controller.abort(), 3000);
      const proxyRes = await fetch(`https://${session.shop}/apps/product-bundles/api/proxy-health`, { signal: controller.signal });
      clearTimeout(proxyTimer);
      if (proxyRes.status === 404) {
        const ct = proxyRes.headers.get("content-type") ?? "";
        if (ct.includes("text/html")) {
          AppLogger.warn("App proxy health check failed", { component: "app.dashboard", operation: "proxy-health-check", shop: session.shop });
          return false;
        }
      }
    } catch { /* Timeout — default healthy */ }
    return true;
  })();

  const embedCheck = await timing.track("embed-check", () => loaderCache.memo(
    `embed-check:${session.shop}`,
    () => checkAppEmbedEnabled(admin, session.shop, { blockHandles: ["bundle-app-embed"] }),
    SHORT_TTL_MS,
  ));

  const banners = (async () => {
    const [subscriptionInfo, proxyHealthy] = await Promise.all([billingPromise, proxyHealthPromise]);
    return {
      subscription: subscriptionInfo ? {
        plan: subscriptionInfo.plan,
        currentBundleCount: subscriptionInfo.currentBundleCount,
        bundleLimit: subscriptionInfo.bundleLimit,
        canCreateBundle: subscriptionInfo.canCreateBundle,
      } : null,
      proxyHealthy,
    };
  })();

  const themeEditorUrl = embedCheck.themeId
    ? `https://${session.shop}/admin/themes/${embedCheck.themeId.split("/").pop()}/editor?context=apps&appEmbed=${apiKey}%2Fbundle-app-embed`
    : null;
  const appEmbedEnabled = embedCheck.enabled;

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

  return defer({
    bundles: bundlesWithPreview,
    shop: session.shop,
    appUrl,
    themeEditorUrl,
    appEmbedEnabled,
    banners,
  }, { headers: timing.toHeaders() });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, admin } = await requireAdminSession(request);
  const formData = await request.formData();
  const intent = formData.get("intent");
  if (intent === "cloneBundle") return handleCloneBundle(admin, session, formData);
  if (intent === "deleteBundle") return handleDeleteBundle(admin, session, formData);
  if (intent === "saveAdminLocale") {
    try {
      const locale = await saveShopAdminLocale(session.shop, String(formData.get("locale") || ""));
      return json({ success: true, locale });
    } catch {
      return json({ success: false, error: "Unsupported Admin locale" }, { status: 400 });
    }
  }
  if (intent === "createPreviewPage") {
    const bundleId = String(formData.get("bundleId") || "");
    if (!bundleId) return json({ success: false, error: "Missing bundleId" }, { status: 400 });
    return handleCreatePreviewPage(admin, session, bundleId);
  }
  return json({ error: "Unknown action" }, { status: 400 });
};

const STATUS_TONE_MAP = { active: 'success', draft: 'info', unlisted: 'warning' } as const;

const BundleActionsButtons = memo(({ bundleId, onEdit, onClone, onDelete, onPreview, bundle }: Omit<BundleActionsButtonsProps, 'moreOpen' | 'onMoreToggle'>) => {
  const { t } = useTranslation();
  return (
    <div className={dashboardStyles.bundleActions}>
      <s-button
        id={`edit-${bundleId}`}
        icon="edit"
        variant="tertiary"
        interestFor={`tooltip-edit-${bundleId}`}
        onClick={() => onEdit(bundle)}
        accessibilityLabel={t("dashboard.actions.editBundle")}
      />
      <s-tooltip id={`tooltip-edit-${bundleId}`}>{t("dashboard.actions.editBundle")}</s-tooltip>

      <s-button
        id={`preview-${bundleId}`}
        icon="view"
        variant="tertiary"
        interestFor={`tooltip-preview-${bundleId}`}
        onClick={() => onPreview(bundle)}
        accessibilityLabel={t("dashboard.actions.previewBundle")}
      />
      <s-tooltip id={`tooltip-preview-${bundleId}`}>
        {t("dashboard.actions.previewBundle")}
      </s-tooltip>

      <s-button
        id={`more-${bundleId}`}
        icon="menu-horizontal"
        variant="tertiary"
        commandFor={`more-popover-${bundleId}`}
        command="--toggle"
        accessibilityLabel={t("dashboard.actions.moreActions")}
      />
      <s-popover id={`more-popover-${bundleId}`}>
        <s-stack direction="block" gap="none">
          <s-button variant="tertiary" icon="duplicate" onClick={() => onClone(bundleId)}>{t("dashboard.actions.cloneBundle")}</s-button>
          <s-button variant="tertiary" tone="critical" icon="delete" onClick={() => onDelete(bundleId)}>{t("dashboard.actions.deleteBundle")}</s-button>
        </s-stack>
      </s-popover>
    </div>
  );
});

BundleActionsButtons.displayName = 'BundleActionsButtons';

export default function Dashboard() {
  const { bundles, shop, appUrl, themeEditorUrl, appEmbedEnabled, banners } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const fetcher = useFetcher();
  const localeFetcher = useFetcher<typeof action>();
  const shopify = useAppBridge();
  const { t, i18n } = useTranslation();

  const dashboardState = useDashboardState();
  const {
    bundleToDelete, openDeleteModal, closeDeleteModal,
  } = dashboardState;

  const deleteModalRef = useRef<any>(null);
  const searchRef = useRef<any>(null);
  const langSelectRef = useRef<any>(null);
  const perPageSelectRef = useRef<any>(null);
  const statusChoiceListRef = useRef<any>(null);
  const typeChoiceListRef = useRef<any>(null);
  const statusPopoverRef = useRef<any>(null);
  const typePopoverRef = useRef<any>(null);
  const fetcherIntentRef = useRef<string | null>(null);

  // Hero image preload moved to the `links` export above — it now happens
  // during HTML parse rather than post-hydration, which previously added ~LCP
  // to the Parth.jpeg paint. Mark loaded immediately so the skeleton swap
  // happens as soon as the `<img>` mounts. The OptimisedImage's <img>
  // `onLoad` is still wired below so the skeleton waits for the real bytes.
  useEffect(() => {
    setParthImageLoaded(true);
  }, []);

  useEffect(() => {
    if (fetcher.state !== 'idle' || !fetcher.data) return;
    const intent = fetcherIntentRef.current;
    if (!intent) return;
    const data = fetcher.data as Record<string, unknown>;
    if (data.success) {
      if (intent === 'createPreviewPage') {
        const previewUrl = typeof data.shareablePreviewUrl === 'string' ? data.shareablePreviewUrl : '';
        if (previewUrl) {
          shopify.toast.show("Opening preview in new tab…", { duration: 2000 });
          window.open(previewUrl, "_blank", "noopener,noreferrer");
        } else {
          shopify.toast.show("Preview page was created, but no preview URL was returned.", { isError: true, duration: 5000 });
        }
      } else if (intent === 'cloneBundle' && data.bundleId) {
        shopify.toast.show(t("dashboard.actions.cloneSuccess"));
        navigate(getBundleWizardConfigurePath(String(data.bundleId)));
      } else if (intent === 'deleteBundle') {
        shopify.toast.show(t("dashboard.actions.deleteSuccess"));
      }
    } else if (data.error) {
      shopify.toast.show(String(data.error), { isError: true, duration: 5000 });
    }
    fetcherIntentRef.current = null;
  }, [fetcher.state, fetcher.data, navigate, shopify, t]);

  const handleDirectChat = () => {
    if (typeof window !== 'undefined' && (window as any).$crisp) {
      (window as any).$crisp.push(["do", "chat:open"]);
    }
  };

  const handleEditBundle = useCallback((bundle: typeof bundles[number]) => {
    navigate(getBundleEditPath(bundle.id, bundle.bundleType));
  }, [navigate]);

  const handleCloneBundle = useCallback((bundleId: string) => {
    if (confirm(t("dashboard.actions.confirmClone"))) {
      fetcherIntentRef.current = 'cloneBundle';
      const formData = new FormData();
      formData.append("intent", "cloneBundle");
      formData.append("bundleId", bundleId);
      fetcher.submit(formData, { method: "post" });
    }
  }, [fetcher, bundles, t]);

  const handleDeleteBundle = useCallback((bundleId: string) => {
    openDeleteModal(bundleId);
    deleteModalRef.current?.showOverlay?.();
    deleteModalRef.current?.show?.();
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
      deleteModalRef.current?.hide?.();
    }
  }, [bundleToDelete, fetcher, closeDeleteModal]);

  const handleCancelDelete = useCallback(() => {
    closeDeleteModal();
    deleteModalRef.current?.hideOverlay?.();
    deleteModalRef.current?.hide?.();
  }, [closeDeleteModal]);

  useEffect(() => {
    const modal = deleteModalRef.current;
    if (!modal) return;
    const handler = () => closeDeleteModal();
    modal.addEventListener("dismiss", handler);
    modal.addEventListener("hide", handler);
    return () => {
      modal.removeEventListener("dismiss", handler);
      modal.removeEventListener("hide", handler);
    };
  }, [closeDeleteModal]);

  const enablePreviewGate = useEnablePreviewGate({
    appEmbedEnabled,
    themeEditorUrl,
    onSilentBlock: () => shopify.toast.show(t("dashboard.actions.themeEditorUnavailable"), { isError: true }),
  });

  const handlePreviewBundle = useCallback((bundle: typeof bundles[number]) => {
    const executePreviewAction = () => {
      const action = decideDashboardPreviewAction({
        bundleType: bundle.bundleType as "full_page" | "product_page",
        bundleId: bundle.id,
        shopifyProductHandle: bundle.shopifyProductHandle,
        shopifyPageHandle: bundle.shopifyPageHandle,
        shop,
        appEmbedEnabled,
        bundleStatus: bundle.status,
      });

      if (action.kind === "error") {
        shopify.toast.show(action.toast, { isError: true });
        return;
      }

      if (action.kind === "create_preview_page") {
        const formData = new FormData();
        formData.append("intent", "createPreviewPage");
        formData.append("bundleId", bundle.id);
        fetcherIntentRef.current = "createPreviewPage";
        fetcher.submit(formData, { method: "post" });
        return;
      }

      window.open(action.url, "_blank", "noopener,noreferrer");
    };

    if (bundle.bundleType === "full_page") {
      executePreviewAction();
      return;
    }

    enablePreviewGate.requestPreview(executePreviewAction);
  }, [shop, shopify, fetcher, enablePreviewGate, appEmbedEnabled]);

  const getStatusDisplay = (status: string) => {
    const tone = STATUS_TONE_MAP[status as keyof typeof STATUS_TONE_MAP] ?? 'info';
    return <s-badge tone={tone}>{t(`dashboard.status.${status}`, status)}</s-badge>;
  };

  const getBundleTypeDisplay = (bundleType: string) => {
    return t(`dashboard.bundleType.${bundleType}`, bundleType);
  };

  const [bundleFilter, setBundleFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [bundlesPerPage, setBundlesPerPage] = useState(20);
  const [activeResource, setActiveResource] = useState<string>('bundle-inspirations');
  const [parthImageLoaded, setParthImageLoaded] = useState(false);

  const languageOptions = useMemo(() => [
    { label: t("dashboard.language.en"), value: "en" },
    { label: t("dashboard.language.fr"), value: "fr" },
    { label: t("dashboard.language.de"), value: "de" },
    { label: t("dashboard.language.es"), value: "es" },
    { label: t("dashboard.language.ja"), value: "ja" },
    { label: t("dashboard.language.pt-BR"), value: "pt-BR" },
  ], [t]);

  const activeLanguage = normalizeAdminLocale(i18n.language);
  const [selectedLanguage, setSelectedLanguage] = useState(activeLanguage);

  const handleLanguageChange = useCallback((locale: string) => {
    const nextLocale = normalizeAdminLocale(locale);
    setSelectedLanguage(nextLocale);
    if (nextLocale === activeLanguage) return;
    const formData = new FormData();
    formData.append("intent", "saveAdminLocale");
    formData.append("locale", nextLocale);
    localeFetcher.submit(formData, { method: "post" });
  }, [activeLanguage, localeFetcher]);

  useEffect(() => {
    if (localeFetcher.state !== "idle" || !localeFetcher.data) return;
    const data = localeFetcher.data;
    if (data.success && "locale" in data) {
      localStorage.setItem("wolfpack-locale", data.locale);
      void i18n.changeLanguage(data.locale);
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.set("locale", data.locale);
        return next;
      });
      shopify.toast.show(t("dashboard.language.saveSuccess"));
      return;
    }
    shopify.toast.show(t("dashboard.language.saveError"), { isError: true });
  }, [i18n, localeFetcher.data, localeFetcher.state, setSearchParams, shopify, t]);

  useEffect(() => {
    setSelectedLanguage(normalizeAdminLocale(i18n.language));
  }, [i18n.language]);

  useEffect(() => {
    if (searchParams.get("locale") === activeLanguage) return;
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set("locale", activeLanguage);
      return next;
    });
  }, [activeLanguage, searchParams, setSearchParams]);

  useEffect(() => {
    const el = langSelectRef.current;
    if (!el) return;
    const handler = (e: Event) => {
      const val = (e.currentTarget as HTMLInputElement).value ?? '';
      if (val) handleLanguageChange(val);
    };
    el.addEventListener('change', handler);
    return () => el.removeEventListener('change', handler);
  }, [handleLanguageChange]);

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

  useEffect(() => {
    const el = statusChoiceListRef.current;
    if (!el) return;
    const handler = (e: Event) => {
      const values = (e.currentTarget as any).values;
      if (Array.isArray(values) && values.length > 0) {
        setStatusFilter(values[0]);
        setCurrentPage(1);
        statusPopoverRef.current?.hideOverlay?.();
      }
    };
    el.addEventListener('change', handler);
    return () => el.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const el = typeChoiceListRef.current;
    if (!el) return;
    const handler = (e: Event) => {
      const values = (e.currentTarget as any).values;
      if (Array.isArray(values) && values.length > 0) {
        setTypeFilter(values[0]);
        setCurrentPage(1);
        typePopoverRef.current?.hideOverlay?.();
      }
    };
    el.addEventListener('change', handler);
    return () => el.removeEventListener('change', handler);
  }, []);

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
    shopify.toast.show(t("dashboard.header.syncCollections"));
  }, [shopify, t]);

  const handleBellClick = useCallback(() => {
    navigate('/app/events');
  }, [navigate]);

  const handleAppEmbedCardClick = useCallback(() => {
    if (themeEditorUrl) {
      window.open(themeEditorUrl, "_blank", "noopener,noreferrer");
      return;
    }
    shopify.toast.show(t("dashboard.actions.themeEditorUnavailable"), { isError: true });
  }, [shopify, themeEditorUrl, t]);

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
      {/* Delete Confirmation Modal */}
      <s-modal
        ref={deleteModalRef}
        id="delete-bundle-modal"
        heading={t("dashboard.deleteModal.heading")}
      >
        <s-button slot="primary-action" variant="primary" tone="critical" loading={fetcher.state === 'submitting' || undefined} onClick={handleConfirmDelete}>{t("dashboard.deleteModal.delete")}</s-button>
        <s-button slot="secondary-actions" onClick={handleCancelDelete}>{t("dashboard.deleteModal.cancel")}</s-button>
        <s-text color="subdued">
          {t("dashboard.deleteModal.body")}
        </s-text>
      </s-modal>

      <div className={dashboardStyles.dashboardPage}>
        <div className={dashboardStyles.dashboardLayout}>

          {/* Header */}
          <div className={dashboardStyles.dashboardHeader}>
            <div className={dashboardStyles.dashboardTitleBlock}>
              <h1 className={dashboardStyles.dashboardTitle}>{t("dashboard.title")}</h1>
              <p className={dashboardStyles.dashboardSubtitle}>{t("dashboard.subtitle")}</p>
            </div>
            <div className={dashboardStyles.dashboardActions}>
              <div className={dashboardStyles.languageSelect}>
                <s-select
                  ref={langSelectRef}
                  label={t("dashboard.language.label")}
                  labelAccessibilityVisibility="exclusive"
                  value={selectedLanguage}
                >
                  {languageOptions.map(o => (
                    <s-option key={o.value} value={o.value}>{o.label}</s-option>
                  ))}
                </s-select>
              </div>
              <s-button icon="refresh" onClick={handleSyncCollections}>{t("dashboard.header.syncCollections")}</s-button>
              <s-button variant="primary" onClick={() => navigate('/app/bundles/create')}>{t("dashboard.header.createBundle")}</s-button>
              <s-button icon="notification" onClick={handleBellClick} accessibilityLabel={t("dashboard.header.changelog")} />
            </div>
          </div>

          {/* Banners — deferred via admin-lcp-phase6-defer-skeletons-1 */}
          <Suspense fallback={<DashboardBannerSkeleton />}>
            <Await resolve={banners}>
              {(b) => (
                <>
                  {!b.proxyHealthy && <ProxyHealthBanner shop={shop} appUrl={appUrl} />}
                </>
              )}
            </Await>
          </Suspense>

          {/* Top cards */}
          <div className={dashboardStyles.topCardsGrid}>
            <s-section padding="none">
              <div className={dashboardStyles.supportCard}>
                <div className={dashboardStyles.supportCardHero}>
                  <p className={dashboardStyles.supportCardHeroTitle}>{t("dashboard.support.heroTitle")}</p>
                  <p className={dashboardStyles.supportCardHeroDesc}>{t("dashboard.support.heroDesc")}</p>
                </div>
                <div className={dashboardStyles.supportCardBody}>
                  <div className={dashboardStyles.supportAvatarWrap}>
                    {!parthImageLoaded && (
                      <div className={dashboardStyles.supportAvatarSkeleton}>
                        <s-spinner accessibilityLabel={t("dashboard.support.imageLoading")} />
                      </div>
                    )}
                    <OptimisedImage
                      src="/Parth.jpeg"
                      alt={t("dashboard.support.imageAlt")}
                      className={`${dashboardStyles.supportAvatarImage} ${parthImageLoaded ? dashboardStyles.supportAvatarImageLoaded : ""}`}
                      width={120}
                      height={120}
                      loading="eager"
                      fetchPriority="high"
                      onLoad={() => setParthImageLoaded(true)}
                    />
                  </div>
                  <div className={dashboardStyles.supportContent}>
                    <s-stack direction="block" gap="base">
                      <s-stack direction="block" gap="small-100">
                        <s-heading>{t("dashboard.support.heading")}</s-heading>
                        <s-text color="subdued">{t("dashboard.support.body")}</s-text>
                      </s-stack>
                      <s-text color="subdued">
                        <span className={dashboardStyles.onlineNow}>{t("dashboard.support.onlineNow")}</span> • {t("dashboard.support.availability")}
                      </s-text>
                    </s-stack>
                  </div>
                  <div className={dashboardStyles.supportCta}>
                    <s-button variant="primary" inlineSize="fill" onClick={handleDirectChat}>{t("dashboard.support.cta")}</s-button>
                  </div>
                </div>
              </div>
            </s-section>

            <button type="button" className={dashboardStyles.appEmbedCard} onClick={handleAppEmbedCardClick}>
              <s-stack direction="block" gap="base">
                <div className={dashboardStyles.appEmbedCardHeader}>
                  <s-heading>{t("dashboard.appEmbeds.headingMain")} <span className={dashboardStyles.appEmbedHeadingHint}>{t("dashboard.appEmbeds.headingHint")}</span></s-heading>
                  <s-icon type="external" color="subdued" />
                </div>
                <OptimisedImage
                  src="/appEmbed.png"
                  alt={t("dashboard.appEmbeds.headingMain")}
                  className={dashboardStyles.appEmbedImage}
                  width={420}
                  height={140}
                  loading="lazy"
                />
                <s-text color="subdued">{t("dashboard.appEmbeds.instruction")}</s-text>
              </s-stack>
            </button>
          </div>

          {/* Bundles panel */}
          <s-section padding="none">
            <div className={dashboardStyles.bundlesPanel}>
              <div className={dashboardStyles.bundlesToolbar}>
                <div className={dashboardStyles.filterGroup}>
                  {/* Status filter pill */}
                  <s-button id="status-filter-btn" commandFor="status-filter-popover" variant="secondary">
                    {statusFilter === 'all' ? t("dashboard.filters.status") : t(`dashboard.status.${statusFilter}`, statusFilter)} ▾
                  </s-button>
                  <s-popover ref={statusPopoverRef} id="status-filter-popover">
                    <s-box padding="base">
                      <s-choice-list ref={statusChoiceListRef} name="status-filter-list" label={t("dashboard.filters.byStatus")} labelAccessibilityVisibility="exclusive">
                        <s-choice value="all" selected={statusFilter === 'all' || undefined}>{t("dashboard.filters.all")}</s-choice>
                        <s-choice value="active" selected={statusFilter === 'active' || undefined}>{t("dashboard.status.active")}</s-choice>
                        <s-choice value="draft" selected={statusFilter === 'draft' || undefined}>{t("dashboard.status.draft")}</s-choice>
                        <s-choice value="unlisted" selected={statusFilter === 'unlisted' || undefined}>{t("dashboard.status.unlisted")}</s-choice>
                      </s-choice-list>
                    </s-box>
                  </s-popover>

                  {/* Bundle type filter pill */}
                  <s-button id="type-filter-btn" commandFor="type-filter-popover" variant="secondary">
                    {typeFilter === 'all' ? t("dashboard.filters.bundleType") : getBundleTypeDisplay(typeFilter)} ▾
                  </s-button>
                  <s-popover ref={typePopoverRef} id="type-filter-popover">
                    <s-box padding="base">
                      <s-choice-list ref={typeChoiceListRef} name="type-filter-list" label={t("dashboard.filters.byType")} labelAccessibilityVisibility="exclusive">
                        <s-choice value="all" selected={typeFilter === 'all' || undefined}>{t("dashboard.filters.all")}</s-choice>
                        <s-choice value="product_page" selected={typeFilter === 'product_page' || undefined}>{t("dashboard.bundleType.product_page")}</s-choice>
                        <s-choice value="full_page" selected={typeFilter === 'full_page' || undefined}>{t("dashboard.bundleType.full_page")}</s-choice>
                      </s-choice-list>
                    </s-box>
                  </s-popover>
                </div>
                <div className={dashboardStyles.searchField}>
                  <s-text-field
                    ref={searchRef}
                    label={t("dashboard.search.label")}
                    labelAccessibilityVisibility="exclusive"
                    icon="search"
                    placeholder={t("dashboard.search.placeholder")}
                    value={bundleFilter}
                    autocomplete="off"
                  />
                </div>
              </div>

              <div className={dashboardStyles.bundlesTableShell}>
                <div className={dashboardStyles.bundlesTableHeader}>
                  <span>{t("dashboard.table.bundleName")}</span>
                  <span>{t("dashboard.table.status")}</span>
                  <span>{t("dashboard.table.type")}</span>
                  <span>{t("dashboard.table.actions")}</span>
                </div>

                {bundles.length === 0 ? (
                  <div className={dashboardStyles.emptyBundlesState}>
                    <div className={dashboardStyles.emptyBundlesIcon}>
                      <OptimisedImage
                        src="/bundle.png"
                        alt=""
                        className={dashboardStyles.emptyBundlesImg}
                        width={120}
                        height={120}
                        loading="lazy"
                      />
                    </div>
                    <s-stack direction="block" gap="small" alignItems="center">
                      <s-heading>{t("dashboard.emptyState.title")}</s-heading>
                      <p className={dashboardStyles.emptyBundlesBody}>
                        {t("dashboard.emptyState.body")}
                      </p>
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
                        {t("dashboard.noResults")}
                      </div>
                    )}

                    {filteredBundles.length > 0 && (
                      <div className={dashboardStyles.paginationBar}>
                        <s-stack direction="inline" gap="small-100">
                          <s-button variant="tertiary" disabled={effectivePage <= 1 || undefined} onClick={() => setCurrentPage(p => p - 1)} accessibilityLabel={t("dashboard.pagination.prev")}>‹</s-button>
                          <s-text>{t("dashboard.pagination.page", { current: effectivePage, total: totalPages })}</s-text>
                          <s-button variant="tertiary" disabled={effectivePage >= totalPages || undefined} onClick={() => setCurrentPage(p => p + 1)} accessibilityLabel={t("dashboard.pagination.next")}>›</s-button>
                        </s-stack>
                        <div className={dashboardStyles.perPageSelectWrap}>
                          <s-select ref={perPageSelectRef} label={t("dashboard.pagination.perPageLabel")} value={String(bundlesPerPage)}>
                            <s-option value="10">{t("dashboard.pagination.per10")}</s-option>
                            <s-option value="20">{t("dashboard.pagination.per20")}</s-option>
                            <s-option value="50">{t("dashboard.pagination.per50")}</s-option>
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
                  <span className={dashboardStyles.resourceItemLabel}>{t("dashboard.resources.bundleInspiration")}</span>
                </button>
                <button type="button" className={dashboardStyles.resourceItem} onClick={handleDirectChat}>
                  <div className={dashboardStyles.resourceItemIcon}><s-icon type="question-circle" /></div>
                  <span className={dashboardStyles.resourceItemLabel}>{t("dashboard.resources.support")}</span>
                </button>
                <Link to="/app/events" className={dashboardStyles.resourceItem}>
                  <div className={dashboardStyles.resourceItemIcon}><s-icon type="notification" /></div>
                  <span className={dashboardStyles.resourceItemLabel}>{t("dashboard.resources.exploreUpdate")}</span>
                </Link>
                <a href="https://wolfpackapps.com/" target="_blank" rel="noopener noreferrer" className={dashboardStyles.resourceItem}>
                  <div className={dashboardStyles.resourceItemIcon}><s-icon type="code" /></div>
                  <span className={dashboardStyles.resourceItemLabel}>{t("dashboard.resources.sdkDocumentation")}</span>
                </a>
              </div>

              <div className={dashboardStyles.resourcesThumbnails}>
                <a href="https://wolfpackapps.com/" target="_blank" rel="noopener noreferrer" className={dashboardStyles.resourceThumbnailCard}>
                  <OptimisedImage
                    src="/bundleGallery.png"
                    alt={t("dashboard.resources.bundleGallery")}
                    className={dashboardStyles.resourceThumbnailImage}
                    width={320}
                    height={180}
                    loading="lazy"
                  />
                  <div className={dashboardStyles.resourceThumbnailFooter}>
                    <span>{t("dashboard.resources.bundleGallery")}</span>
                    <s-icon type="external" color="subdued" />
                  </div>
                </a>
                <a href="https://wolfpackapps.com/" target="_blank" rel="noopener noreferrer" className={dashboardStyles.resourceThumbnailCard}>
                  <OptimisedImage
                    src="/bundleGallery.png"
                    alt={t("dashboard.resources.bundleGallery")}
                    className={dashboardStyles.resourceThumbnailImage}
                    width={320}
                    height={180}
                    loading="lazy"
                  />
                  <div className={dashboardStyles.resourceThumbnailFooter}>
                    <span>{t("dashboard.resources.bundleGallery")}</span>
                    <s-icon type="external" color="subdued" />
                  </div>
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>

      <EnablePreviewModal {...enablePreviewGate.modalProps} />
    </>
  );
}
