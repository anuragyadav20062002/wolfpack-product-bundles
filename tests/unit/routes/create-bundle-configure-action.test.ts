import {
  action,
  buildCreateWizardConfigPayload,
  shouldSubmitCreateWizardPage,
} from "../../../app/routes/app/app.bundles.create_.configure.$bundleId/route";
import { requireAdminSession } from "../../../app/lib/auth-guards.server";

jest.mock("../../../app/lib/auth-guards.server", () => ({
  requireAdminSession: jest.fn(),
}));

jest.mock("../../../app/db.server", () => ({
  __esModule: true,
  default: {
    bundle: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    bundleStep: {
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    stepProduct: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

jest.mock(
  "../../../app/components/design-control-panel/settings/FilePicker",
  () => ({
    FilePicker: () => null,
  })
);

jest.mock("../../../app/components/bundle-configure/BundleGuidedTour", () => ({
  BundleGuidedTour: () => null,
}));

jest.mock(
  "../../../app/components/bundle-configure/BundleReadinessOverlay",
  () => ({
    BundleReadinessOverlay: () => null,
  })
);

jest.mock("../../../app/hooks/useBundlePricing", () => ({
  useBundlePricing: jest.fn(),
}));

const getDb = () => require("../../../app/db.server").default;
const mockRequireAdminSession = requireAdminSession as jest.MockedFunction<
  typeof requireAdminSession
>;

function makeSaveConfigRequest(steps: unknown[]) {
  const formData = new FormData();
  formData.set("_intent", "saveConfig");
  formData.set("steps", JSON.stringify(steps));
  formData.set("bundleStatus", "draft");
  formData.set("searchBarEnabled", "false");
  formData.set("textOverridesByLocale", "{}");

  return new Request(
    "https://test-shop.myshopify.com/app/bundles/create/configure/bundle-1",
    { method: "POST", body: formData }
  );
}

describe("create bundle configure action", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockRequireAdminSession.mockResolvedValue({
      session: { shop: "test-shop.myshopify.com" },
    } as any);

    getDb().bundle.findUnique.mockResolvedValue({
      id: "bundle-1",
      shopId: "test-shop.myshopify.com",
      bundleType: "full_page",
      steps: [],
    });
    getDb().bundle.update.mockResolvedValue({});
    getDb().bundleStep.deleteMany.mockResolvedValue({});
    getDb().stepProduct.deleteMany.mockResolvedValue({});
  });

  it("returns generated DB step IDs after saving new configuration steps", async () => {
    getDb().bundleStep.create
      .mockResolvedValueOnce({ id: "step-db-1" })
      .mockResolvedValueOnce({ id: "step-db-2" });

    const response = await action({
      request: makeSaveConfigRequest([
        {
          tempId: "temp-1",
          dbId: null,
          name: "First Step",
          pageTitle: "First Page",
          products: [],
          collections: [],
          conditions: [],
          filters: [],
        },
        {
          tempId: "temp-2",
          dbId: null,
          name: "Second Step",
          pageTitle: "Second Page",
          products: [],
          collections: [],
          conditions: [],
          filters: [],
        },
      ]),
      params: { bundleId: "bundle-1" },
      context: {},
    } as any);

    const body = await (response as Response).json();

    expect(body).toMatchObject({
      ok: true,
      intent: "saveConfig",
      steps: [
        { tempId: "temp-1", dbId: "step-db-1" },
        { tempId: "temp-2", dbId: "step-db-2" },
      ],
    });
  });

  it("persists selected collections when saving configuration steps", async () => {
    getDb().bundleStep.create.mockResolvedValueOnce({ id: "step-db-1" });

    await action({
      request: makeSaveConfigRequest([
        {
          tempId: "temp-1",
          dbId: null,
          name: "Collection Step",
          pageTitle: "",
          products: [],
          collections: [
            {
              id: "gid://shopify/Collection/1",
              handle: "shirts",
              title: "Shirts",
            },
          ],
          conditions: [],
          filters: [{ id: "filter-1", label: "Shirts", collectionHandle: "shirts" }],
        },
      ]),
      params: { bundleId: "bundle-1" },
      context: {},
    } as any);

    expect(getDb().bundleStep.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          collections: [
            {
              id: "gid://shopify/Collection/1",
              handle: "shirts",
              title: "Shirts",
            },
          ],
          filters: [{ id: "filter-1", label: "Shirts", collectionHandle: "shirts" }],
        }),
      })
    );
  });
});

describe("create bundle configure dirty navigation", () => {
  const savedStep = {
    tempId: "temp-1",
    dbId: "step-db-1",
    name: "Saved Step",
    pageTitle: "Saved Page",
    iconUrl: null,
    products: [],
    collections: [],
    conditions: [],
    filters: [],
    preSelectAll: false,
    activeTab: "products",
  };

  it("skips saving an unchanged configuration page after step DB IDs exist", () => {
    const payload = buildCreateWizardConfigPayload({
      steps: [savedStep],
      bundleStatus: "draft",
      searchBarEnabled: false,
      textOverridesByLocale: {},
    });

    expect(
      shouldSubmitCreateWizardPage({
        baseline: payload,
        current: payload,
        requirePersistedStepIds: true,
        steps: [savedStep],
      })
    ).toBe(false);
  });

  it("still saves an unchanged configuration page while steps need DB IDs", () => {
    const unsavedStep = { ...savedStep, dbId: null };
    const payload = buildCreateWizardConfigPayload({
      steps: [unsavedStep],
      bundleStatus: "draft",
      searchBarEnabled: false,
      textOverridesByLocale: {},
    });

    expect(
      shouldSubmitCreateWizardPage({
        baseline: payload,
        current: payload,
        requirePersistedStepIds: true,
        steps: [unsavedStep],
      })
    ).toBe(true);
  });

  it("saves a dirty configuration page", () => {
    const baseline = buildCreateWizardConfigPayload({
      steps: [savedStep],
      bundleStatus: "draft",
      searchBarEnabled: false,
      textOverridesByLocale: {},
    });
    const current = buildCreateWizardConfigPayload({
      steps: [{ ...savedStep, name: "Changed Step" }],
      bundleStatus: "draft",
      searchBarEnabled: false,
      textOverridesByLocale: {},
    });

    expect(
      shouldSubmitCreateWizardPage({
        baseline,
        current,
        requirePersistedStepIds: true,
        steps: [{ ...savedStep, name: "Changed Step" }],
      })
    ).toBe(true);
  });
});
