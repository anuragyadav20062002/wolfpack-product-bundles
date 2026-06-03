import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { requireAdminSession } from "../../../lib/auth-guards.server";
import { handleCreateBundle } from "../app.dashboard/handlers/handlers.server";
import { BundleType } from "../../../constants/bundle";
import { showPolarisModal } from "../_shared/bundle-configure/modal-utils";
import styles from "./create-bundle.module.css";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireAdminSession(request);
  return json({});
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await requireAdminSession(request);
  const formData = await request.formData();
  const bundleName = formData.get("bundleName");
  const bundleType = formData.get("bundleType");
  const createFormData = new FormData();
  if (typeof bundleName === "string") createFormData.set("bundleName", bundleName);
  if (typeof bundleType === "string") createFormData.set("bundleType", bundleType);
  const result = await handleCreateBundle(admin, session, createFormData);
  const data = await result.json();
  if (data.success && data.redirectTo) {
    if (!data.showFirstLoadTour) {
      return redirect(data.redirectTo);
    }
    const separator = String(data.redirectTo).includes("?") ? "&" : "?";
    return redirect(`${data.redirectTo}${separator}first_load=true`);
  }
  return json(data, { status: result.status });
};

export default function CreateBundleWizard() {
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
        <button variant="breadcrumb" onClick={() => window.history.back()}>
          {t("createBundle.dashboard")}
        </button>
      </ui-title-bar>

      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <div className={styles.pageHeaderLeft}>
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
                    <img src="/ppb.png" alt={t("createBundle.bundleType.productPage.alt")} className={styles.bundleThumbnailImg} />
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
                    <img src="/fpb.png" alt={t("createBundle.bundleType.fullPage.alt")} className={styles.bundleThumbnailImg} />
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
