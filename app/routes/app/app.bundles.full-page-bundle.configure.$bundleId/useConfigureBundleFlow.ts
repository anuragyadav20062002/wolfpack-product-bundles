import { useConfigureActionController } from "./useConfigureActionController";
import { useConfigureAddonState } from "./useConfigureAddonState";
import { useConfigureBundleController } from "./useConfigureBundleController";
import { useConfigureContentState } from "./useConfigureContentState";
import { useConfigureLocalizationState } from "./useConfigureLocalizationState";
import { useConfigureModalController } from "./useConfigureModalController";
import { useConfigurePageSelectionController } from "./useConfigurePageSelectionController";
import { useConfigureSaveController } from "./useConfigureSaveController";
import { useConfigureTemplatePricingController } from "./useConfigureTemplatePricingController";
import { useConfigureVisibilityTemplateState } from "./useConfigureVisibilityTemplateState";
import { buildConfigureBundleFlowContext } from "./configure-flow-statics";

export function useConfigureBundleFlow() {
  const flow = useConfigureBundleController();

  useConfigureAddonState(flow);
  useConfigureContentState(flow);
  useConfigureLocalizationState(flow);
  useConfigureVisibilityTemplateState(flow);
  useConfigureTemplatePricingController(flow);
  useConfigureModalController(flow);
  useConfigureActionController(flow);
  useConfigurePageSelectionController(flow);
  useConfigureSaveController(flow);

  return buildConfigureBundleFlowContext(flow);
}

export type ConfigureBundleFlowContext = ReturnType<
  typeof useConfigureBundleFlow
>;
