import type { ConfigureBundleFlowContext } from "../useConfigureBundleFlow";
import { FpbGlobalOverlays } from "./ConfigureGlobalOverlays";
import { FpbPageSelectionModal } from "./ConfigurePageSelectionModal";
import { FpbSelectedItemsModals } from "./ConfigureSelectedItemsModals";
import { FpbSyncAndLanguageModals } from "./ConfigureSyncAndLanguageModals";
import { FpbTemplateDialog } from "./ConfigureTemplateDialog";

export function ConfigureRouteModals({
  flow,
}: {
  flow: ConfigureBundleFlowContext;
}) {
  return (
    <>
      <FpbPageSelectionModal flow={flow} />
      <FpbSelectedItemsModals flow={flow} />
      <FpbGlobalOverlays flow={flow} />
      <FpbTemplateDialog flow={flow} />
      <FpbSyncAndLanguageModals flow={flow} />
    </>
  );
}
