import type { ConfigureBundleFlowContext } from "../useConfigureBundleFlow";

export function FpbGlobalOverlays({
  flow,
}: {
  flow: ConfigureBundleFlowContext;
}) {
  const {
    activeMultiLanguageValues,
    BundleGuidedTour,
    BundleReadinessOverlay,
    closeDiscardModal,
    DiscardChangesModal,
    FPB_TOUR_STEPS,
    handleConfirmDiscard,
    handleGuidedTourStepChange,
    handleReadinessItemClick,
    isMultiLanguageModalOpen,
    loaderData,
    multiLanguageFields,
    multiLanguageLayout,
    MultiLanguageTextModal,
    multiLanguageTitle,
    readinessItems,
    readinessOpen,
    saveStepSetupMultiLanguageValues,
    setIsMultiLanguageModalOpen,
    setReadinessOpen,
    setTextOverridesLocale,
    shop,
    shopLocales,
    showDiscardModal,
    textOverridesLocale,
    updateLocalizedTextOverride,
  } = flow;

  return (
    <>
      <BundleReadinessOverlay
        items={readinessItems}
        open={readinessOpen}
        onOpenChange={setReadinessOpen}
        onItemClick={handleReadinessItemClick}
      />
      <BundleGuidedTour
        steps={FPB_TOUR_STEPS}
        shop={shop}
        enabled={loaderData.showFirstLoadTour === true}
        onStepChange={handleGuidedTourStepChange}
      />
      <MultiLanguageTextModal
        open={isMultiLanguageModalOpen}
        title={multiLanguageTitle}
        layout={multiLanguageLayout}
        saveLabel={
          multiLanguageLayout === "compact" ? "Save and close" : undefined
        }
        locales={shopLocales}
        activeLocale={textOverridesLocale}
        fields={multiLanguageFields}
        valuesByLocale={activeMultiLanguageValues}
        onActiveLocaleChange={setTextOverridesLocale}
        onChange={updateLocalizedTextOverride}
        onSave={saveStepSetupMultiLanguageValues}
        onClose={() => setIsMultiLanguageModalOpen(false)}
      />
      <DiscardChangesModal
        open={showDiscardModal}
        onDiscard={handleConfirmDiscard}
        onContinue={closeDiscardModal}
      />
    </>
  );
}
