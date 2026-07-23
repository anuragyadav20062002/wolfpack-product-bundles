import type { ConfigureBundleFlowContext } from "../useConfigureBundleFlow";
import { openThemeEditorInNewTab } from "../../../../lib/theme-editor-navigation.client";

export function FpbTemplateDialog({
  flow,
}: {
  flow: ConfigureBundleFlowContext;
}) {
  const {
    bundle,
    closeSelectTemplateModal,
    fullPageBundleStyles,
    fullPageTemplateOptions,
    handleSelectTemplateBackdropClick,
    handleSelectTemplateDialogKeyDown,
    handleTemplateNext,
    handleTemplatePreview,
    isPreviewBundleLoading,
    isSelectTemplateModalOpen,
    OptimisedImage,
    pendingDesignPresetId,
    pendingDesignTemplate,
    selectTemplateModalRef,
    setPendingDesignPresetId,
    setPendingDesignTemplate,
    setTemplateModalStep,
    templateFetcher,
    templateModalStep,
    templateSaveError,
    themeEditorUrl,
  } = flow;

  return (
    <>
      {isSelectTemplateModalOpen && (
        <div
          className={fullPageBundleStyles.templateDialogBackdrop}
          role="presentation"
          onMouseDown={handleSelectTemplateBackdropClick}
          onClick={handleSelectTemplateBackdropClick}
        >
          <div
            className={fullPageBundleStyles.templateDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="fpb-template-dialog-title"
            tabIndex={-1}
            ref={selectTemplateModalRef}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={handleSelectTemplateDialogKeyDown}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div
              className={fullPageBundleStyles.templateDialogHandle}
              aria-hidden="true"
            />
            <div className={fullPageBundleStyles.templateDialogHeader}>
              <h2
                id="fpb-template-dialog-title"
                className={fullPageBundleStyles.templateDialogHeading}
              >
                Customization
              </h2>
              <button
                type="button"
                className={fullPageBundleStyles.templateDialogClose}
                aria-label="Close customization"
                onClick={closeSelectTemplateModal}
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
                <div className={fullPageBundleStyles.templateDialogBody}>
                  <div className={fullPageBundleStyles.templateDialogIntro}>
                    <div>
                      <h3
                        className={
                          fullPageBundleStyles.templateDialogSubheading
                        }
                      >
                        Customize your bundle
                      </h3>
                      <p
                        className={
                          fullPageBundleStyles.templateDialogDescription
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
                      className={fullPageBundleStyles.templateDialogError}
                    >
                      {templateSaveError}
                    </p>
                  ) : null}
                  <div className={fullPageBundleStyles.templateDialogGrid}>
                    {fullPageTemplateOptions.map((tpl) => {
                      const isSelected =
                        pendingDesignPresetId === tpl.presetId &&
                        pendingDesignTemplate === "FBP_SIDE_FOOTER";
                      return (
                        <button
                          key={tpl.presetId}
                          type="button"
                          className={`${fullPageBundleStyles.templateOptionCard} ${isSelected ? fullPageBundleStyles.templateOptionCardSelected : ""}`}
                          aria-pressed={isSelected}
                          onClick={() => {
                            setPendingDesignTemplate("FBP_SIDE_FOOTER");
                            setPendingDesignPresetId(tpl.presetId);
                          }}
                        >
                          <span
                            className={
                              fullPageBundleStyles.templateOptionImageFrame
                            }
                          >
                            <OptimisedImage
                              src={tpl.image}
                              alt={tpl.label}
                              className={
                                fullPageBundleStyles.templateOptionImage
                              }
                              width={400}
                              height={300}
                              loading="eager"
                              fetchPriority="high"
                            />
                          </span>
                          <span
                            className={
                              fullPageBundleStyles.templateOptionFooter
                            }
                          >
                            <span
                              className={
                                fullPageBundleStyles.templateOptionLabel
                              }
                            >
                              {tpl.label}
                            </span>
                            <span
                              className={`${fullPageBundleStyles.templateOptionAction} ${isSelected ? fullPageBundleStyles.templateOptionActionSelected : ""}`}
                            >
                              {isSelected ? "Selected" : "Select"}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className={fullPageBundleStyles.templateDialogFooter}>
                  <s-button
                    type="button"
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
                <div className={fullPageBundleStyles.templateDialogBody}>
                  <div className={fullPageBundleStyles.templateDialogIntro}>
                    <div>
                      <h3
                        className={
                          fullPageBundleStyles.templateDialogSubheading
                        }
                      >
                        Customize your bundle
                      </h3>
                      <p
                        className={
                          fullPageBundleStyles.templateDialogDescription
                        }
                      >
                        Fine tune colors and corners before previewing the
                        bundle
                      </p>
                    </div>
                    <div
                      className={fullPageBundleStyles.templateDialogTabs}
                      role="tablist"
                      aria-label="Template customization"
                    >
                      <button
                        type="button"
                        className={fullPageBundleStyles.templateDialogTab}
                        onClick={() => setTemplateModalStep("templates")}
                      >
                        Templates
                      </button>
                      <button
                        type="button"
                        className={`${fullPageBundleStyles.templateDialogTab} ${fullPageBundleStyles.templateDialogTabActive}`}
                        aria-current="page"
                      >
                        Colors and corners
                      </button>
                      <button
                        type="button"
                        className={fullPageBundleStyles.templateDialogTab}
                        onClick={() => setTemplateModalStep("textAndImages")}
                      >
                        Text and images
                      </button>
                    </div>
                  </div>
                  <div
                    className={fullPageBundleStyles.templateCustomizationGrid}
                  >
                    <div
                      className={fullPageBundleStyles.templateCustomizationCard}
                    >
                      <h4>Brand colors</h4>
                      <p>
                        Use Settings &rarr; Design color controls for primary,
                        secondary, background, text, border, and discount
                        accents.
                      </p>
                    </div>
                    <div
                      className={fullPageBundleStyles.templateCustomizationCard}
                    >
                      <h4>Corners</h4>
                      <p>
                        Review border radius and card rounding before applying
                        the selected template.
                      </p>
                    </div>
                  </div>
                </div>
                <div className={fullPageBundleStyles.templateDialogFooter}>
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
                <div className={fullPageBundleStyles.templateDialogBody}>
                  <div className={fullPageBundleStyles.templateDialogIntro}>
                    <div>
                      <h3
                        className={
                          fullPageBundleStyles.templateDialogSubheading
                        }
                      >
                        Customize your bundle
                      </h3>
                      <p
                        className={
                          fullPageBundleStyles.templateDialogDescription
                        }
                      >
                        Review template language, labels, and media before
                        finishing customization
                      </p>
                    </div>
                    <div
                      className={fullPageBundleStyles.templateDialogTabs}
                      role="tablist"
                      aria-label="Template customization"
                    >
                      <button
                        type="button"
                        className={fullPageBundleStyles.templateDialogTab}
                        onClick={() => setTemplateModalStep("templates")}
                      >
                        Templates
                      </button>
                      <button
                        type="button"
                        className={fullPageBundleStyles.templateDialogTab}
                        onClick={() => setTemplateModalStep("colorsAndCorners")}
                      >
                        Colors and corners
                      </button>
                      <button
                        type="button"
                        className={`${fullPageBundleStyles.templateDialogTab} ${fullPageBundleStyles.templateDialogTabActive}`}
                        aria-current="page"
                      >
                        Text and images
                      </button>
                    </div>
                  </div>
                  {templateSaveError ? (
                    <p
                      role="alert"
                      className={fullPageBundleStyles.templateDialogError}
                    >
                      {templateSaveError}
                    </p>
                  ) : null}
                  <div
                    className={fullPageBundleStyles.templateCustomizationGrid}
                  >
                    <div
                      className={fullPageBundleStyles.templateCustomizationCard}
                    >
                      <h4>Text and language</h4>
                      <p>
                        Review Product Card, Bundle Cart, Bundle, Popups,
                        Toasts, and Addons text from Settings Language.
                      </p>
                    </div>
                    <div
                      className={fullPageBundleStyles.templateCustomizationCard}
                    >
                      <h4>Images and GIFs</h4>
                      <p>
                        Confirm template media, uploaded images, and loading
                        GIFs before saving the template selection.
                      </p>
                    </div>
                  </div>
                </div>
                <div className={fullPageBundleStyles.templateDialogFooter}>
                  <s-button
                    variant="secondary"
                    onClick={() => setTemplateModalStep("colorsAndCorners")}
                  >
                    Back
                  </s-button>
                  <s-button
                    type="button"
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
              <div className={fullPageBundleStyles.templateDialogBody}>
                <div
                  className={fullPageBundleStyles.templateDialogConfirmHeader}
                >
                  <h3 className={fullPageBundleStyles.templateDialogSubheading}>
                    Enable your preview
                  </h3>
                  <p className={fullPageBundleStyles.templateDialogDescription}>
                    A simple switch in your theme editor. Nothing changes on
                    your store until you decide.
                  </p>
                </div>
                <div className={fullPageBundleStyles.templateReadyPanel}>
                  <div className={fullPageBundleStyles.templateReadyIcon}>
                    <s-icon type="view" />
                  </div>
                  <h3 className={fullPageBundleStyles.templateReadyTitle}>
                    Enable app embed
                  </h3>
                  <p className={fullPageBundleStyles.templateReadyText}>
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
              <div className={fullPageBundleStyles.templateDialogBody}>
                <div
                  className={fullPageBundleStyles.templateDialogConfirmHeader}
                >
                  <h3 className={fullPageBundleStyles.templateDialogSubheading}>
                    View your bundle
                  </h3>
                  <p className={fullPageBundleStyles.templateDialogDescription}>
                    View your bundle with your customizations
                  </p>
                </div>
                <div className={fullPageBundleStyles.templateReadyPanel}>
                  <div className={fullPageBundleStyles.templateReadyIcon}>
                    <s-icon type="check" />
                  </div>
                  <h3 className={fullPageBundleStyles.templateReadyTitle}>
                    Your bundle is ready
                  </h3>
                  <p className={fullPageBundleStyles.templateReadyText}>
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
