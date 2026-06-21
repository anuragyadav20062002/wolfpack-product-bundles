import fullPageBundleStyles from "../../../styles/routes/full-page-bundle-configure.module.css";
import { ConfigureCanvasHeader } from "./ConfigureCanvasHeader";
import { ConfigureHiddenInputs } from "./ConfigureHiddenInputs";
import { ConfigureSidebar } from "./ConfigureSidebar";
import { useConfigureBundleFlow } from "./useConfigureBundleFlow";
import { StepSetupSection } from "./sections/StepSetupSection";
import { FreeGiftAddonsSection } from "./sections/FreeGiftAddonsSection";
import { DiscountPricingSection } from "./sections/DiscountPricingSection";
import { ImagesVisibilitySection } from "./sections/ImagesVisibilitySection";
import { BundleSettingsSection } from "./sections/BundleSettingsSection";
import { BundleWidgetSection } from "./sections/BundleWidgetSection";
import { ConfigureRouteModals } from "./sections/ConfigureRouteModals";

function ConfigureBundleFlow() {
  const flow = useConfigureBundleFlow();
  const {
    blockConfigurationChangeWhileSaving,
    fetcher,
    handleSave,
    isDirty,
    isSaveInFlight,
    saveBarRef,
    SaveBar,
    setShowDiscardModal,
  } = flow;

  return (
    <div
      className={fullPageBundleStyles.editCanvas}
      data-admin-save-lock-active={isSaveInFlight || undefined}
      onBeforeInputCapture={blockConfigurationChangeWhileSaving}
      onChangeCapture={blockConfigurationChangeWhileSaving}
      onClickCapture={blockConfigurationChangeWhileSaving}
      onDropCapture={blockConfigurationChangeWhileSaving}
      onInputCapture={blockConfigurationChangeWhileSaving}
      onKeyDownCapture={blockConfigurationChangeWhileSaving}
      onPasteCapture={blockConfigurationChangeWhileSaving}
      onPointerDownCapture={blockConfigurationChangeWhileSaving}
    >
      <form
        data-save-lock-allow="true"
        onSubmit={(e) => {
          e.preventDefault();
          void handleSave();
        }}
        onReset={(e) => {
          e.preventDefault();
          setShowDiscardModal(true);
        }}
      >
        <SaveBar ref={saveBarRef} id="bundle-save-bar" open={isDirty}>
          <button
            type="submit"
            variant="primary"
            loading={fetcher.state !== "idle" ? "" : undefined}
            disabled={fetcher.state !== "idle"}
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setShowDiscardModal(true)}
            disabled={fetcher.state !== "idle"}
          >
            Discard
          </button>
        </SaveBar>
        <ConfigureHiddenInputs flow={flow} />
      </form>
      <ConfigureCanvasHeader flow={flow} />
      <div className={fullPageBundleStyles.editGrid}>
        <ConfigureSidebar flow={flow} />
        <div className={fullPageBundleStyles.mainColumn}>
          <StepSetupSection flow={flow} />
          <FreeGiftAddonsSection flow={flow} />
          <DiscountPricingSection flow={flow} />
          <ImagesVisibilitySection flow={flow} />
          <BundleSettingsSection flow={flow} />
          <BundleWidgetSection flow={flow} />
        </div>
      </div>
      <ConfigureRouteModals flow={flow} />
    </div>
  );
}

export default ConfigureBundleFlow;
