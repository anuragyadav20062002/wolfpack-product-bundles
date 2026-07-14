/**
 * Billing plan-card i18n contract.
 *
 * Issue: admin-ui-i18n-1
 * Spec : test-spec/admin-ui-i18n.spec.md
 */
import fs from "node:fs";
import path from "node:path";

const readSource = (file: string) =>
  fs.readFileSync(path.join(process.cwd(), file), "utf8");

const components: Record<string, string[]> = {
  "app/components/billing/FreePlanCard.tsx": [
    "billing.cards.currentPlan", "billing.cards.freePrice", "billing.cards.freeDescription",
    "billing.cards.includes", "billing.cards.freePlan",
  ],
  "app/components/billing/GrowPlanCard.tsx": [
    "billing.cards.mostPopular", "billing.cards.currentPlan", "billing.cards.perMonth",
    "billing.cards.growDescription", "billing.cards.growIncludes", "billing.cards.upgradeToGrow",
    "billing.cards.cancelAnytimeBilled",
  ],
};

describe("billing plan-card copy extraction", () => {
  it.each(Object.entries(components))("%s uses translation keys", (file, keys) => {
    const source = readSource(file);
    expect(source).toContain("useTranslation");
    keys.forEach((key) => expect(source).toContain(key));
  });
});
