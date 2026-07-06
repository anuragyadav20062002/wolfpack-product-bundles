import { openThemeEditorInNewTab } from "../../../lib/theme-editor-navigation.client";
import { usePpbConfigureContext } from "./PpbConfigureContext";

export function PpbSelectTemplateDialog() {
  const {
    closeSelectTemplateDialog,
    handleSelectTemplateBackdropClick,
    handleSelectTemplateDialogKeyDown,
    handleTemplateNext,
    handleTemplatePreview,
    isPreviewBundleLoading,
    isSelectTemplateModalOpen,
    pendingDesignPresetId,
    pendingDesignTemplate,
    productPageBundleStyles,
    productPageTemplateOptions,
    selectTemplateDialogRef,
    setPendingDesignPresetId,
    setPendingDesignTemplate,
    setTemplateModalStep,
    templateFetcher,
    templateModalStep,
    templateSaveError,
    themeEditorUrl,
  } = usePpbConfigureContext();

  return (
    <>
      {isSelectTemplateModalOpen && (
        <div
          className={productPageBundleStyles.templateDialogBackdrop}
          role="presentation"
          onMouseDown={handleSelectTemplateBackdropClick}
          onClick={handleSelectTemplateBackdropClick}
        >
          <div
            className={productPageBundleStyles.templateDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ppb-template-dialog-title"
            tabIndex={-1}
            ref={selectTemplateDialogRef}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={handleSelectTemplateDialogKeyDown}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div
              className={productPageBundleStyles.templateDialogHandle}
              aria-hidden="true"
            />
            <div className={productPageBundleStyles.templateDialogHeader}>
              <h2
                id="ppb-template-dialog-title"
                className={productPageBundleStyles.templateDialogHeading}
              >
                Customization
              </h2>
              <button
                type="button"
                className={productPageBundleStyles.templateDialogClose}
                aria-label="Close customization"
                onClick={closeSelectTemplateDialog}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M1 1L13 13M13 1L1 13"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            {templateModalStep === "templates" ? (
              <>
                <div className={productPageBundleStyles.templateDialogBody}>
                  <div className={productPageBundleStyles.templateDialogIntro}>
                    <div>
                      <h3
                        className={
                          productPageBundleStyles.templateDialogSubheading
                        }
                      >
                        Customize your bundle
                      </h3>
                      <p
                        className={
                          productPageBundleStyles.templateDialogDescription
                        }
                      >
                        Choose a design that suits your needs and fits your
                        brand
                      </p>
                    </div>
                    <s-button
                      variant="secondary"
                      onClick={() => setTemplateModalStep("colorsAndCorners")}
                    >
                      Customize Colors &amp; Language
                    </s-button>
                  </div>
                  {templateSaveError ? (
                    <p
                      role="alert"
                      className={productPageBundleStyles.templateDialogError}
                    >
                      {templateSaveError}
                    </p>
                  ) : null}
                  <div className={productPageBundleStyles.templateDialogGrid}>
                    {productPageTemplateOptions.map((templateOption) => {
                      const isSelected =
                        pendingDesignPresetId === templateOption.presetId &&
                        pendingDesignTemplate === templateOption.layoutTemplate;
                      return (
                        <button
                          key={templateOption.presetId}
                          type="button"
                          className={`${productPageBundleStyles.templateOptionCard} ${isSelected ? productPageBundleStyles.templateOptionCardSelected : ""}`}
                          aria-pressed={isSelected}
                          onClick={() => {
                            setPendingDesignTemplate(
                              templateOption.layoutTemplate,
                            );
                            setPendingDesignPresetId(templateOption.presetId);
                          }}
                        >
                          <span
                            className={
                              productPageBundleStyles.templateOptionImageFrame
                            }
                          >
                            <img
                              src={templateOption.image}
                              alt={templateOption.label}
                              className={
                                productPageBundleStyles.templateOptionImage
                              }
                            />
                          </span>
                          <span
                            className={
                              productPageBundleStyles.templateOptionFooter
                            }
                          >
                            <span
                              className={
                                productPageBundleStyles.templateOptionLabel
                              }
                            >
                              {templateOption.label}
                            </span>
                            <span
                              className={`${productPageBundleStyles.templateOptionAction} ${isSelected ? productPageBundleStyles.templateOptionActionSelected : ""}`}
                            >
                              {isSelected ? "Selected" : "Select"}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className={productPageBundleStyles.templateDialogFooter}>
                  <s-button
                    variant="primary"
                    disabled={!pendingDesignPresetId || undefined}
                    loading={
                      templateFetcher.state === "submitting" || undefined
                    }
                    onClick={handleTemplateNext}
                  >
                    Next
                  </s-button>
                </div>
              </>
            ) : templateModalStep === "colorsAndCorners" ? (
              <>
                <div className={productPageBundleStyles.templateDialogBody}>
                  <div className={productPageBundleStyles.templateDialogIntro}>
                    <div>
                      <h3
                        className={
                          productPageBundleStyles.templateDialogSubheading
                        }
                      >
                        Customize your bundle
                      </h3>
                      <p
                        className={
                          productPageBundleStyles.templateDialogDescription
                        }
                      >
                        Fine tune colors and corners before previewing the
                        bundle
                      </p>
                    </div>
                    <div
                      className={productPageBundleStyles.templateDialogTabs}
                      role="tablist"
                      aria-label="Template customization"
                    >
                      <button
                        type="button"
                        className={productPageBundleStyles.templateDialogTab}
                        onClick={() => setTemplateModalStep("templates")}
                      >
                        Templates
                      </button>
                      <button
                        type="button"
                        className={`${productPageBundleStyles.templateDialogTab} ${productPageBundleStyles.templateDialogTabActive}`}
                        aria-current="page"
                      >
                        Colors and corners
                      </button>
                      <button
                        type="button"
                        className={productPageBundleStyles.templateDialogTab}
                        onClick={() => setTemplateModalStep("textAndImages")}
                      >
                        Text and images
                      </button>
                    </div>
                  </div>
                  <div
                    className={
                      productPageBundleStyles.templateCustomizationGrid
                    }
                  >
                    <div
                      className={
                        productPageBundleStyles.templateCustomizationCard
                      }
                    >
                      <h4>Brand colors</h4>
                      <p>
                        Use Settings &rarr; Design color controls for primary,
                        secondary, background, text, border, and discount
                        accents.
                      </p>
                    </div>
                    <div
                      className={
                        productPageBundleStyles.templateCustomizationCard
                      }
                    >
                      <h4>Corners</h4>
                      <p>
                        Review border radius and card rounding before applying
                        the selected template.
                      </p>
                    </div>
                  </div>
                </div>
                <div className={productPageBundleStyles.templateDialogFooter}>
                  <s-button
                    variant="secondary"
                    onClick={() => setTemplateModalStep("templates")}
                  >
                    Back
                  </s-button>
                  <s-button
                    variant="primary"
                    onClick={() => setTemplateModalStep("textAndImages")}
                  >
                    Next
                  </s-button>
                </div>
              </>
            ) : templateModalStep === "textAndImages" ? (
              <>
                <div className={productPageBundleStyles.templateDialogBody}>
                  <div className={productPageBundleStyles.templateDialogIntro}>
                    <div>
                      <h3
                        className={
                          productPageBundleStyles.templateDialogSubheading
                        }
                      >
                        Customize your bundle
                      </h3>
                      <p
                        className={
                          productPageBundleStyles.templateDialogDescription
                        }
                      >
                        Review template language, labels, and media before
                        finishing customization
                      </p>
                    </div>
                    <div
                      className={productPageBundleStyles.templateDialogTabs}
                      role="tablist"
                      aria-label="Template customization"
                    >
                      <button
                        type="button"
                        className={productPageBundleStyles.templateDialogTab}
                        onClick={() => setTemplateModalStep("templates")}
                      >
                        Templates
                      </button>
                      <button
                        type="button"
                        className={productPageBundleStyles.templateDialogTab}
                        onClick={() => setTemplateModalStep("colorsAndCorners")}
                      >
                        Colors and corners
                      </button>
                      <button
                        type="button"
                        className={`${productPageBundleStyles.templateDialogTab} ${productPageBundleStyles.templateDialogTabActive}`}
                        aria-current="page"
                      >
                        Text and images
                      </button>
                    </div>
                  </div>
                  {templateSaveError ? (
                    <p
                      role="alert"
                      className={productPageBundleStyles.templateDialogError}
                    >
                      {templateSaveError}
                    </p>
                  ) : null}
                  <div
                    className={
                      productPageBundleStyles.templateCustomizationGrid
                    }
                  >
                    <div
                      className={
                        productPageBundleStyles.templateCustomizationCard
                      }
                    >
                      <h4>Text and language</h4>
                      <p>
                        Review Product Card, Bundle Cart, Bundle, Popups,
                        Toasts, Addons, and Messages text from Settings
                        Language.
                      </p>
                    </div>
                    <div
                      className={
                        productPageBundleStyles.templateCustomizationCard
                      }
                    >
                      <h4>Images and GIFs</h4>
                      <p>
                        Confirm template media, uploaded images, and loading
                        GIFs before saving the template selection.
                      </p>
                    </div>
                  </div>
                </div>
                <div className={productPageBundleStyles.templateDialogFooter}>
                  <s-button
                    variant="secondary"
                    onClick={() => setTemplateModalStep("colorsAndCorners")}
                  >
                    Back
                  </s-button>
                  <s-button
                    variant="primary"
                    disabled={!pendingDesignPresetId || undefined}
                    loading={
                      templateFetcher.state === "submitting" || undefined
                    }
                    onClick={handleTemplateNext}
                  >
                    Done
                  </s-button>
                </div>
              </>
            ) : templateModalStep === "enableThemeExtension" ? (
              <div className={productPageBundleStyles.templateDialogBody}>
                <div
                  className={
                    productPageBundleStyles.templateDialogConfirmHeader
                  }
                >
                  <h3
                    className={productPageBundleStyles.templateDialogSubheading}
                  >
                    Enable your preview
                  </h3>
                  <p
                    className={
                      productPageBundleStyles.templateDialogDescription
                    }
                  >
                    A simple switch in your theme editor. Nothing changes on
                    your store until you decide.
                  </p>
                </div>
                <div className={productPageBundleStyles.templateReadyPanel}>
                  <div className={productPageBundleStyles.templateReadyIcon}>
                    <s-icon type="view" />
                  </div>
                  <h3 className={productPageBundleStyles.templateReadyTitle}>
                    Enable app embed
                  </h3>
                  <p className={productPageBundleStyles.templateReadyText}>
                    Open your theme editor, enable the Wolfpack Bundles app
                    embed, then return here to preview your bundle.
                  </p>
                  <s-stack
                    direction="inline"
                    gap="small"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <s-button
                      variant="secondary"
                      onClick={() =>
                        themeEditorUrl
                          ? openThemeEditorInNewTab(themeEditorUrl)
                          : undefined
                      }
                    >
                      Open theme editor
                    </s-button>
                    <s-button
                      variant="primary"
                      onClick={() => setTemplateModalStep("confirm")}
                    >
                      I've enabled it
                    </s-button>
                  </s-stack>
                </div>
              </div>
            ) : (
              <div className={productPageBundleStyles.templateDialogBody}>
                <div
                  className={
                    productPageBundleStyles.templateDialogConfirmHeader
                  }
                >
                  <h3
                    className={productPageBundleStyles.templateDialogSubheading}
                  >
                    View your bundle
                  </h3>
                  <p
                    className={
                      productPageBundleStyles.templateDialogDescription
                    }
                  >
                    View your bundle with your customizations
                  </p>
                </div>
                <div className={productPageBundleStyles.templateReadyPanel}>
                  <div className={productPageBundleStyles.templateReadyIcon}>
                    <s-icon type="check" />
                  </div>
                  <h3 className={productPageBundleStyles.templateReadyTitle}>
                    Your bundle is ready
                  </h3>
                  <p className={productPageBundleStyles.templateReadyText}>
                    Preview it now with your customizations
                  </p>
                  <s-button
                    variant="secondary"
                    loading={isPreviewBundleLoading || undefined}
                    disabled={isPreviewBundleLoading || undefined}
                    onClick={handleTemplatePreview}
                  >
                    Preview bundle
                  </s-button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
