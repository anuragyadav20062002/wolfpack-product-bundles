import { buildPpbLiveCard } from "../../../app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/ppb-live-card-model";

describe("PPB configure live card model", () => {
  it("preserves placement state and callback ownership for the shared shell", () => {
    const handlePlaceWidget = jest.fn();
    const liveCard = buildPpbLiveCard({
      isPreparingPlacementTemplates: true,
      handlePlaceWidget,
    });

    expect(liveCard).toMatchObject({
      title: "Take your bundle live",
      label: "Place on theme",
      actionLabel: "Place Widget",
      loading: true,
      disabled: true,
    });

    liveCard.onAction();
    expect(handlePlaceWidget).toHaveBeenCalledTimes(1);
  });
});
