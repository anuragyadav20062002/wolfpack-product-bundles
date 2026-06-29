import {
  buildAddonDraftFromPersonalizationData,
  buildPersonalizationDataFromDraft,
  normalizeAddonTier,
} from "../../../app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/addon-helpers";

describe("FPB add-on personalization helpers", () => {
  it("keeps gifting-step and add-ons-with-bundles toggles separate in the saved contract", () => {
    const data = buildPersonalizationDataFromDraft(
      {
        isPersonalizationEnabled: false,
        personalizeStepText: "Add On",
        addonProductsEnabled: true,
        addonProductsTitle: "Add ON",
        addonTiers: [
          {
            tierId: "tier-1",
            title: "Tier 1",
            eligibilityType: "QUANTITY",
            eligibilityValue: 1,
            discountType: "PERCENTAGE",
            discountValue: 100,
            selectedAddonProducts: [],
          },
        ],
      },
      null,
    );

    expect(data).toMatchObject({
      isPersonalizationEnabled: false,
      personalizeStepText: "Add On",
      addonProducts: {
        isEnabled: true,
        title: "Add ON",
        type: "MULTI_TIER",
      },
    });
  });

  it("omits personalization data when both add-on controls are disabled", () => {
    expect(
      buildPersonalizationDataFromDraft(
        {
          isPersonalizationEnabled: false,
          addonProductsEnabled: false,
        },
        null,
      ),
    ).toBeNull();
  });

  it("normalizes leading-zero numeric tier values before save", () => {
    expect(
      normalizeAddonTier(
        {
          eligibilityType: "AMOUNT",
          eligibilityValue: "001",
          discountType: "PERCENTAGE",
          discountValue: "0100",
        },
        0,
      ),
    ).toMatchObject({
      eligibilityCondition: {
        type: "AMOUNT",
        value: 1,
      },
      discount: {
        type: "PERCENTAGE",
        value: 100,
      },
    });
  });

  it("normalizes invalid zero eligibility thresholds to 1", () => {
    expect(
      normalizeAddonTier(
        {
          eligibilityType: "QUANTITY",
          eligibilityValue: 0,
          discountType: "PERCENTAGE",
          discountValue: 0,
        },
        0,
      ),
    ).toMatchObject({
      eligibilityCondition: {
        type: "QUANTITY",
        value: 1,
      },
    });
  });

  it("hydrates add-on drafts from the direct EB-style personalization contract", () => {
    const draft = buildAddonDraftFromPersonalizationData({
      isPersonalizationEnabled: true,
      personalizeStepText: "Add On",
      personalizePageSubtext: "Pick an extra",
      stepImage: "https://cdn.example/addon.png",
      addonProducts: {
        isEnabled: true,
        title: "Add ON",
        multiLangData: { fr: { title: "Ajout" } },
        tiers: [
          {
            tierId: "tier31726",
            title: "Tier 1",
            eligibilityCondition: { type: "QUANTITY", value: 2 },
            discount: { type: "PERCENTAGE", value: "10" },
            conditions: [{ type: "quantity", condition: "gte", value: "1" }],
          },
        ],
      },
    });

    expect(draft).toMatchObject({
      isPersonalizationEnabled: true,
      personalizeStepText: "Add On",
      personalizePageSubtext: "Pick an extra",
      stepImage: "https://cdn.example/addon.png",
      addonProductsEnabled: true,
      addonProductsTitle: "Add ON",
      addonMultiLangData: { fr: { title: "Ajout" } },
      addonTiers: [
        expect.objectContaining({
          tierId: "tier31726",
          eligibilityType: "QUANTITY",
          eligibilityValue: 2,
          discountValue: 10,
        }),
      ],
    });
  });
});
