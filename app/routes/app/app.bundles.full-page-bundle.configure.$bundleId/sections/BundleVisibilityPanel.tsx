import type { ConfigureBundleFlowContext } from "../useConfigureBundleFlow";

export function FpbBundleVisibilityPanel({
  flow,
}: {
  flow: ConfigureBundleFlowContext;
}) {
  const {
    activeSection,
    appEmbedEnabled,
    bundle,
    bundlePageUrl,
    fullPageBundleStyles,
    handleAddToStorefront,
    handleSectionChange,
    isInstallingWidget,
    markAsDirty,
    openThemeEditorForAppEmbed,
    pageSlug,
    pageSlugError,
    setHasManuallyEditedSlug,
    setPageSlug,
    shopify,
    slugify,
    themeEditorUrl,
  } = flow;

  return (
    <>
      {activeSection === "bundle_visibility" && (
        <div className={fullPageBundleStyles.visibilityOverviewStack}>
          <div className={fullPageBundleStyles.visibilityOverviewCard}>
            <div className={fullPageBundleStyles.visibilityCardHeaderRow}>
              <div>
                <h3 className={fullPageBundleStyles.visibilityCardTitle}>
                  App Embed Status
                </h3>
                <p className={fullPageBundleStyles.visibilityCardText}>
                  {appEmbedEnabled
                    ? "Your store is connected and ready. Your bundle can now render on your storefront."
                    : "Enable the Theme app extension for Wolfpack Bundles to place and preview the bundle."}
                </p>
              </div>
              <div
                className={
                  appEmbedEnabled
                    ? fullPageBundleStyles.visibilityStatusEnabled
                    : fullPageBundleStyles.visibilityStatusWarning
                }
              >
                {appEmbedEnabled ? "Enabled" : "Disabled"}
              </div>
            </div>
            {!appEmbedEnabled && themeEditorUrl && (
              <button
                type="button"
                className={fullPageBundleStyles.visibilitySecondaryAction}
                onClick={openThemeEditorForAppEmbed}
              >
                Enable Here
              </button>
            )}
          </div>
          <div className={fullPageBundleStyles.visibilityOverviewCard}>
            <div className={fullPageBundleStyles.visibilitySectionIntro}>
              <h3 className={fullPageBundleStyles.visibilityCardTitle}>
                Publishing Best Practices
              </h3>
              <p className={fullPageBundleStyles.visibilityCardText}>
                Pick a placement and follow the quick guide to make your bundle
                discoverable on your store.
              </p>
            </div>
            <div className={fullPageBundleStyles.visibilityGuideGrid}>
              {[
                {
                  title: "Hero Banner",
                  desc: "Add a button to your homepage hero to drive shoppers directly to your bundle.",
                  img: "/Hero-Banner.avif",
                  guide:
                    "Copy your bundle link, open the theme editor, add or select an image banner, set the button label and link, then save.",
                },
                {
                  title: "Navigation Menu",
                  desc: "Add your bundle as a nav link so shoppers can find it from anywhere on your store.",
                  img: "/Navigation-Menu.avif",
                  guide:
                    "Copy your bundle link, open Content > Menus, add the bundle as a main-menu item, then save the menu.",
                },
                {
                  title: "Announcement Banner",
                  desc: "Show your offer in the announcement bar so visitors see it instantly.",
                  img: "/Announcement-Bar.avif",
                  guide:
                    "Copy your bundle link, open the theme editor, enable the announcement bar, add offer copy and the bundle link, then save.",
                },
                {
                  title: "Featured Product Card",
                  desc: "Feature your bundle product on your homepage so shoppers find it right away.",
                  img: "/Featured-Product-Card.avif",
                  guide:
                    "Add the bundle product to a collection, open the theme editor, select Featured Collection, choose that collection, lower the max product count, then save.",
                },
              ].map(({ title, desc: description, img, guide }) => (
                <div
                  key={title}
                  className={fullPageBundleStyles.visibilityGuideCard}
                >
                  <div className={fullPageBundleStyles.visibilityGuideMedia}>
                    <img src={img} alt={title} />
                  </div>
                  <div className={fullPageBundleStyles.visibilityGuideBody}>
                    <h4 className={fullPageBundleStyles.visibilityGuideTitle}>
                      {title}
                    </h4>
                    <p
                      className={
                        fullPageBundleStyles.visibilityGuideDescription
                      }
                    >
                      {description}
                    </p>
                    <div className={fullPageBundleStyles.visibilityGuideFooter}>
                      <details>
                        <summary
                          className={fullPageBundleStyles.visibilityGuideAction}
                        >
                          Quick Setup Guide
                        </summary>
                        <p
                          className={
                            fullPageBundleStyles.visibilityGuideDescription
                          }
                        >
                          {guide}
                        </p>
                      </details>
                      <span
                        className={fullPageBundleStyles.visibilitySetupTime}
                      >
                        5 min setup
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className={fullPageBundleStyles.visibilityOverviewCard}>
            <div className={fullPageBundleStyles.visibilitySectionIntro}>
              <h3 className={fullPageBundleStyles.visibilityCardTitle}>
                Your Bundle Link
              </h3>
              <p className={fullPageBundleStyles.visibilityCardText}>
                Use this link to place your bundle anywhere - theme components,
                emails, ads, or social bios.
              </p>
            </div>
            <div className={fullPageBundleStyles.visibilityLinkRow}>
              <input
                className={fullPageBundleStyles.visibilityTextInput}
                aria-label="Bundle link"
                value={bundlePageUrl}
                disabled
                readOnly
              />
              {bundle.shopifyPageHandle && (
                <>
                  <button
                    type="button"
                    className={fullPageBundleStyles.visibilitySecondaryAction}
                    onClick={() => {
                      void navigator.clipboard?.writeText(bundlePageUrl);
                      shopify.toast.show("Bundle link copied", {
                        isError: false,
                      });
                    }}
                  >
                    Copy Link
                  </button>
                  <button
                    type="button"
                    className={fullPageBundleStyles.visibilityPlainAction}
                    onClick={() => window.open(bundlePageUrl, "_blank")}
                  >
                    View on Storefront
                  </button>
                </>
              )}
              {!bundle.shopifyPageHandle && (
                <button
                  type="button"
                  className={fullPageBundleStyles.visibilityPrimaryAction}
                  onClick={handleAddToStorefront}
                  disabled={Boolean(pageSlugError) || isInstallingWidget}
                >
                  {isInstallingWidget ? "Creating..." : "Create Page"}
                </button>
              )}
            </div>
            <label className={fullPageBundleStyles.visibilityFieldLabel}>
              <span>Page URL slug</span>
              <input
                className={fullPageBundleStyles.visibilityTextInput}
                value={pageSlug}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setPageSlug(e.target.value);
                  setHasManuallyEditedSlug(true);
                  markAsDirty();
                }}
                onBlur={() => setPageSlug(slugify(pageSlug))}
              />
            </label>
            {pageSlugError && (
              <p className={fullPageBundleStyles.visibilityCardText}>
                {pageSlugError}
              </p>
            )}
          </div>
          <div className={fullPageBundleStyles.visibilityOverviewCard}>
            <h3 className={fullPageBundleStyles.visibilityCardTitle}>
              Want more placement options?
            </h3>
            <div className={fullPageBundleStyles.visibilitySetupPanel}>
              <div>
                <h4 className={fullPageBundleStyles.visibilitySetupTitle}>
                  Bundle Widget
                </h4>
                <p className={fullPageBundleStyles.visibilityCardText}>
                  This will display an upsell block or button on the product
                  pages of your choice.
                </p>
              </div>
              <button
                type="button"
                className={fullPageBundleStyles.visibilityPrimaryAction}
                onClick={() => handleSectionChange("bundle_widget")}
              >
                Set up Bundle Widget
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
