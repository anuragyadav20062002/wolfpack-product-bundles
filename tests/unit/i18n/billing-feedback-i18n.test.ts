/**
 * Billing feedback component i18n contract.
 *
 * Issue: admin-ui-i18n-1
 * Spec : test-spec/admin-ui-i18n.spec.md
 */
import fs from "node:fs";
import path from "node:path";

const readSource = (file: string) =>
  fs.readFileSync(path.join(process.cwd(), file), "utf8");

const components: Record<string, string[]> = {
  "app/components/billing/SubscriptionErrorBanner.tsx": [
    "billing.error.heading",
    "billing.error.missingChargeId",
    "billing.error.confirmationFailed",
    "billing.error.unexpected",
    "billing.actions.tryAgain",
    "billing.actions.contactSupport",
  ],
  "app/components/billing/UpgradeConfirmationModal.tsx": [
    "billing.upgradeModal.heading",
    "billing.upgradeModal.confirm",
    "billing.actions.cancel",
    "billing.upgradeModal.redirect",
    "billing.upgradeModal.benefitsHeading",
    "billing.upgradeModal.bundleLimit",
    "billing.upgradeModal.benefits.noRevenueCap",
    "billing.upgradeModal.benefits.advancedDiscounts",
    "billing.upgradeModal.benefits.prioritySupport",
    "billing.upgradeModal.billedMonthly",
    "billing.pricePerMonth",
  ],
  "app/components/billing/UpgradeSuccessBanner.tsx": [
    "billing.success.heading",
    "billing.success.body",
    "billing.success.bundleLimit",
    "billing.success.bundleLimitValue",
    "billing.success.designControl",
    "billing.success.fullAccess",
    "billing.success.support",
    "billing.success.priority",
    "common.actions.dismiss",
  ],
};

describe("billing feedback copy extraction", () => {
  it.each(Object.entries(components))("%s uses translation keys", (file, keys) => {
    const source = readSource(file);
    expect(source).toContain("useTranslation");
    keys.forEach((key) => expect(source).toContain(key));
  });
});
