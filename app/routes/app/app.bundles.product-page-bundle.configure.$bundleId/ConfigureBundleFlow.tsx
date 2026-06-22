import productPageBundleStyles from "../../../styles/routes/product-page-bundle-configure.module.css";

import {
  PpbConfigureProvider,
  usePpbConfigureContext,
} from "./PpbConfigureContext";
import { PpbCanvasHeader } from "./PpbCanvasHeader";
import { PpbConfigureSidebar } from "./PpbConfigureSidebar";
import { PpbDiscountLanguageModals } from "./PpbDiscountLanguageModals";
import { PpbMainSections } from "./PpbMainSections";
import { PpbOverlayModals } from "./PpbOverlayModals";
import { PpbPageSelectionModal } from "./PpbPageSelectionModal";
import { PpbSaveForm } from "./PpbSaveForm";
import { PpbSelectTemplateDialog } from "./PpbSelectTemplateDialog";
import { PpbSelectedItemsModals } from "./PpbSelectedItemsModals";
import { PpbUtilityModals } from "./PpbUtilityModals";
import { usePpbConfigureFlow } from "./usePpbConfigureFlow";

function ConfigureBundleCanvas() {
  const { blockConfigurationChangeWhileSaving, isSaveInFlight } =
    usePpbConfigureContext();

  return (
    <div
      className={productPageBundleStyles.editCanvas}
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
      <PpbSaveForm />
      <PpbCanvasHeader />
      <div className={productPageBundleStyles.editGrid}>
        <PpbConfigureSidebar />
        <PpbMainSections />
      </div>
      <PpbPageSelectionModal />
      <PpbSelectedItemsModals />
      <PpbSelectTemplateDialog />
      <PpbUtilityModals />
      <PpbDiscountLanguageModals />
      <PpbOverlayModals />
    </div>
  );
}

export default function ConfigureBundleFlow() {
  const flow = usePpbConfigureFlow();

  return (
    <PpbConfigureProvider value={flow}>
      <ConfigureBundleCanvas />
    </PpbConfigureProvider>
  );
}
