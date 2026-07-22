const requireAdminSession = jest.fn();
const findUnique = jest.fn();
const findMany = jest.fn();
const upsert = jest.fn();
const transaction = jest.fn();

jest.mock("../../../app/lib/auth-guards.server", () => ({ requireAdminSession }));
jest.mock("../../../app/db.server", () => ({
  prisma: {
    designSettings: { findUnique, findMany, upsert },
    bundle: { findMany: jest.fn() },
    $transaction: transaction,
  },
}));
jest.mock("../../../app/services/cart-transform-service.server", () => ({
  CartTransformService: { syncCartLineMessagingSettings: jest.fn() },
}));

// Route imports must follow the module mocks so the action receives the isolated test doubles.
// eslint-disable-next-line import/first
import { createSettingsDesignState } from "../../../app/lib/settings-design-contract";
// eslint-disable-next-line import/first
import { action } from "../../../app/routes/app/app.settings";

function requestFor(payload: unknown) {
  const formData = new FormData();
  formData.set("intent", "saveSettingsDesign");
  formData.set("payload", typeof payload === "string" ? payload : JSON.stringify(payload));
  return new Request("https://app.test/app/settings", { method: "POST", body: formData });
}

describe("Settings Design action", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    requireAdminSession.mockResolvedValue({ admin: {}, session: { shop: "shop.test" } });
    findMany.mockResolvedValue([
      {
        bundleType: "product_page",
        generalSettings: {
          pageCustomization: { banners: { landingPageImageSrc: "banner.webp" } },
          settingsPage: {},
        },
      },
      { bundleType: "full_page", generalSettings: { settingsPage: {} } },
    ]);
    upsert.mockResolvedValue({});
    transaction.mockImplementation(async (operations) => Promise.all(operations));
  });

  it("returns 400 for malformed JSON without touching persistence", async () => {
    const response = await action({ request: requestFor("{"), params: {}, context: {} } as any);

    expect(response.status).toBe(400);
    expect(findMany).not.toHaveBeenCalled();
    expect(upsert).not.toHaveBeenCalled();
  });

  it("atomically writes both rows and returns the confirmed Design DTO", async () => {
    const state = createSettingsDesignState({
      isExpertControlsEnabled: false,
      fieldValues: { "Primary Color": "#123456" },
    });
    const response = await action({ request: requestFor(state), params: {}, context: {} } as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ shopId: "shop.test" }),
    }));
    expect(upsert).toHaveBeenCalledTimes(2);
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(body).toEqual(expect.objectContaining({
      success: true,
      intent: "saveSettingsDesign",
      savedState: state,
    }));
    expect(upsert.mock.calls[0][0].update.generalSettings.pageCustomization.banners).toEqual({
      landingPageImageSrc: "banner.webp",
    });
  });
});
