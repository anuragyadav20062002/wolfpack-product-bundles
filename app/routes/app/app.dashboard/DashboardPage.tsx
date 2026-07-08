import { Await, useFetcher, useNavigate, useLoaderData, useSearchParams } from "@remix-run/react";
import { lazy, useCallback, useRef, useEffect, useMemo, useState, Suspense } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useTranslation } from "react-i18next";
import { OptimisedImage } from "../../../components/OptimisedImage";
import { ProxyHealthBanner } from "../../../components/ProxyHealthBanner";
import { DashboardBannerSkeleton } from "../../../components/skeletons/DashboardBannerSkeleton";
import { useDashboardState } from "../../../hooks/useDashboardState";
import { getBundleWizardConfigurePath, getBundleEditPath } from "../../../lib/bundle-navigation";
import { decideDashboardPreviewAction } from "../../../lib/dashboard-preview-action";
import { openSupportChat } from "../../../lib/support-chat.client";
import { openThemeEditorInNewTab } from "../../../lib/theme-editor-navigation.client";
import { useEnablePreviewGate } from "../../../hooks/useEnablePreviewGate";
import { normalizeAdminLocale } from "../../../i18n/config";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  setDashboardBundleFilter,
  setDashboardBundlesPerPage,
  setDashboardCurrentPage,
  setDashboardStatusFilter,
  setDashboardTypeFilter,
} from "../../../store/slices/adminRouteStateSlice";
import type { action, loader } from "./route";
import { DashboardTopCards } from "./DashboardTopCards";
import {
  getDashboardMediaState,
  shouldRenderDashboardResourceCard,
} from "./dashboard-media-state";
import {
  shouldRenderDashboardDeleteModal,
  shouldRenderDashboardPreviewModal,
} from "./dashboard-modal-state";
import {
  buildDashboardLocaleSearchParams,
  shouldApplyDashboardLocaleSave,
} from "./dashboard-locale-state";
import { BundleActionsButtons } from "./BundleActionsButtons";
import dashboardStyles from "./dashboard.module.css";

const STATUS_TONE_MAP = { active: 'success', draft: 'info', unlisted: 'warning' } as const;
const DashboardResourcesCard = lazy(() =>
  import("./DashboardResourcesCard").then((module) => ({ default: module.DashboardResourcesCard })),
);
const EnablePreviewModal = lazy(() =>
  import("../../../components/EnablePreviewModal").then((module) => ({ default: module.EnablePreviewModal })),
);

export function DashboardPage() {
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
  const lastAppliedLocaleSaveRef = useRef<string | null>(null);
  const [previewingBundleId, setPreviewingBundleId] = useState<string | null>(null);
  const [editingBundleId, setEditingBundleId] = useState<string | null>(null);
  const [activeActionMenuBundleId, setActiveActionMenuBundleId] = useState<string | null>(null);
  const [hasHydratedDashboardMedia, setHasHydratedDashboardMedia] = useState(false);
  const [hasMainContentSettled, setHasMainContentSettled] = useState(false);

  useEffect(() => {
    setHasHydratedDashboardMedia(true);
  }, []);

  useEffect(() => {
    if (typeof window.requestIdleCallback === "function") {
      const idleId = window.requestIdleCallback(() => setHasMainContentSettled(true), { timeout: 1800 });
      return () => window.cancelIdleCallback?.(idleId);
    }
    const timeoutId = window.setTimeout(() => setHasMainContentSettled(true), 1200);
    return () => window.clearTimeout(timeoutId);
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
    if (intent === 'createPreviewPage') {
      setPreviewingBundleId(null);
    }
    fetcherIntentRef.current = null;
  }, [fetcher.state, fetcher.data, navigate, shopify, t]);

  const handleDirectChat = () => {
    openSupportChat();
  };

  const handleEditBundle = useCallback((bundle: typeof bundles[number]) => {
    setEditingBundleId(bundle.id);
    const editPath = getBundleEditPath(bundle.id, bundle.bundleType);
    window.requestAnimationFrame(() => navigate(editPath));
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

  useEffect(() => {
    if (!bundleToDelete) return;
    deleteModalRef.current?.showOverlay?.();
    deleteModalRef.current?.show?.();
  }, [bundleToDelete]);

  const enablePreviewGate = useEnablePreviewGate({
    appEmbedEnabled,
    themeEditorUrl,
    onSilentBlock: () => shopify.toast.show(t("dashboard.actions.themeEditorUnavailable"), { isError: true }),
  });
  const renderDeleteModal = shouldRenderDashboardDeleteModal({ bundleToDelete });
  const renderPreviewModal = shouldRenderDashboardPreviewModal({
    isOpen: enablePreviewGate.modalProps.open,
  });

  const recordDashboardPreview = useCallback((bundleId: string, bundleLink: string) => {
    const formData = new FormData();
    formData.append("intent", "recordBundlePreview");
    formData.append("bundleId", bundleId);
    formData.append("bundleLink", bundleLink);
    formData.append("routeFamily", "dashboard");
    void fetch(window.location.href, { method: "POST", body: formData }).catch(() => {});
  }, []);

  const handlePreviewBundle = useCallback((bundle: typeof bundles[number]) => {
    const stopPreviewLoadingSoon = () => {
      window.setTimeout(() => setPreviewingBundleId(null), 500);
    };
    const executePreviewAction = () => {
      setPreviewingBundleId(bundle.id);
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
        stopPreviewLoadingSoon();
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
      recordDashboardPreview(bundle.id, action.url);
      stopPreviewLoadingSoon();
    };

    if (bundle.bundleType === "full_page") {
      executePreviewAction();
      return;
    }

    enablePreviewGate.requestPreview(executePreviewAction);
  }, [shop, shopify, fetcher, enablePreviewGate, appEmbedEnabled, recordDashboardPreview]);

  const getStatusDisplay = (status: string) => {
    const tone = STATUS_TONE_MAP[status as keyof typeof STATUS_TONE_MAP] ?? 'info';
    return <s-badge tone={tone}>{t(`dashboard.status.${status}`, status)}</s-badge>;
  };

  const getBundleTypeDisplay = (bundleType: string) => {
    return t(`dashboard.bundleType.${bundleType}`, bundleType);
  };

  const dispatch = useAppDispatch();
  const {
    bundleFilter,
    typeFilter,
    statusFilter,
    currentPage,
    bundlesPerPage,
  } = useAppSelector((state) => state.adminRouteState.dashboard);
  const setBundleFilter = useCallback((value: string) => {
    dispatch(setDashboardBundleFilter(value));
  }, [dispatch]);
  const setTypeFilter = useCallback((value: string) => {
    dispatch(setDashboardTypeFilter(value));
  }, [dispatch]);
  const setStatusFilter = useCallback((value: string) => {
    dispatch(setDashboardStatusFilter(value));
  }, [dispatch]);
  const setBundlesPerPage = useCallback((value: number) => {
    dispatch(setDashboardBundlesPerPage(value));
  }, [dispatch]);
  const setCurrentPage = useCallback((value: number | ((currentPage: number) => number)) => {
    const nextPage = typeof value === "function" ? value(currentPage) : value;
    dispatch(setDashboardCurrentPage(nextPage));
  }, [currentPage, dispatch]);
  const [activeResource, setActiveResource] = useState<string>('bundle-inspirations');
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
    if (
      typeof data === "object" &&
      data !== null &&
      "success" in data &&
      data.success === true &&
      "locale" in data &&
      typeof data.locale === "string"
    ) {
      const locale = normalizeAdminLocale(data.locale);
      if (!shouldApplyDashboardLocaleSave(locale, lastAppliedLocaleSaveRef.current)) return;
      lastAppliedLocaleSaveRef.current = locale;
      localStorage.setItem("wolfpack-locale", locale);
      if (normalizeAdminLocale(i18n.language) !== locale) {
        void i18n.changeLanguage(locale);
      }
      const nextParams = buildDashboardLocaleSearchParams(searchParams, locale);
      if (nextParams) setSearchParams(nextParams, { replace: true });
      shopify.toast.show(t("dashboard.language.saveSuccess"));
      return;
    }
    shopify.toast.show(t("dashboard.language.saveError"), { isError: true });
  }, [i18n, localeFetcher.data, localeFetcher.state, searchParams, setSearchParams, shopify, t]);

  useEffect(() => {
    setSelectedLanguage(normalizeAdminLocale(i18n.language));
  }, [i18n.language]);

  useEffect(() => {
    const nextParams = buildDashboardLocaleSearchParams(searchParams, activeLanguage);
    if (!nextParams) return;
    setSearchParams(nextParams, { replace: true });
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
      if (val) setBundlesPerPage(Number(val));
    };
    el.addEventListener('change', handler);
    return () => el.removeEventListener('change', handler);
  }, [setBundlesPerPage]);

  useEffect(() => {
    const el = statusChoiceListRef.current;
    if (!el) return;
    const handler = (e: Event) => {
      const values = (e.currentTarget as any).values;
      if (Array.isArray(values) && values.length > 0) {
        setStatusFilter(values[0]);
        statusPopoverRef.current?.hideOverlay?.();
      }
    };
    el.addEventListener('change', handler);
    return () => el.removeEventListener('change', handler);
  }, [setStatusFilter]);

  useEffect(() => {
    const el = typeChoiceListRef.current;
    if (!el) return;
    const handler = (e: Event) => {
      const values = (e.currentTarget as any).values;
      if (Array.isArray(values) && values.length > 0) {
        setTypeFilter(values[0]);
        typePopoverRef.current?.hideOverlay?.();
      }
    };
    el.addEventListener('change', handler);
    return () => el.removeEventListener('change', handler);
  }, [setTypeFilter]);

  useEffect(() => {
    const el = searchRef.current;
    if (!el) return;
    const handler = (e: Event) => {
      setBundleFilter((e.target as HTMLInputElement).value ?? '');
    };
    el.addEventListener('input', handler);
    return () => el.removeEventListener('input', handler);
  }, [setBundleFilter]);

  const handleSyncCollections = useCallback(() => {
    shopify.toast.show(t("dashboard.header.syncCollections"));
  }, [shopify, t]);

  const handleBellClick = useCallback(() => {
    navigate('/app/events');
  }, [navigate]);

  const handleAppEmbedCardClick = useCallback(() => {
    if (themeEditorUrl) {
      openThemeEditorInNewTab(themeEditorUrl);
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
  const dashboardMediaState = getDashboardMediaState({
    isHydrated: hasHydratedDashboardMedia,
  });
  const renderResourceCard = shouldRenderDashboardResourceCard({
    hasMainContentSettled,
  });

  return (
    <>
      {renderDeleteModal && (
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
      )}

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

          {/* Banners - deferred with a fixed-height CLS guard. */}
          <Suspense fallback={<DashboardBannerSkeleton />}>
            <Await resolve={banners}>
              {(b) => (
                <>
                  {!b.proxyHealthy && <ProxyHealthBanner shop={shop} appUrl={appUrl} />}
                </>
              )}
            </Await>
          </Suspense>

          <DashboardTopCards
            handleDirectChat={handleDirectChat}
            handleAppEmbedCardClick={handleAppEmbedCardClick}
            loadAppEmbedImage={dashboardMediaState.loadAppEmbedImage}
          />

          {/* Bundles panel */}
          <s-section padding="none">
            <div className={dashboardStyles.bundlesPanel}>
              <div className={dashboardStyles.bundlesToolbar}>
                <div className={dashboardStyles.filterGroup}>
                  {/* Status filter pill */}
                  <s-button id="status-filter-btn" commandFor="status-filter-popover" variant="secondary">
                    {String(statusFilter === 'all' ? t("dashboard.filters.status") : t(`dashboard.status.${statusFilter}`, statusFilter))} ▾
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
                  <div className={dashboardStyles.bundleMetaGroup}>
                    <span>{t("dashboard.table.status")}</span>
                    <span>{t("dashboard.table.type")}</span>
                    <span>{t("dashboard.table.actions")}</span>
                  </div>
                </div>

                {bundles.length === 0 ? (
                  <div className={dashboardStyles.emptyBundlesState}>
                    <div className={dashboardStyles.emptyBundlesIcon}>
                      <OptimisedImage
                        src="/bundle.avif"
                        alt=""
                        className={dashboardStyles.emptyBundlesImg}
                        width={120}
                        height={120}
                        loading="lazy"
                      />
                    </div>
                    <s-stack direction="block" gap="small" alignItems="center">
                      <s-button variant="primary" onClick={() => navigate('/app/bundles/create')}>
                        {t("dashboard.header.createBundle")}
                      </s-button>
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
                        <div className={dashboardStyles.bundleMetaGroup}>
                          <span className={dashboardStyles.bundleTableCell}>{getStatusDisplay(bundle.status)}</span>
                          <span className={dashboardStyles.bundleTableCell}>{getBundleTypeDisplay(bundle.bundleType)}</span>
                          <span className={dashboardStyles.bundleTableCell}>
                            <BundleActionsButtons
                              bundleId={bundle.id}
                              bundleType={bundle.bundleType}
                              bundle={bundle}
                              isEditing={editingBundleId === bundle.id}
                              onEdit={handleEditBundle}
                              onClone={handleCloneBundle}
                              onDelete={handleDeleteBundle}
                              onPreview={handlePreviewBundle}
                              activeActionMenuBundleId={activeActionMenuBundleId}
                              onActionMenuRequest={setActiveActionMenuBundleId}
                              isPreviewing={previewingBundleId === bundle.id}
                            />
                          </span>
                        </div>
                      </div>
                    ))}

                    {filteredBundles.length === 0 && (
                      <div className={dashboardStyles.noFilteredBundles}>
                        {t("dashboard.noResults")}
                      </div>
                    )}

                    {filteredBundles.length > 0 && (
                      <div className={dashboardStyles.paginationBar}>
                        <span className={dashboardStyles.paginationSpacer} />
                        <div className={dashboardStyles.paginationControls}>
                          <span className={dashboardStyles.paginationArrow}>
                            <s-button
                              variant="tertiary"
                              disabled={effectivePage <= 1 || undefined}
                              onClick={() => setCurrentPage(p => p - 1)}
                              accessibilityLabel={t("dashboard.pagination.prev")}
                            >
                              ‹
                            </s-button>
                          </span>
                          <span className={dashboardStyles.paginationPageText}>
                            {t("dashboard.pagination.page", { current: effectivePage, total: totalPages })}
                          </span>
                          <span className={dashboardStyles.paginationArrow}>
                            <s-button
                              variant="tertiary"
                              disabled={effectivePage >= totalPages || undefined}
                              onClick={() => setCurrentPage(p => p + 1)}
                              accessibilityLabel={t("dashboard.pagination.next")}
                            >
                              ›
                            </s-button>
                          </span>
                        </div>
                        <div className={dashboardStyles.perPageControls}>
                          <span>{t("dashboard.pagination.perPageLabel")}</span>
                          <div className={dashboardStyles.perPageSelectWrap}>
                            <s-select
                              ref={perPageSelectRef}
                              label={t("dashboard.pagination.perPageLabel")}
                              labelAccessibilityVisibility="exclusive"
                              value={String(bundlesPerPage)}
                            >
                              <s-option value="10">{t("dashboard.pagination.per10")}</s-option>
                              <s-option value="20">{t("dashboard.pagination.per20")}</s-option>
                              <s-option value="50">{t("dashboard.pagination.per50")}</s-option>
                            </s-select>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </s-section>

          {/* Resources card */}
          {renderResourceCard && (
            <Suspense fallback={null}>
              <DashboardResourcesCard
                activeResource={activeResource}
                setActiveResource={setActiveResource}
                handleDirectChat={handleDirectChat}
              />
            </Suspense>
          )}

        </div>
      </div>

      {renderPreviewModal && (
        <Suspense fallback={null}>
          <EnablePreviewModal {...enablePreviewGate.modalProps} />
        </Suspense>
      )}
    </>
  );
}
