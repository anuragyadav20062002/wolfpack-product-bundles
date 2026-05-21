import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { useState, useRef, useEffect, useCallback, Fragment } from "react";
import { requireAdminSession } from "../../../lib/auth-guards.server";
import { handleCreateBundle } from "../app.dashboard/handlers/handlers.server";
import { BundleType, FullPageLayout } from "../../../constants/bundle";
import styles from "./create-bundle.module.css";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireAdminSession(request);
  return json({});
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await requireAdminSession(request);
  const formData = await request.formData();
  const result = await handleCreateBundle(admin, session, formData);
  const data = await result.json();
  if (data.success && data.redirectTo) {
    return redirect(data.redirectTo);
  }
  return json(data, { status: result.status });
};

const STEPS = [
  { num: "01", label: "Bundle name\n& Description" },
  { num: "02", label: "Configuration" },
  { num: "03", label: "Pricing" },
  { num: "04", label: "Assets" },
  { num: "05", label: "Pricing Tiers" },
];

export default function CreateBundleWizard() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [bundleType, setBundleType] = useState<string>(BundleType.PRODUCT_PAGE);
  const [fullPageLayout, setFullPageLayout] = useState<string>(FullPageLayout.FOOTER_BOTTOM);
  const [bundleNameError, setBundleNameError] = useState<string | null>(null);

  const bundleNameRef = useRef<any>(null);
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

  const handleSelectBundleType = useCallback((type: string) => {
    setBundleType(type);
    if (type !== BundleType.FULL_PAGE) {
      setFullPageLayout(FullPageLayout.FOOTER_BOTTOM);
    }
  }, []);

  const handleNext = useCallback(() => {
    const name = bundleName.trim();
    if (!name) {
      setBundleNameError("Bundle name is required");
      bundleNameRef.current?.focus?.();
      return;
    }
    if (name.length < 3) {
      setBundleNameError("Bundle name must be at least 3 characters");
      bundleNameRef.current?.focus?.();
      return;
    }
    setBundleNameError(null);
    submitButtonRef.current?.click();
  }, [bundleName]);

  return (
    <>
      <ui-title-bar title="Create Bundle">
        <button variant="breadcrumb" onClick={() => window.history.back()}>
          Dashboard
        </button>
      </ui-title-bar>

      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <div className={styles.pageHeaderLeft}>
            <h1 className={styles.pageTitle}>Select bundle builder type</h1>
          </div>
          <s-button
            variant="secondary"
            href="https://wolfpackapps.com"
            target="_blank"
          >
            How do bundle builder types work?
          </s-button>
        </div>

        <div className={styles.stepIndicator}>
          {STEPS.map((step, idx) => (
            <Fragment key={step.num}>
              {idx > 0 && <div className={styles.stepConnector} />}
              <div className={styles.stepItem}>
                {idx === 0 ? (
                  <>
                    <div className={styles.stepCircleActive}>{step.num}</div>
                    <span className={styles.stepLabelActive}>{step.label}</span>
                  </>
                ) : (
                  <>
                    <span className={styles.stepNumFuture}>{step.num}</span>
                    <span className={styles.stepLabelFuture}>{step.label}</span>
                  </>
                )}
              </div>
            </Fragment>
          ))}
        </div>

        <Form method="post" className={styles.form}>
          <div className={styles.formContent}>
            <div className={styles.fieldsGroup}>
              <s-text-field
                ref={bundleNameRef}
                label="Bundle name"
                name="bundleName"
                placeholder="Eg:- T-shirt bundle"
                autocomplete="off"
                error={bundleNameError ?? serverError ?? undefined}
              />
              <s-text-area
                label="Description"
                name="description"
                placeholder="Eg:- This is a T-shirt bundle"
                rows={3}
                autocomplete="off"
              />
            </div>

            <div className={styles.formSection}>
              <h2 className={styles.sectionTitle}>Bundle Type</h2>
              <div className={styles.bundleTypeGrid}>
                <div
                  className={`${styles.bundleTypeCard} ${bundleType === BundleType.PRODUCT_PAGE ? styles.bundleTypeCardSelected : ""}`}
                  onClick={() => handleSelectBundleType(BundleType.PRODUCT_PAGE)}
                >
                  <div className={styles.bundleThumbnailWrap}>
                    <img src="/pdp.png" alt="Product page bundle" className={styles.bundleThumbnailImg} />
                  </div>
                  <div className={styles.bundleCardBody}>
                    <div className={styles.bundleCardText}>
                      <strong>Product page bundle builder</strong>
                      <p>Display bundle builder on existing product pages (recommended for most stores)</p>
                    </div>
                    <s-button
                      variant={bundleType === BundleType.PRODUCT_PAGE ? "primary" : "secondary"}
                      onClick={(e: Event) => { e.stopPropagation(); handleSelectBundleType(BundleType.PRODUCT_PAGE); }}
                    >
                      {bundleType === BundleType.PRODUCT_PAGE ? "Selected" : "Select"}
                    </s-button>
                  </div>
                </div>

                <div
                  className={`${styles.bundleTypeCard} ${bundleType === BundleType.FULL_PAGE ? styles.bundleTypeCardSelected : ""}`}
                  onClick={() => handleSelectBundleType(BundleType.FULL_PAGE)}
                >
                  <div className={styles.bundleThumbnailWrap}>
                    <img src="/fpb.png" alt="Full page bundle" className={styles.bundleThumbnailImg} />
                  </div>
                  <div className={styles.bundleCardBody}>
                    <div className={styles.bundleCardText}>
                      <strong>Full page bundle builder</strong>
                      <p>Create a dedicated landing page for your bundle with tabs and full customization</p>
                    </div>
                    <s-button
                      variant={bundleType === BundleType.FULL_PAGE ? "primary" : "secondary"}
                      onClick={(e: Event) => { e.stopPropagation(); handleSelectBundleType(BundleType.FULL_PAGE); }}
                    >
                      {bundleType === BundleType.FULL_PAGE ? "Selected" : "Select"}
                    </s-button>
                  </div>
                </div>
              </div>
            </div>

            {bundleType === BundleType.FULL_PAGE && (
              <div className={styles.formSection}>
                <h2 className={styles.sectionTitle}>Page Layout</h2>
                <div className={styles.layoutGrid}>
                  <div
                    className={`${styles.layoutCard} ${fullPageLayout === FullPageLayout.FOOTER_BOTTOM ? styles.layoutCardSelected : ""}`}
                    onClick={() => setFullPageLayout(FullPageLayout.FOOTER_BOTTOM)}
                  >
                    <div className={styles.bundleThumbnailWrap}>
                      <img src="/floatingCardThumbnail.png" alt="Floating card" className={styles.bundleThumbnailImg} />
                    </div>
                    <div className={styles.layoutCardBody}>
                      <strong>Floating card</strong>
                      <s-button
                        variant="secondary"
                        href="https://wolfpackapps.com"
                        target="_blank"
                        onClick={(e: Event) => e.stopPropagation()}
                      >
                        View Demo
                      </s-button>
                    </div>
                  </div>

                  <div
                    className={`${styles.layoutCard} ${fullPageLayout === FullPageLayout.FOOTER_SIDE ? styles.layoutCardSelected : ""}`}
                    onClick={() => setFullPageLayout(FullPageLayout.FOOTER_SIDE)}
                  >
                    <div className={styles.bundleThumbnailWrap}>
                      <img src="/sidePanelThumbnail.png" alt="Side panel" className={styles.bundleThumbnailImg} />
                    </div>
                    <div className={styles.layoutCardBody}>
                      <strong>Side Panel</strong>
                      <s-button
                        variant="secondary"
                        href="https://wolfpackapps.com"
                        target="_blank"
                        onClick={(e: Event) => e.stopPropagation()}
                      >
                        View Demo
                      </s-button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <input type="hidden" name="bundleType" value={bundleType} />
            {bundleType === BundleType.FULL_PAGE && (
              <input type="hidden" name="fullPageLayout" value={fullPageLayout} />
            )}

            <button ref={submitButtonRef} type="submit" style={{ display: "none" }} aria-hidden="true" />
          </div>
        </Form>

        <div className={styles.wizardFooter}>
          <s-button
            variant="primary"
            loading={isSubmitting || undefined}
            onClick={handleNext}
          >
            Next
          </s-button>
        </div>
      </div>
    </>
  );
}
