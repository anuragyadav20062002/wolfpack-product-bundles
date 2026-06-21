/**
 * Shop-wide Admin locale persistence tests.
 *
 * Issue: admin-ui-i18n-1
 * Spec : test-spec/admin-ui-i18n.spec.md
 */
import db from "../../../app/db.server";
import {
  loadShopAdminLocale,
  saveShopAdminLocale,
} from "../../../app/services/admin-locale.server";

jest.mock("../../../app/db.server", () => ({
  __esModule: true,
  default: {
    shop: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

const mockDb = db as jest.Mocked<typeof db>;

describe("shop-wide Admin locale persistence", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads the saved shop locale", async () => {
    (mockDb.shop.findUnique as jest.Mock).mockResolvedValueOnce({ adminLocale: "fr" });

    await expect(loadShopAdminLocale("shop.myshopify.com")).resolves.toBe("fr");
    expect(mockDb.shop.findUnique).toHaveBeenCalledWith({
      where: { shopDomain: "shop.myshopify.com" },
      select: { adminLocale: true },
    });
  });

  it("defaults missing shop locale to English", async () => {
    (mockDb.shop.findUnique as jest.Mock).mockResolvedValueOnce({ adminLocale: null });

    await expect(loadShopAdminLocale("shop.myshopify.com")).resolves.toBe("en");
  });

  it("defaults unsupported saved locale to English", async () => {
    (mockDb.shop.findUnique as jest.Mock).mockResolvedValueOnce({ adminLocale: "xx" });

    await expect(loadShopAdminLocale("shop.myshopify.com")).resolves.toBe("en");
  });

  it("persists a supported locale on the Shop record", async () => {
    (mockDb.shop.upsert as jest.Mock).mockResolvedValueOnce({ adminLocale: "fr" });

    await expect(saveShopAdminLocale("shop.myshopify.com", "fr")).resolves.toBe("fr");
    expect(mockDb.shop.upsert).toHaveBeenCalledWith({
      where: { shopDomain: "shop.myshopify.com" },
      create: { shopDomain: "shop.myshopify.com", adminLocale: "fr" },
      update: { adminLocale: "fr" },
      select: { adminLocale: true },
    });
  });

  it("rejects unsupported locales without updating the DB", async () => {
    await expect(saveShopAdminLocale("shop.myshopify.com", "xx")).rejects.toThrow(
      "Unsupported Admin locale",
    );
    expect(mockDb.shop.upsert).not.toHaveBeenCalled();
  });
});
