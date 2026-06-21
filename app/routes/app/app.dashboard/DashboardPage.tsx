import { Await, useFetcher, useNavigate, useLoaderData, useSearchParams } from "@remix-run/react";
import { useCallback, useRef, useEffect, useMemo, useState, Suspense } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useTranslation } from "react-i18next";
import { OptimisedImage } from "../../../components/OptimisedImage";
import { ProxyHealthBanner } from "../../../components/ProxyHealthBanner";
import { DashboardBannerSkeleton } from "../../../components/skeletons/DashboardBannerSkeleton";
import { useDashboardState } from "../../../hooks/useDashboardState";
import { getBundleWizardConfigurePath, getBundleEditPath } from "../../../lib/bundle-navigation";
import { decideDashboardPreviewAction } from "../../../lib/dashboard-preview-action";
import { EnablePreviewModal } from "../../../components/EnablePreviewModal";
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
import { BundleActionsButtons } from "./BundleActionsButtons";
import { DashboardResourcesCard } from "./DashboardResourcesCard";
import { DashboardTopCards } from "./DashboardTopCards";
import dashboardStyles from "./dashboard.module.css";

const STATUS_TONE_MAP = { active: 'success', draft: 'info', unlisted: 'warning' } as const;

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
    if ("success" in data && data.success && "locale" in data) {
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

          <DashboardTopCards parthImageLoaded={parthImageLoaded} setParthImageLoaded={setParthImageLoaded} handleDirectChat={handleDirectChat} handleAppEmbedCardClick={handleAppEmbedCardClick} />

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
          <DashboardResourcesCard activeResource={activeResource} setActiveResource={setActiveResource} handleDirectChat={handleDirectChat} />

        </div>
      </div>

      <EnablePreviewModal {...enablePreviewGate.modalProps} />
    </>
  );
}
