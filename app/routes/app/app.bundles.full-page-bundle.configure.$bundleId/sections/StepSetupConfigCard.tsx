import type { ConfigureBundleFlowContext } from "../useConfigureBundleFlow";

export function FpbStepConfigCard({
  flow,
  step,
}: {
  flow: ConfigureBundleFlowContext;
  step: any;
}) {
  const {
    FilePicker,
    fullPageBundleStyles,
    markAsDirty,
    setShowIconPickerForStep,
    showIconPickerForStep,
    stepsState,
  } = flow;

  return (
    <>
      <div className={fullPageBundleStyles.card}>
        <h3 className={fullPageBundleStyles.stepConfigTitle}>
          Step Config
        </h3>
        <div className={fullPageBundleStyles.stepConfigRow}>
          <div className={fullPageBundleStyles.iconColumn}>
            <div className={fullPageBundleStyles.iconBox}>
              {(step as any).stepImage ? (
                <>
                  <img
                    src={(step as any).stepImage}
                    alt="Step icon"
                    className={fullPageBundleStyles.iconImg}
                  />
                  <button
                    type="button"
                    className={fullPageBundleStyles.iconRemoveButton}
                    aria-label="Remove step icon"
                    onClick={() => {
                      stepsState.updateStepField(step.id, "stepImage", null);
                      setShowIconPickerForStep(null);
                      markAsDirty();
                    }}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 20 20"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M6 6l8 8M14 6l-8 8"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </>
              ) : (
                <div className={fullPageBundleStyles.iconPlaceholder}>
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M20 7l-8-4-8 4m16 0v10l-8 4m-8-4V7m16 5l-8 4-8-4" />
                  </svg>
                </div>
              )}
            </div>
            {showIconPickerForStep === step.id && (
              <FilePicker
                autoOpen
                onClose={() => setShowIconPickerForStep(null)}
                value={(step as any).stepImage ?? null}
                onChange={(url: string | null) => {
                  stepsState.updateStepField(step.id, "stepImage", url);
                  setShowIconPickerForStep(null);
                  markAsDirty();
                }}
                label=""
              />
            )}
            <div className={fullPageBundleStyles.iconUploadButton}>
              <s-button
                onClick={() =>
                  setShowIconPickerForStep((prev: string | null) =>
                    prev === step.id ? null : step.id,
                  )
                }
              >
                {(step as any).stepImage ? "Replace" : "Upload file"}
              </s-button>
            </div>
          </div>
          <div className={fullPageBundleStyles.fieldsColumn}>
            <s-text-field
              label="Step Title"
              placeholder="Eg:- Customized T-shirt Bundle for you"
              value={(step as any).pageTitle ?? ""}
              onInput={(e) => {
                stepsState.updateStepField(
                  step.id,
                  "pageTitle",
                  (e.target as HTMLInputElement).value,
                );
                markAsDirty();
              }}
              autocomplete="off"
            />
          </div>
        </div>
      </div>
    </>
  );
}
