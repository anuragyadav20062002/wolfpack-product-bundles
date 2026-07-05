import { useEffect, useRef, useState } from "react";
import { useFetcher } from "@remix-run/react";
import { getPreviewReadinessStorageKey } from "../../../lib/bundle-preview-readiness";

export function usePpbTemplateUiState({ bundle }: { bundle: any }) {
  const [bundleDesignTemplate, setBundleDesignTemplate] = useState<
    string | null
  >((bundle as any).bundleDesignTemplate ?? null);
  const [bundleDesignPresetId, setBundleDesignPresetId] = useState<
    string | null
  >((bundle as any).bundleDesignPresetId ?? null);
  const [pendingDesignTemplate, setPendingDesignTemplate] = useState<
    string | null
  >(null);
  const [pendingDesignPresetId, setPendingDesignPresetId] = useState<
    string | null
  >(null);
  const [isSelectTemplateModalOpen, setIsSelectTemplateModalOpen] =
    useState(false);
  const [templateModalStep, setTemplateModalStep] = useState<
    | "templates"
    | "colorsAndCorners"
    | "textAndImages"
    | "enableThemeExtension"
    | "confirm"
  >("templates");
  const templateFetcher = useFetcher();
  const selectTemplateDialogRef = useRef<HTMLDivElement>(null);
  const selectTemplateOpenButtonRef = useRef<HTMLButtonElement>(null);
  const [templateSaveError, setTemplateSaveError] = useState<string | null>(
    null,
  );
  const lastTemplateRequestRef = useRef<{
    template: string | null;
    presetId: string | null;
  } | null>(null);
  const lastTemplateResponseRef = useRef<unknown>(null);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [activeAssetTabIndex, setActiveAssetTabIndex] = useState(0);
  const [readinessOpen, setReadinessOpen] = useState(false);
  const [hasPreview, setHasPreview] = useState(false);
  const [productMenuOpen, setProductMenuOpen] = useState(false);
  const [isPreparingPlacementTemplates, setIsPreparingPlacementTemplates] =
    useState(false);
  const pendingPlacementModalRef = useRef(false);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [slideKey, setSlideKey] = useState(0);
  const [slideDir, setSlideDir] = useState<"forward" | "backward" | null>(null);
  const [widgetInstalled, setWidgetInstalled] = useState(
    !!bundle.shopifyProductId,
  );

  useEffect(() => {
    setHasPreview(
      !!localStorage.getItem(getPreviewReadinessStorageKey(bundle.id)),
    );
  }, [bundle.id]);

  return {
    bundleDesignTemplate,
    setBundleDesignTemplate,
    bundleDesignPresetId,
    setBundleDesignPresetId,
    pendingDesignTemplate,
    setPendingDesignTemplate,
    pendingDesignPresetId,
    setPendingDesignPresetId,
    isSelectTemplateModalOpen,
    setIsSelectTemplateModalOpen,
    templateModalStep,
    setTemplateModalStep,
    templateFetcher,
    selectTemplateDialogRef,
    selectTemplateOpenButtonRef,
    templateSaveError,
    setTemplateSaveError,
    lastTemplateRequestRef,
    lastTemplateResponseRef,
    isSyncModalOpen,
    setIsSyncModalOpen,
    activeAssetTabIndex,
    setActiveAssetTabIndex,
    readinessOpen,
    setReadinessOpen,
    hasPreview,
    setHasPreview,
    productMenuOpen,
    setProductMenuOpen,
    isPreparingPlacementTemplates,
    setIsPreparingPlacementTemplates,
    pendingPlacementModalRef,
    activeTabIndex,
    setActiveTabIndex,
    slideKey,
    setSlideKey,
    slideDir,
    setSlideDir,
    widgetInstalled,
    setWidgetInstalled,
  };
}
