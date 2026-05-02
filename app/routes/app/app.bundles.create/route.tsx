import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { useState, useRef, useEffect, useCallback } from "react";
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
  { num: "01", label: "Bundle name & Description" },
  { num: "02", label: "Configuration" },
  { num: "03", label: "Pricing" },
  { num: "04", label: "Assets" },
  { num: "05", label: "Pricing Tiers" },
];

const FOOTER_BOTTOM_SVG = (
  <svg width="120" height="82" viewBox="0 0 140 96" fill="none" xmlns="http://www.w3.org/2000/svg">
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
);

const FOOTER_SIDE_SVG = (
  <svg width="120" height="82" viewBox="0 0 140 96" fill="none" xmlns="http://www.w3.org/2000/svg">
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
);

export default function CreateBundleWizard() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [bundleType, setBundleType] = useState<string>(BundleType.PRODUCT_PAGE);
  const [fullPageLayout, setFullPageLayout] = useState<string>(FullPageLayout.FOOTER_BOTTOM);
  const [bundleNameError, setBundleNameError] = useState<string | null>(null);

  const bundleNameRef = useRef<any>(null);
  const descriptionRef = useRef<any>(null);
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
          <a
            href="https://wolfpackapps.com"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.helpLink}
          >
            How do bundle builder types work?
          </a>
        </div>

        <div className={styles.stepIndicator}>
          {STEPS.map((step, idx) => (
            <div key={step.num} className={styles.stepItem}>
              {idx > 0 && <div className={idx === 1 ? styles.stepLineActive : styles.stepLine} />}
              <div className={`${styles.stepCircle} ${idx === 0 ? styles.stepCircleActive : styles.stepCircleFuture}`}>
                {step.num}
              </div>
              <span className={`${styles.stepLabel} ${idx === 0 ? styles.stepLabelActive : styles.stepLabelFuture}`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>

        <Form method="post" className={styles.form}>
          <s-stack direction="block" gap="large">
            <s-section>
              <s-stack direction="block" gap="base">
                <s-text-field
                  ref={bundleNameRef}
                  label="Bundle name"
                  name="bundleName"
                  placeholder="Eg:- T-shirt bundle"
                  autocomplete="off"
                  required
                  error={bundleNameError ?? serverError ?? undefined}
                />
                <s-text-area
                  ref={descriptionRef}
                  label="Description"
                  name="description"
                  placeholder="Eg:- This is a T-shirt bundle"
                  rows={3}
                  autocomplete="off"
                />
              </s-stack>
            </s-section>

            <s-section>
              <s-stack direction="block" gap="base">
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Bundle Type</h2>
                </div>
                <div className={styles.bundleTypeGrid}>
                  <div
                    className={`${styles.bundleTypeCard} ${bundleType === BundleType.PRODUCT_PAGE ? styles.bundleTypeCardSelected : ""}`}
                    onClick={() => handleSelectBundleType(BundleType.PRODUCT_PAGE)}
                  >
                    <div className={styles.bundleThumbnailWrap}>
                      <img src="/pdp.jpeg" alt="Product Page Bundle" className={styles.bundleThumbnailImg} />
                    </div>
                    <div className={styles.bundleCardBody}>
                      <div className={styles.bundleCardText}>
                        <strong>Product Page Bundle Builder</strong>
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
                      <img src="/full.jpeg" alt="Full Page Bundle" className={styles.bundleThumbnailImg} />
                    </div>
                    <div className={styles.bundleCardBody}>
                      <div className={styles.bundleCardText}>
                        <strong>Full Page Bundle Builder</strong>
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
              </s-stack>
            </s-section>

            {bundleType === BundleType.FULL_PAGE && (
              <s-section>
                <s-stack direction="block" gap="base">
                  <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Page Layout</h2>
                  </div>
                  <div className={styles.layoutGrid}>
                    <div
                      className={`${styles.layoutCard} ${fullPageLayout === FullPageLayout.FOOTER_BOTTOM ? styles.layoutCardSelected : ""}`}
                      onClick={() => setFullPageLayout(FullPageLayout.FOOTER_BOTTOM)}
                    >
                      <div className={styles.layoutSvgWrap}>{FOOTER_BOTTOM_SVG}</div>
                      <div className={styles.layoutCardBody}>
                        <strong>Floating cart card</strong>
                        <a
                          href="https://wolfpackapps.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.viewDemoLink}
                          onClick={(e) => e.stopPropagation()}
                        >
                          View Demo
                        </a>
                      </div>
                    </div>

                    <div
                      className={`${styles.layoutCard} ${fullPageLayout === FullPageLayout.FOOTER_SIDE ? styles.layoutCardSelected : ""}`}
                      onClick={() => setFullPageLayout(FullPageLayout.FOOTER_SIDE)}
                    >
                      <div className={styles.layoutSvgWrap}>{FOOTER_SIDE_SVG}</div>
                      <div className={styles.layoutCardBody}>
                        <strong>Side Panel</strong>
                        <a
                          href="https://wolfpackapps.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.viewDemoLink}
                          onClick={(e) => e.stopPropagation()}
                        >
                          View Demo
                        </a>
                      </div>
                    </div>
                  </div>
                </s-stack>
              </s-section>
            )}

            <input type="hidden" name="bundleType" value={bundleType} />
            {bundleType === BundleType.FULL_PAGE && (
              <input type="hidden" name="fullPageLayout" value={fullPageLayout} />
            )}

            <button ref={submitButtonRef} type="submit" style={{ display: "none" }} aria-hidden="true" />
          </s-stack>
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
