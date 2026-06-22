type BundleTemplateInput = {
  bundleType?: string | null;
  bundleDesignTemplate?: string | null;
  bundleDesignPresetId?: string | null;
};

type FpbTemplateSelection = {
  bundleDesignTemplate: string | null;
  bundleDesignPresetId: string | null;
};

function normalizeTemplateValue(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function resolveFpbTemplateSelection(
  bundle: BundleTemplateInput,
): FpbTemplateSelection {
  const savedTemplate = normalizeTemplateValue(bundle.bundleDesignTemplate);
  const savedPreset = normalizeTemplateValue(bundle.bundleDesignPresetId);

  if (bundle.bundleType !== "full_page") {
    return {
      bundleDesignTemplate: savedTemplate,
      bundleDesignPresetId: savedPreset,
    };
  }

  return {
    bundleDesignTemplate: savedTemplate ?? "FBP_SIDE_FOOTER",
    bundleDesignPresetId: savedPreset ?? "STANDARD",
  };
}
