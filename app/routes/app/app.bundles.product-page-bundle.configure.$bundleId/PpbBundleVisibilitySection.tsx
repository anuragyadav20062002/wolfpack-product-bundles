import type React from "react";
import { usePpbConfigureContext } from "./PpbConfigureContext";

export function PpbBundleVisibilitySection() {
  const {
    activeSection,
    appEmbedEnabled,
    bundle,
    handleSectionChange,
    productPageBundleStyles,
    shop,
    shopify,
    themeEditorUrl,
  } = usePpbConfigureContext();

  return (
    <>
      {activeSection === "bundle_visibility" && (
        <div data-tour-target="ppb-bundle-visibility">
          <div className={productPageBundleStyles.visibilityOverviewStack}>
            <div className={productPageBundleStyles.visibilityOverviewCard}>
              <div className={productPageBundleStyles.visibilityCardHeaderRow}>
                <div>
                  <h3 className={productPageBundleStyles.visibilityCardTitle}>
                    App Embed Status
                  </h3>
                  <p className={productPageBundleStyles.visibilityCardText}>
                    {appEmbedEnabled
                      ? "Your store is connected and ready. Your bundle can now render on your storefront."
                      : "Enable the Theme app extension for Wolfpack Bundles to place and preview the bundle."}
                  </p>
                </div>
                <div
                  className={
                    appEmbedEnabled
                      ? productPageBundleStyles.visibilityStatusEnabled
                      : productPageBundleStyles.visibilityStatusWarning
                  }
                >
                  {appEmbedEnabled ? "Enabled" : "Not enabled"}
                </div>
              </div>
              {!appEmbedEnabled && themeEditorUrl && (
                <button
                  type="button"
                  className={productPageBundleStyles.visibilitySecondaryAction}
                  onClick={() => window.open(themeEditorUrl, "_blank")}
                >
                  Enable here
                </button>
              )}
            </div>
            <div className={productPageBundleStyles.visibilityOverviewCard}>
              <div className={productPageBundleStyles.visibilitySectionIntro}>
                <h3 className={productPageBundleStyles.visibilityCardTitle}>
                  Publishing Best Practices
                </h3>
                <p className={productPageBundleStyles.visibilityCardText}>
                  Pick a placement and follow the quick guide to make your
                  bundle discoverable on your store.
                </p>
              </div>
              <div className={productPageBundleStyles.visibilityGuideGrid}>
                {[
                  {
                    title: "Hero Banner",
                    desc: "Add a button to your homepage hero to drive shoppers directly to your bundle.",
                    img: "/Hero-Banner.png",
                    guide:
                      "Copy your bundle link, open the theme editor, add or select an image banner, set the button label and link, then save.",
                  },
                  {
                    title: "Navigation Menu",
                    desc: "Add your bundle as a nav link so shoppers can find it from anywhere on your store.",
                    img: "/Navigation-Menu.png",
                    guide:
                      "Copy your bundle link, open Content > Menus, add the bundle as a main-menu item, then save the menu.",
                  },
                  {
                    title: "Announcement Banner",
                    desc: "Show your offer in the announcement bar so visitors see it instantly.",
                    img: "/Announcement-Bar.png",
                    guide:
                      "Copy your bundle link, open the theme editor, enable the announcement bar, add offer copy and the bundle link, then save.",
                  },
                  {
                    title: "Featured Product Card",
                    desc: "Feature your bundle product on your homepage so shoppers find it right away.",
                    img: "/Featured-Product-Card.png",
                    guide:
                      "Add the bundle product to a collection, open the theme editor, select Featured Collection, choose that collection, lower the max product count, then save.",
                  },
                ].map(({ title, desc: description, img, guide }) => (
                  <div
                    key={title}
                    className={productPageBundleStyles.visibilityGuideCard}
                  >
                    <div
                      className={productPageBundleStyles.visibilityGuideMedia}
                    >
                      <img src={img} alt={title} />
                    </div>
                    <div
                      className={productPageBundleStyles.visibilityGuideBody}
                    >
                      <h4
                        className={productPageBundleStyles.visibilityGuideTitle}
                      >
                        {title}
                      </h4>
                      <p
                        className={
                          productPageBundleStyles.visibilityGuideDescription
                        }
                      >
                        {description}
                      </p>
                      <div
                        className={
                          productPageBundleStyles.visibilityGuideFooter
                        }
                      >
                        <details>
                          <summary
                            className={
                              productPageBundleStyles.visibilityGuideAction
                            }
                          >
                            Quick Setup Guide
                          </summary>
                          <p
                            className={
                              productPageBundleStyles.visibilityGuideDescription
                            }
                          >
                            {guide}
                          </p>
                        </details>
                        <span
                          className={
                            productPageBundleStyles.visibilitySetupTime
                          }
                        >
                          5 min setup
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className={productPageBundleStyles.visibilityOverviewCard}>
              <div className={productPageBundleStyles.visibilitySectionIntro}>
                <h3 className={productPageBundleStyles.visibilityCardTitle}>
                  Your Bundle Link
                </h3>
                <p className={productPageBundleStyles.visibilityCardText}>
                  Use this link to place your bundle anywhere - theme
                  components, emails, ads, or social bios.
                </p>
              </div>
              {bundle.shopifyProductHandle && shop ? (
                <div className={productPageBundleStyles.visibilityLinkRow}>
                  <input
                    className={productPageBundleStyles.visibilityTextInput}
                    aria-label="Bundle link"
                    value={`https://${shop}/products/${bundle.shopifyProductHandle}`}
                    disabled
                    readOnly
                  />
                  <button
                    type="button"
                    className={
                      productPageBundleStyles.visibilitySecondaryAction
                    }
                    onClick={() => {
                      const url = `https://${shop}/products/${bundle.shopifyProductHandle}`;
                      void navigator.clipboard?.writeText(url);
                      shopify.toast.show("Bundle link copied", {
                        isError: false,
                      });
                    }}
                  >
                    Copy Link
                  </button>
                  <button
                    type="button"
                    className={productPageBundleStyles.visibilityPlainAction}
                    onClick={() =>
                      window.open(
                        `https://${shop}/products/${bundle.shopifyProductHandle}`,
                        "_blank",
                      )
                    }
                  >
                    View on Storefront
                  </button>
                </div>
              ) : (
                <p className={productPageBundleStyles.visibilityCardText}>
                  Bundle product not yet linked.
                </p>
              )}
            </div>
            <div className={productPageBundleStyles.visibilityOverviewCard}>
              <h3 className={productPageBundleStyles.visibilityCardTitle}>
                Want more placement options?
              </h3>
              <div className={productPageBundleStyles.visibilitySetupPanel}>
                <div>
                  <h4 className={productPageBundleStyles.visibilitySetupTitle}>
                    Bundle Widget
                  </h4>
                  <p className={productPageBundleStyles.visibilityCardText}>
                    This will display an upsell block or button on the product
                    pages of your choice.
                  </p>
                </div>
                <button
                  type="button"
                  className={productPageBundleStyles.visibilityPrimaryAction}
                  onClick={() => handleSectionChange("bundle_widget")}
                >
                  Set up Bundle Widget
                </button>
              </div>
              <div className={productPageBundleStyles.visibilitySetupPanel}>
                <div>
                  <h4 className={productPageBundleStyles.visibilitySetupTitle}>
                    Bundle Embed
                  </h4>
                  <p className={productPageBundleStyles.visibilityCardText}>
                    Directly embed the Bundle Builder block on product pages so
                    customers can curate bundles there.
                  </p>
                </div>
                <button
                  type="button"
                  className={productPageBundleStyles.visibilitySecondaryAction}
                  onClick={() => handleSectionChange("bundle_embed")}
                >
                  Set up Bundle Embed
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
