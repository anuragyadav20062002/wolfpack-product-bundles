import type React from "react";
import { usePpbConfigureContext } from "./PpbConfigureContext";

export function PpbSubscriptionsSection() {
  const {
    activeSection,
    DiscountMethod,
    pricingState,
    setShowSubscriptionSetupGuide,
    showSubscriptionSetupGuide,
    SUBSCRIPTION_NO_COMMON_PLAN_MESSAGE,
    subscriptionFetcher,
  } = usePpbConfigureContext();

  return (
    <>
      {activeSection === "subscriptions" &&
        (() => {
          const validation = subscriptionFetcher.data;
          const subscriptionsBlocked =
            pricingState.discountType === DiscountMethod.BUY_X_GET_Y;
          const subscriptionPlans =
            validation?.success === true && validation?.isValid === true
              ? (validation.plans ?? [])
              : [];
          const validationMessage =
            validation?.success === false
              ? validation.error
              : validation?.isValid === false
                ? (validation.message ?? SUBSCRIPTION_NO_COMMON_PLAN_MESSAGE)
                : null;
          return (
            <div data-tour-target="ppb-subscriptions">
              <s-section>
                <s-stack direction="block" gap="base">
                  <s-stack direction="inline" alignItems="center" gap="small">
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
                      Bundle Subscriptions
                    </h3>
                    <s-button
                      variant="tertiary"
                      onClick={() =>
                        setShowSubscriptionSetupGuide((visible) => !visible)
                      }
                    >
                      How to setup?
                    </s-button>
                  </s-stack>
                  <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
                    Allow customers to purchase the bundle as a subscription
                  </p>
                  {subscriptionsBlocked && (
                    <s-banner tone="warning">
                      <span>
                        Subscriptions cannot be enabled on bundles with Buy X,
                        Get Y discounts. Use a different discount type to enable
                        subscriptions.
                      </span>
                    </s-banner>
                  )}
                  {showSubscriptionSetupGuide && (
                    <s-banner tone="info">
                      <s-stack direction="block" gap="small-400">
                        <span>
                          Create a subscription plan, name it, select all bundle
                          products, configure the purchase frequency, and save
                          the plan.
                        </span>
                        <span>
                          Return here, then use Get Subscription Plans to fetch
                          the shared selling plans available for this bundle.
                        </span>
                      </s-stack>
                    </s-banner>
                  )}
                  {validationMessage && (
                    <s-banner tone="warning">
                      <s-stack direction="block" gap="small-400">
                        <span>{validationMessage}</span>
                        <s-button variant="tertiary">Learn More</s-button>
                      </s-stack>
                    </s-banner>
                  )}
                  {subscriptionPlans.length > 0 && (
                    <s-section>
                      <s-stack direction="block" gap="base">
                        <div>
                          <h4
                            style={{ margin: 0, fontSize: 15, fontWeight: 650 }}
                          >
                            Subscription Plans
                          </h4>
                          <p
                            style={{
                              margin: "4px 0 0",
                              fontSize: 13,
                              color: "#6d7175",
                            }}
                          >
                            Select the shared selling plans available for this
                            bundle.
                          </p>
                        </div>
                        <s-stack direction="block" gap="small">
                          {subscriptionPlans.map((plan, index) => (
                            <div
                              key={plan.id}
                              style={{
                                border: "1px solid #e1e3e5",
                                borderRadius: 8,
                                padding: 16,
                                background: "#ffffff",
                              }}
                            >
                              <s-stack direction="block" gap="small">
                                <s-stack
                                  direction="inline"
                                  alignItems="center"
                                  gap="small"
                                  justifyContent="space-between"
                                >
                                  <h5
                                    style={{
                                      margin: 0,
                                      fontSize: 14,
                                      fontWeight: 650,
                                    }}
                                  >
                                    {plan.name}
                                  </h5>
                                  {index === 0 && (
                                    <s-badge tone="success">
                                      Newly added
                                    </s-badge>
                                  )}
                                </s-stack>
                                <div
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns:
                                      "repeat(2, minmax(0, 1fr))",
                                    gap: 12,
                                  }}
                                >
                                  <s-text-field
                                    label="Plan display name"
                                    value={plan.name}
                                    readOnly
                                    autocomplete="off"
                                  />
                                  <s-text-field
                                    label="Discount pill"
                                    value=""
                                    placeholder="Discount pill"
                                    autocomplete="off"
                                  />
                                </div>
                                <s-checkbox
                                  accessibilityLabel={`Make ${plan.name} default plan`}
                                  label="Make plan default"
                                />
                              </s-stack>
                            </div>
                          ))}
                        </s-stack>
                        <div
                          style={{
                            border: "1px solid #e1e3e5",
                            borderRadius: 8,
                            padding: 16,
                            background: "#f6f6f7",
                          }}
                        >
                          <s-stack direction="block" gap="small">
                            <h5
                              style={{
                                margin: 0,
                                fontSize: 14,
                                fontWeight: 650,
                              }}
                            >
                              Configurations
                            </h5>
                            <s-checkbox
                              accessibilityLabel="One-time purchase"
                              label="One-time purchase"
                            />
                            <s-checkbox
                              accessibilityLabel="Make one-time purchase default"
                              label="Make one-time purchase default"
                            />
                            <s-text-field
                              label="Recurring discount"
                              value=""
                              placeholder="Recurring discount"
                              autocomplete="off"
                            />
                          </s-stack>
                        </div>
                        <div
                          style={{
                            border: "1px solid #e1e3e5",
                            borderRadius: 8,
                            padding: 16,
                            background: "#ffffff",
                          }}
                        >
                          <s-stack direction="block" gap="small">
                            <s-stack
                              direction="inline"
                              alignItems="center"
                              gap="small"
                              justifyContent="space-between"
                            >
                              <h5
                                style={{
                                  margin: 0,
                                  fontSize: 14,
                                  fontWeight: 650,
                                }}
                              >
                                Subscription text and translations
                              </h5>
                              <s-button variant="secondary" icon="globe">
                                Multi Language
                              </s-button>
                            </s-stack>
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns:
                                  "repeat(2, minmax(0, 1fr))",
                                gap: 12,
                              }}
                            >
                              <s-text-field
                                label="Subscription title"
                                value=""
                                autocomplete="off"
                              />
                              <s-text-field
                                label="Tier labels"
                                value=""
                                autocomplete="off"
                              />
                              <s-text-field
                                label="Plan name in dropdown"
                                value=""
                                autocomplete="off"
                              />
                              <s-text-field
                                label="Subscription option description"
                                value=""
                                autocomplete="off"
                              />
                              <s-text-field
                                label="One-time purchase label"
                                value=""
                                autocomplete="off"
                              />
                              <s-text-field
                                label="One-time purchase description"
                                value=""
                                autocomplete="off"
                              />
                            </div>
                          </s-stack>
                        </div>
                        <s-stack
                          direction="inline"
                          gap="small"
                          alignItems="center"
                        >
                          <s-button variant="primary">Save Selection</s-button>
                        </s-stack>
                      </s-stack>
                    </s-section>
                  )}
                  <s-stack direction="inline" gap="small" alignItems="center">
                    <s-button
                      variant="primary"
                      loading={
                        subscriptionFetcher.state === "submitting" || undefined
                      }
                      disabled={
                        subscriptionFetcher.state !== "idle" ||
                        subscriptionsBlocked ||
                        undefined
                      }
                      onClick={() => {
                        const formData = new FormData();
                        formData.append("intent", "validateSellingPlanGroups");
                        subscriptionFetcher.submit(formData, {
                          method: "post",
                        });
                      }}
                    >
                      Get Subscription Plans
                    </s-button>
                  </s-stack>
                </s-stack>
              </s-section>
            </div>
          );
        })()}
    </>
  );
}
