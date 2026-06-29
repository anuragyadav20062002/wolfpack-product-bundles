import type { ConfigureBundleFlowContext } from "../useConfigureBundleFlow";

export function FpbAddonReferenceStepCard({
  flow,
}: {
  flow: ConfigureBundleFlowContext;
}) {
  const {
    addonDraft,
    FilePicker,
    fullPageBundleStyles,
    openAddonStepMultiLanguageModal,
    setIsDisableAddonStepModalOpen,
    setShowIconPickerForStep,
    showIconPickerForStep,
    updateAddonDraft,
  } = flow;

  return (
    <>
      <div
        className={`${fullPageBundleStyles.card} ${fullPageBundleStyles.addonsReferenceStepCard}`}
      >
        <div className={fullPageBundleStyles.panelHeader}>
          <div className={fullPageBundleStyles.addonsTitleCluster}>
            <h3 className={fullPageBundleStyles.panelTitle}>
              Add-Ons and Gifting Step
            </h3>
            <label
              className={`${fullPageBundleStyles.addonsSwitch} ${fullPageBundleStyles.addonsReferenceSwitch}`}
            >
              <input
                type="checkbox"
                aria-label="Enable add-ons and gifting step"
                checked={addonDraft.isPersonalizationEnabled === true}
                onChange={(e) => {
                  const checked = (e.target as HTMLInputElement).checked;
                  if (checked) {
                    updateAddonDraft({
                      isPersonalizationEnabled: true,
                    });
                  } else {
                    setIsDisableAddonStepModalOpen(true);
                  }
                }}
              />
              <span />
            </label>
          </div>
          <div className={fullPageBundleStyles.addonsHeaderActions}>
            <s-button
              variant="secondary"
              icon="globe"
              onClick={openAddonStepMultiLanguageModal}
            >
              Multi Language
            </s-button>
          </div>
        </div>
        <div
          className={`${fullPageBundleStyles.mediaFieldGrid} ${fullPageBundleStyles.addonsMediaFieldGrid}`}
        >
          <div className={fullPageBundleStyles.addonsIconReplaceGroup}>
            <div className={fullPageBundleStyles.addonsIconColumn}>
              <div className={fullPageBundleStyles.addonsIconBox}>
                {addonDraft.stepImage ? (
                  <img
                    src={addonDraft.stepImage}
                    alt="Add-ons step icon"
                    className={fullPageBundleStyles.iconImg}
                  />
                ) : (
                  <svg
                    className={fullPageBundleStyles.addonsGiftBoxDefault}
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M10 20H38V40C38 42.2 36.2 44 34 44H14C11.8 44 10 42.2 10 40V20Z"
                      fill="#F6F6F7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M7 15H41V22H7V15Z"
                      fill="#FFFFFF"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                    <path d="M24 15V44" stroke="currentColor" strokeWidth="2" />
                    <path d="M7 22H41" stroke="currentColor" strokeWidth="2" />
                    <path
                      d="M24 15C20.7 10.2 17.7 8 15.5 8C13.3 8 11.5 9.8 11.5 12C11.5 14.2 13.3 15 16 15H24Z"
                      fill="#FFFFFF"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M24 15C27.3 10.2 30.3 8 32.5 8C34.7 8 36.5 9.8 36.5 12C36.5 14.2 34.7 15 32 15H24Z"
                      fill="#FFFFFF"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
            </div>
          <button
            type="button"
            className={fullPageBundleStyles.addonsReplaceButton}
            onClick={() => setShowIconPickerForStep("addon-direct")}
          >
            Replace
          </button>
          </div>
          <div className={fullPageBundleStyles.addonsStepTextGroup}>
            <div className={fullPageBundleStyles.addonsStepNameGroup}>
              <s-text-field
                label="Step Name"
                value={addonDraft.personalizeStepText ?? ""}
                placeholder="Add On"
                onInput={(e) => {
                  const value = (e.target as HTMLInputElement).value;
                  updateAddonDraft({ personalizeStepText: value });
                }}
                autocomplete="off"
              />
            </div>
            <div className={fullPageBundleStyles.addonsStepTitleGroup}>
              <s-text-field
                label="Step Title"
                value={addonDraft.personalizePageSubtext ?? ""}
                onInput={(e) => {
                  updateAddonDraft({
                    personalizePageSubtext: (e.target as HTMLInputElement)
                      .value,
                  });
                }}
                autocomplete="off"
              />
            </div>
          </div>
        </div>
        {showIconPickerForStep === "addon-direct" && (
          <div className={fullPageBundleStyles.addonsIconPickerRow}>
            <FilePicker
              autoOpen
              value={addonDraft.stepImage ?? null}
              maxUploadBytes={50 * 1024}
              maxUploadErrorMessage="Please upload a file smaller than 50KB"
              onChange={(url: string | null) => {
                updateAddonDraft({ stepImage: url });
                setShowIconPickerForStep(null);
              }}
              onClose={() => setShowIconPickerForStep(null)}
              label=""
            />
          </div>
        )}
      </div>
    </>
  );
}
