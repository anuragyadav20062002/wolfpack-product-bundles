import {
  parseCartTransformRepairEnv,
  runCartTransformRepair,
} from "../../../app/services/cart-transform-repair.server";

function makeDeps() {
  const alphaAdmin = { graphql: jest.fn() };
  const betaAdmin = { graphql: jest.fn() };

  return {
    prisma: {
      shop: {
        findMany: jest.fn().mockResolvedValue([
          { shopDomain: "alpha.myshopify.com" },
          { shopDomain: "beta.myshopify.com" },
        ]),
      },
    },
    getAdmin: jest
      .fn()
      .mockResolvedValueOnce(alphaAdmin)
      .mockResolvedValueOnce(betaAdmin),
    completeSetup: jest
      .fn()
      .mockResolvedValue({ success: true, cartTransformId: "gid://shopify/CartTransform/1" }),
    logger: {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    },
  };
}

describe("cart transform repair", () => {
  it("is disabled by default and does not scan shops", async () => {
    const deps = makeDeps();
    const options = parseCartTransformRepairEnv({});

    const result = await runCartTransformRepair(options, deps);

    expect(result.mode).toBe("disabled");
    expect(result.scannedShops).toBe(0);
    expect(deps.prisma.shop.findMany).not.toHaveBeenCalled();
    expect(deps.completeSetup).not.toHaveBeenCalled();
  });

  it("rejects ambiguous dry-run and apply flags", async () => {
    const deps = makeDeps();
    const options = parseCartTransformRepairEnv({
      WPB_CART_TRANSFORM_REPAIR_DRY_RUN: "true",
      WPB_CART_TRANSFORM_REPAIR_APPLY: "true",
    });

    await expect(runCartTransformRepair(options, deps)).rejects.toThrow(
      "Choose either WPB_CART_TRANSFORM_REPAIR_DRY_RUN or WPB_CART_TRANSFORM_REPAIR_APPLY",
    );
    expect(deps.completeSetup).not.toHaveBeenCalled();
  });

  it("dry-runs by listing installed shops without invoking setup", async () => {
    const deps = makeDeps();
    const options = parseCartTransformRepairEnv({
      WPB_CART_TRANSFORM_REPAIR_DRY_RUN: "true",
    });

    const result = await runCartTransformRepair(options, deps);

    expect(result).toMatchObject({
      mode: "dry-run",
      scannedShops: 2,
      succeededShops: 0,
      failedShops: 0,
    });
    expect(deps.prisma.shop.findMany).toHaveBeenCalledWith({
      where: { uninstalledAt: null },
      select: { shopDomain: true },
      orderBy: { shopDomain: "asc" },
    });
    expect(deps.completeSetup).not.toHaveBeenCalled();
  });

  it("applies by running complete setup with an app-context Admin client for each installed shop", async () => {
    const deps = makeDeps();
    const options = parseCartTransformRepairEnv({
      WPB_CART_TRANSFORM_REPAIR_APPLY: "true",
    });

    const result = await runCartTransformRepair(options, deps);

    expect(result).toMatchObject({
      mode: "apply",
      scannedShops: 2,
      succeededShops: 2,
      failedShops: 0,
    });
    expect(deps.getAdmin).toHaveBeenCalledWith("alpha.myshopify.com");
    expect(deps.getAdmin).toHaveBeenCalledWith("beta.myshopify.com");
    expect(deps.completeSetup).toHaveBeenCalledWith(
      expect.objectContaining({ graphql: expect.any(Function) }),
      "alpha.myshopify.com",
    );
    expect(deps.completeSetup).toHaveBeenCalledWith(
      expect.objectContaining({ graphql: expect.any(Function) }),
      "beta.myshopify.com",
    );
  });

  it("records setup failures and continues repairing remaining shops", async () => {
    const deps = makeDeps();
    deps.completeSetup
      .mockResolvedValueOnce({ success: false, error: "Function not found" })
      .mockResolvedValueOnce({ success: true, cartTransformId: "gid://shopify/CartTransform/2" });
    const options = parseCartTransformRepairEnv({
      WPB_CART_TRANSFORM_REPAIR_APPLY: "true",
    });

    const result = await runCartTransformRepair(options, deps);

    expect(result).toMatchObject({
      mode: "apply",
      scannedShops: 2,
      succeededShops: 1,
      failedShops: 1,
      failures: [
        {
          shopDomain: "alpha.myshopify.com",
          error: "Function not found",
        },
      ],
    });
    expect(deps.completeSetup).toHaveBeenCalledTimes(2);
  });
});
