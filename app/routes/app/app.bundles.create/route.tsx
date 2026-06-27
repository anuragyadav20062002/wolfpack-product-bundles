import { json, redirect, type ActionFunctionArgs, type HeadersFunction, type LinksFunction, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useNavigate, useNavigation } from "@remix-run/react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { requireAdminSession } from "../../../lib/auth-guards.server";
import { handleCreateBundle } from "../app.dashboard/handlers/handlers.server";
import { BundleType } from "../../../constants/bundle";
import { showPolarisModal } from "../_shared/bundle-configure/modal-utils";
import styles from "./create-bundle.module.css";
import { OptimisedImage } from "../../../components/OptimisedImage";
import { ensureShopIdentity, recordBusinessEvent } from "../../../services/app-events.server";
import { getCachedSubscriptionInfo, getSubscriptionInfoFromCache } from "../../../services/subscription-cache.server";

export const links: LinksFunction = () => [
  {
    rel: "preload",
    as: "image",
    href: "/ppb.avif",
    imageSrcSet: "/ppb.avif 320w",
    imageSizes: "320px",
    type: "image/avif",
    fetchpriority: "high",
  } as ReturnType<LinksFunction>[number],
  {
    rel: "preload",
    as: "image",
    href: "/fpb.avif",
    imageSrcSet: "/fpb.avif 320w",
    imageSizes: "320px",
    type: "image/avif",
    fetchpriority: "high",
  } as ReturnType<LinksFunction>[number],
];

export const headers: HeadersFunction = () => ({
  Link: [
    "</ppb.avif>; rel=preload; as=image; type=image/avif; fetchpriority=high",
    "</fpb.avif>; rel=preload; as=image; type=image/avif; fetchpriority=high",
  ].join(", "),
});

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireAdminSession(request);
  return json({});
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await requireAdminSession(request);
  const shopifyShopGid = await ensureShopIdentity(admin, session.shop);
  const formData = await request.formData();
  const bundleName = formData.get("bundleName");
  const bundleType = formData.get("bundleType");
  const createFormData = new FormData();
  if (typeof bundleName === "string") createFormData.set("bundleName", bundleName);
  if (typeof bundleType === "string") createFormData.set("bundleType", bundleType);
  await recordBusinessEvent({
    eventHandle: "bundle_create_started",
    shopDomain: session.shop,
    shopifyShopGid,
    bundleType: typeof bundleType === "string" ? bundleType : null,
    surface: "admin",
    actor: "merchant",
    routeFamily: "create",
    attributes: {
      entry_point: "create_route",
    },
  });
  const cachedSubscriptionInfo = getCachedSubscriptionInfo(session.shop);
  const subscriptionInfo = cachedSubscriptionInfo !== undefined
    ? cachedSubscriptionInfo
    : await getSubscriptionInfoFromCache(session.shop);
  if (
    subscriptionInfo &&
    subscriptionInfo.currentBundleCount >= subscriptionInfo.bundleLimit
  ) {
    await recordBusinessEvent({
      eventHandle: "pricing_limit_hit",
      shopDomain: session.shop,
      shopifyShopGid,
      bundleType: typeof bundleType === "string" ? bundleType : null,
      surface: "admin",
      actor: "merchant",
      routeFamily: "create",
      result: "failure",
      attributes: {
        limit_key: "bundles",
        plan: subscriptionInfo.plan,
        current_value: subscriptionInfo.currentBundleCount,
        limit_value: subscriptionInfo.bundleLimit,
      },
    });
  }
  const result = await handleCreateBundle(admin, session, createFormData);
  const data = (await result.json()) as {
    error?: string;
    bundleId?: string;
    redirectTo?: string;
    showFirstLoadTour?: boolean;
    success?: boolean;
  };
  if (data.success && data.redirectTo) {
    await recordBusinessEvent({
      eventHandle: "bundle_created",
      shopDomain: session.shop,
      shopifyShopGid,
      bundleId: data.bundleId ?? null,
      bundleType: typeof bundleType === "string" ? bundleType : null,
      surface: "admin",
      actor: "merchant",
      routeFamily: "create",
      result: "success",
      attributes: {
        template_id: typeof bundleType === "string" ? bundleType : null,
      },
    });
    if (!data.showFirstLoadTour) {
      return redirect(data.redirectTo);
    }
    const separator = String(data.redirectTo).includes("?") ? "&" : "?";
    return redirect(`${data.redirectTo}${separator}first_load=true`);
  }
  await recordBusinessEvent({
    eventHandle: "bundle_create_failed",
    shopDomain: session.shop,
    shopifyShopGid,
    bundleType: typeof bundleType === "string" ? bundleType : null,
    surface: "admin",
    actor: "merchant",
    routeFamily: "create",
    result: "failure",
    errorCode: "create_failed",
    attributes: {
      error_message_safe: data.error ?? "Bundle creation failed",
    },
  });
  return json(data, { status: result.status });
};

export default function CreateBundleWizard() {
  const navigate = useNavigate();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const isSubmitting = navigation.state === "submitting";

  const [bundleType, setBundleType] = useState<string | null>(null);
  const [bundleTypeError, setBundleTypeError] = useState<string | null>(null);
  const [bundleNameError, setBundleNameError] = useState<string | null>(null);

  const bundleNameRef = useRef<any>(null);
  const nameModalRef = useRef<any>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const [bundleName, setBundleName] = useState("");

  useEffect(() => {
    const el = bundleNameRef.current;
    if (!el) return;
    const handler = (e: Event) => setBundleName((e.target as HTMLInputElement).value ?? "");
    el.addEventListener("input", handler);
    return () => el.removeEventListener("input", handler);
  }, []);

  const serverError = actionData && "error" in actionData ? String(actionData.error) : null;

  useEffect(() => {
    if (serverError) showPolarisModal(nameModalRef);
  }, [serverError]);

  const handleBackToDashboard = useCallback(() => {
    navigate("/app/dashboard", { replace: true });
  }, [navigate]);

  const handleSelectBundleType = useCallback((type: string) => {
    setBundleType(type);
    setBundleTypeError(null);
  }, []);

  const handleBundleNameInput = useCallback((e: Event) => {
    setBundleName((e.target as HTMLInputElement).value ?? "");
  }, []);

  const handleContinue = useCallback(() => {
    if (!bundleType) {
      setBundleTypeError(t("createBundle.validation.required"));
      return;
    }
    showPolarisModal(nameModalRef);
  }, [bundleType, t]);

  const handleSaveName = useCallback(() => {
    const name = bundleName.trim();
    if (!name) {
      setBundleNameError(t("createBundle.validation.required"));
      bundleNameRef.current?.focus?.();
      return;
    }
    if (name.length < 3) {
      setBundleNameError(t("createBundle.validation.minLength"));
      bundleNameRef.current?.focus?.();
      return;
    }
    setBundleNameError(null);
    submitButtonRef.current?.click();
  }, [bundleName, t]);

  return (
    <>
      <ui-title-bar title={t("createBundle.title")}>
        <button
          variant="breadcrumb"
          onClick={handleBackToDashboard}
        >
          {t("createBundle.dashboard")}
        </button>
      </ui-title-bar>

      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <div className={styles.pageHeaderLeft}>
            <s-button
              variant="tertiary"
              icon="arrow-left"
              accessibilityLabel={t("createBundle.dashboard")}
              onClick={handleBackToDashboard}
            />
            <h1 className={styles.pageTitle}>{t("createBundle.heading")}</h1>
          </div>
          <s-button
            variant="secondary"
            href="https://wolfpackapps.com"
            target="_blank"
          >
            {t("createBundle.help")}
          </s-button>
        </div>

        <div className={styles.formContent}>
            <div className={styles.formSection}>
              {bundleTypeError && <p className={styles.errorText}>{bundleTypeError}</p>}
              <div className={styles.bundleTypeGrid}>
                <div
                  className={`${styles.bundleTypeCard} ${bundleType === BundleType.PRODUCT_PAGE ? styles.bundleTypeCardSelected : ""}`}
                  onClick={() => handleSelectBundleType(BundleType.PRODUCT_PAGE)}
                >
                  <div className={styles.bundleThumbnailWrap}>
                    <OptimisedImage
                      src="/ppb.png"
                      alt={t("createBundle.bundleType.productPage.alt")}
                      className={styles.bundleThumbnailImg}
                      width={320}
                      height={200}
                      loading="eager"
                      fetchPriority="high"
                    />
                  </div>
                  <div className={styles.bundleCardBody}>
                    <div className={styles.bundleCardText}>
                      <strong>{t("createBundle.bundleType.productPage.title")}</strong>
                      <p>{t("createBundle.bundleType.productPage.description")}</p>
                    </div>
                    <s-button
                      variant={bundleType === BundleType.PRODUCT_PAGE ? "primary" : "secondary"}
                      onClick={(e: Event) => { e.stopPropagation(); handleSelectBundleType(BundleType.PRODUCT_PAGE); }}
                    >
                      {bundleType === BundleType.PRODUCT_PAGE ? t("createBundle.actions.selected") : t("createBundle.actions.select")}
                    </s-button>
                  </div>
                </div>

                <div
                  className={`${styles.bundleTypeCard} ${bundleType === BundleType.FULL_PAGE ? styles.bundleTypeCardSelected : ""}`}
                  onClick={() => handleSelectBundleType(BundleType.FULL_PAGE)}
                >
                  <div className={styles.bundleThumbnailWrap}>
                    <OptimisedImage
                      src="/fpb.png"
                      alt={t("createBundle.bundleType.fullPage.alt")}
                      className={styles.bundleThumbnailImg}
                      width={320}
                      height={200}
                      loading="eager"
                      fetchPriority="high"
                    />
                  </div>
                  <div className={styles.bundleCardBody}>
                    <div className={styles.bundleCardText}>
                      <strong>{t("createBundle.bundleType.fullPage.title")}</strong>
                      <p>{t("createBundle.bundleType.fullPage.description")}</p>
                    </div>
                    <s-button
                      variant={bundleType === BundleType.FULL_PAGE ? "primary" : "secondary"}
                      onClick={(e: Event) => { e.stopPropagation(); handleSelectBundleType(BundleType.FULL_PAGE); }}
                    >
                      {bundleType === BundleType.FULL_PAGE ? t("createBundle.actions.selected") : t("createBundle.actions.select")}
                    </s-button>
                  </div>
                </div>
              </div>
            </div>
        </div>

        <s-modal
          ref={nameModalRef}
          id="create-bundle-name-modal"
          heading={bundleType === BundleType.FULL_PAGE
            ? t("createBundle.bundleType.fullPage.title")
            : t("createBundle.bundleType.productPage.title")}
        >
          <Form method="post" className={styles.modalForm}>
            <s-text-field
              ref={bundleNameRef}
              label={t("createBundle.fields.name")}
              name="bundleName"
              placeholder={t("createBundle.fields.namePlaceholder")}
              autocomplete="off"
              onInput={handleBundleNameInput}
              onChange={handleBundleNameInput}
              error={bundleNameError ?? serverError ?? undefined}
            />
            {bundleType && <input type="hidden" name="bundleType" value={bundleType} />}
            <button ref={submitButtonRef} type="submit" style={{ display: "none" }} aria-hidden="true" />
            <div className={styles.modalActions}>
              <s-button
                variant="primary"
                loading={isSubmitting || undefined}
                onClick={handleSaveName}
              >
                Save
              </s-button>
            </div>
          </Form>
        </s-modal>

        <div className={styles.wizardFooter}>
          <s-button
            variant="primary"
            disabled={!bundleType || undefined}
            onClick={handleContinue}
          >
            {t("createBundle.actions.next")}
          </s-button>
        </div>
      </div>
    </>
  );
}
