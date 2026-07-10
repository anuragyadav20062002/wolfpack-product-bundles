import {
  DEPLOYMENT_BACKFILL_CONFIRMATION,
  parseDeploymentBackfillEnv,
  runDeploymentBackfill,
} from "../../../app/services/deployment-backfill.server";

function makeDeps() {
  const admin = { graphql: jest.fn() };
  return {
    prisma: {
      shop: {
        findMany: jest.fn().mockResolvedValue([
          { shopDomain: "alpha.myshopify.com" },
          { shopDomain: "beta.myshopify.com" },
        ]),
      },
      bundle: {
        findMany: jest.fn().mockResolvedValue([
          { id: "bundle-1", shopId: "alpha.myshopify.com", bundleType: "full_page" },
          { id: "bundle-2", shopId: "beta.myshopify.com", bundleType: "product_page" },
        ]),
      },
    },
    getAdmin: jest.fn().mockResolvedValue(admin),
    syncBundle: jest.fn().mockResolvedValue({ synced: true }),
    logger: {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    },
  };
}

describe("deployment backfill", () => {
  it("is disabled by default and does not scan shops", async () => {
    const deps = makeDeps();
    const options = parseDeploymentBackfillEnv({});

    const result = await runDeploymentBackfill(options, deps);

    expect(result.mode).toBe("disabled");
    expect(result.scannedShops).toBe(0);
    expect(deps.prisma.shop.findMany).not.toHaveBeenCalled();
    expect(deps.syncBundle).not.toHaveBeenCalled();
  });

  it("requires explicit confirmation before applying changes", async () => {
    const deps = makeDeps();
    const options = parseDeploymentBackfillEnv({
      WPB_DEPLOYMENT_BACKFILL_ENABLED: "true",
      WPB_DEPLOYMENT_BACKFILL_APPLY: "true",
    });

    await expect(runDeploymentBackfill(options, deps)).rejects.toThrow(
      DEPLOYMENT_BACKFILL_CONFIRMATION,
    );
    expect(deps.syncBundle).not.toHaveBeenCalled();
  });

  it("dry-runs by listing targets without invoking sync functions", async () => {
    const deps = makeDeps();
    const options = parseDeploymentBackfillEnv({
      WPB_DEPLOYMENT_BACKFILL_ENABLED: "true",
    });

    const result = await runDeploymentBackfill(options, deps);

    expect(result).toMatchObject({
      mode: "dry-run",
      scannedShops: 2,
      scannedBundles: 2,
      syncedBundles: 0,
      failedBundles: 0,
    });
    expect(deps.syncBundle).not.toHaveBeenCalled();
  });

  it("applies by syncing each bundle with an offline Admin client for its shop", async () => {
    const deps = makeDeps();
    const options = parseDeploymentBackfillEnv({
      WPB_DEPLOYMENT_BACKFILL_ENABLED: "true",
      WPB_DEPLOYMENT_BACKFILL_APPLY: "true",
      WPB_DEPLOYMENT_BACKFILL_CONFIRM: DEPLOYMENT_BACKFILL_CONFIRMATION,
    });

    const result = await runDeploymentBackfill(options, deps);

    expect(result).toMatchObject({
      mode: "apply",
      scannedShops: 2,
      scannedBundles: 2,
      syncedBundles: 2,
      failedBundles: 0,
    });
    expect(deps.getAdmin).toHaveBeenCalledWith("alpha.myshopify.com");
    expect(deps.getAdmin).toHaveBeenCalledWith("beta.myshopify.com");
    expect(deps.syncBundle).toHaveBeenCalledWith({
      admin: expect.objectContaining({ graphql: expect.any(Function) }),
      shopDomain: "alpha.myshopify.com",
      bundleId: "bundle-1",
      bundleType: "full_page",
      reason: "sync_bundle",
    });
    expect(deps.syncBundle).toHaveBeenCalledWith({
      admin: expect.objectContaining({ graphql: expect.any(Function) }),
      shopDomain: "beta.myshopify.com",
      bundleId: "bundle-2",
      bundleType: "product_page",
      reason: "sync_bundle",
    });
  });

  it("can limit the run to a single shop from env", async () => {
    const deps = makeDeps();
    const options = parseDeploymentBackfillEnv({
      WPB_DEPLOYMENT_BACKFILL_ENABLED: "true",
      WPB_DEPLOYMENT_BACKFILL_SHOP: "alpha.myshopify.com",
      WPB_DEPLOYMENT_BACKFILL_LIMIT: "1",
    });

    await runDeploymentBackfill(options, deps);

    expect(deps.prisma.shop.findMany).not.toHaveBeenCalled();
    expect(deps.prisma.bundle.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 1,
        where: expect.objectContaining({
          shopId: { in: ["alpha.myshopify.com"] },
        }),
      }),
    );
  });
});
