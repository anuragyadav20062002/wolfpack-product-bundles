/**
 * Billing route i18n contract.
 *
 * Issue: admin-ui-i18n-1
 * Spec : test-spec/admin-ui-i18n.spec.md
 */
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(
  path.join(process.cwd(), "app/routes/app/app.billing.tsx"),
  "utf8",
);

const requiredKeys = [
  "billing.route.title", "billing.route.dashboard", "billing.route.currentPlan",
  "billing.route.active", "billing.route.inactive", "billing.cards.perMonth",
  "billing.route.bundleUsage", "billing.route.bundleCount", "billing.route.limitReached",
  "billing.route.limitUpgrade", "billing.route.overview", "billing.route.activeBundles",
  "billing.route.totalSteps", "billing.route.productPage", "billing.route.fullPage",
  "billing.route.cancelSubscription", "billing.route.cancelHeading", "billing.route.downgradeBody",
  "billing.route.archiveWarning", "billing.route.confirmCancellation", "billing.route.keepSubscription",
  "billing.route.features",
  "billing.route.needHelp", "billing.route.helpBody", "billing.actions.contactSupport",
];

describe("billing route copy extraction", () => {
  it("resolves merchant-facing copy through translation keys", () => {
    expect(source).toContain("useTranslation");
    requiredKeys.forEach((key) => expect(source).toContain(key));
  });
});
