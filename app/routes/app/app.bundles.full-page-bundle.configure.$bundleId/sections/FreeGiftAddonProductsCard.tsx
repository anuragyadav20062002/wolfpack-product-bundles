import type { ConfigureBundleFlowContext } from "../useConfigureBundleFlow";
import { FpbAddonTierEditor } from "./FreeGiftAddonTierEditor";

export function FpbAddonProductsCard({
  flow,
}: {
  flow: ConfigureBundleFlowContext;
}) {
  const {
    addonDraft,
    ADDONS_HELP_ARTICLE_URL,
    fullPageBundleStyles,
    openAddonSectionMultiLanguageModal,
    updateAddonDraft,
  } = flow;

  return (
    <>
      <div
        className={`${fullPageBundleStyles.card} ${fullPageBundleStyles.addonsCard}`}
      >
        <div className={fullPageBundleStyles.addonsHeaderLine}>
          <div className={fullPageBundleStyles.addonsTitleCluster}>
            <h3 className={fullPageBundleStyles.panelTitle}>
              Add-Ons with Bundles
            </h3>
            <label
              className={`${fullPageBundleStyles.addonsSwitch} ${fullPageBundleStyles.addonsReferenceSwitch}`}
            >
              <input
                type="checkbox"
                aria-label="Enable add-ons with bundles"
                checked={addonDraft.addonProductsEnabled === true}
                onChange={(e) => {
                  updateAddonDraft({
                    addonProductsEnabled: (e.target as HTMLInputElement)
                      .checked,
                  });
                }}
              />
              <span />
            </label>
            <button
              type="button"
              className={fullPageBundleStyles.addonsHelpButton}
              onClick={() => window.open(ADDONS_HELP_ARTICLE_URL, "_blank")}
            >
              How to setup?
            </button>
          </div>
          <div className={fullPageBundleStyles.addonsHeaderActions}>
            <s-button
              variant="secondary"
              icon="globe"
              onClick={openAddonSectionMultiLanguageModal}
            >
              Multi Language
            </s-button>
          </div>
        </div>
        <p className={fullPageBundleStyles.panelDescription}>
          Enable customers to add extra items to their bundles at a discounted
          price, for free, or at full price.
        </p>
        <div className={fullPageBundleStyles.addonsFormStack}>
          <s-text-field
            label="Add on Section title"
            value={addonDraft.addonProductsTitle ?? ""}
            onInput={(e) => {
              updateAddonDraft({
                addonProductsTitle: (e.target as HTMLInputElement).value,
              });
            }}
            autocomplete="off"
          />
          <FpbAddonTierEditor flow={flow} />
        </div>
      </div>
    </>
  );
}
