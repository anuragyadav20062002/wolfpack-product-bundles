import { readPpbConfigureRouteFamilySource } from "./ppb-configure-route-source";

describe("Product Page Bundle Subscriptions setup guide", () => {
  it("makes How to setup reveal sanitized setup guidance", () => {
    const source = readPpbConfigureRouteFamilySource().replace(/\s+/g, " ");

    expect(source).toContain("showSubscriptionSetupGuide");
    expect(source).toContain("setShowSubscriptionSetupGuide");
    expect(source).toContain(
      "Create a subscription plan, name it, select all bundle products, configure the purchase frequency, and save the plan.",
    );
    expect(source).toContain(
      "Return here, then use Get Subscription Plans to fetch the shared selling plans available for this bundle.",
    );
    expect(source).toContain(
      "Subscriptions cannot be enabled on bundles with Buy X, Get Y discounts.",
    );
    expect(source).toContain(
      "Use a different discount type to enable subscriptions.",
    );
    expect(source).not.toMatch(/help\\.skailama|easybundles-help/i);
  });

  it("renders the recovered plan-management surface after a valid plan lookup", () => {
    const source = readPpbConfigureRouteFamilySource();

    expect(source).toContain("subscriptionPlans");
    expect(source).toContain("Subscription Plans");
    expect(source).toContain("Plan display name");
    expect(source).toContain("Discount pill");
    expect(source).toContain("Make plan default");
    expect(source).toContain("One-time purchase");
    expect(source).toContain("Make one-time purchase default");
    expect(source).toContain("Recurring discount");
    expect(source).toContain("Subscription text and translations");
    expect(source).toContain("Save Selection");
  });
});
