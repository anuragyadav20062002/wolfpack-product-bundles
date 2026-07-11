import fullPageBundleStyles from "../../../styles/routes/full-page-bundle-configure.module.css";
import { CommonConfigureShell } from "../_shared/bundle-configure/CommonConfigureShell";
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
    <CommonConfigureShell
      blockConfigurationChangeWhileSaving={blockConfigurationChangeWhileSaving}
      isSaveInFlight={isSaveInFlight}
      styles={fullPageBundleStyles}
      saveForm={
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
      }
      header={<ConfigureCanvasHeader flow={flow} />}
      sidebar={<ConfigureSidebar flow={flow} />}
      overlays={<ConfigureRouteModals flow={flow} />}
    >
      <StepSetupSection flow={flow} />
      <FreeGiftAddonsSection flow={flow} />
      <DiscountPricingSection flow={flow} />
      <ImagesVisibilitySection flow={flow} />
      <BundleSettingsSection flow={flow} />
      <BundleWidgetSection flow={flow} />
    </CommonConfigureShell>
  );
}

export default ConfigureBundleFlow;
