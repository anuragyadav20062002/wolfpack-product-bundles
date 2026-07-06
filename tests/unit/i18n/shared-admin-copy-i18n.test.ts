/**
 * Shared embedded Admin component i18n contract.
 *
 * Issue: admin-ui-i18n-1
 * Spec : test-spec/admin-ui-i18n.spec.md
 */
import fs from "node:fs";
import path from "node:path";

const readSource = (file: string) =>
  fs.readFileSync(path.join(process.cwd(), file), "utf8");

const componentKeys: Record<string, string[]> = {
  "app/components/AppEmbedBanner.tsx": [
    "common.appEmbed.body",
    "common.appEmbed.guideImageAlt",
    "common.appEmbed.guideTitle",
    "common.actions.close",
    "common.actions.enable",
    "common.actions.enableHere",
    "common.actions.learnMore",
  ],
  "app/components/EnablePreviewModal.tsx": [
    "common.previewGate.title",
    "common.previewGate.body",
    "common.actions.maybeLater",
    "common.actions.setUpVisibility",
  ],
  "app/components/UnlistedBundleBanner.tsx": [
    "common.unlistedBundle.title",
    "common.unlistedBundle.body",
    "common.actions.manage",
  ],
  "app/components/ProxyHealthBanner.tsx": [
    "common.proxyHealth.title",
    "common.proxyHealth.body",
    "common.actions.reinstallApp",
  ],
  "app/components/bundle-configure/DiscardChangesModal.tsx": [
    "common.discardChanges.title",
    "common.discardChanges.body",
    "common.actions.discardChanges",
    "common.actions.continueEditing",
  ],
  "app/components/bundle-configure/LocalAppModal.tsx": [
    "common.actions.close",
  ],
  "app/components/bundle-configure/MultiLanguageTextModal.tsx": [
    "common.multiLanguage.title",
    "common.multiLanguage.saveAndClose",
    "common.multiLanguage.translations",
    "common.multiLanguage.helper",
    "common.multiLanguage.chooseLanguage",
    "common.multiLanguage.customText",
    "common.multiLanguage.inputHelper",
    "common.multiLanguage.textSettings",
  ],
  "app/components/bundle-configure/BundleReadinessOverlay.tsx": [
    "common.readiness.itemAccessibility",
    "common.readiness.points",
    "common.readiness.ready",
    "common.readiness.notReady",
    "common.readiness.toggleAccessibility",
    "common.readiness.title",
    "common.readiness.helper",
  ],
  "app/routes/app/_shared/bundle-configure/BundleStatusSection.tsx": [
    "common.bundleStatus.title",
    "common.bundleStatus.options.${opt.value}",
  ],
};

describe("shared embedded Admin component copy extraction", () => {
  it.each(Object.entries(componentKeys))("%s uses translation keys", (file, keys) => {
    const source = readSource(file);
    expect(source).toContain("useTranslation");
    keys.forEach((key) => expect(source).toContain(key));
  });
});
