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
          { id: "bundle-1", shopId: "alpha.myshopify.com", bundleType: "full_page", shopifyProductId: "product-1", shopifyPageId: "page-1", shopifyPageHandle: "old-page", shopifyPreviewPageId: "preview-1", shopifyPreviewPageHandle: "preview-page", shopifyProductHandle: "bundle-product" },
          { id: "bundle-2", shopId: "beta.myshopify.com", bundleType: "product_page", shopifyProductId: "product-2", shopifyPageId: null, shopifyPageHandle: null, shopifyPreviewPageId: null, shopifyPreviewPageHandle: null, shopifyProductHandle: "ppb" },
        ]),
        update: jest.fn(),
      },
    },
    getAdmin: jest.fn().mockResolvedValue(admin),
    replaceCartTransform: jest.fn().mockResolvedValue({
      success: true,
      cartTransformId: "gid://shopify/CartTransform/replaced",
    }),
    syncBundle: jest.fn().mockResolvedValue({ synced: true }),
    migrateFpbPageHost: jest.fn().mockResolvedValue({ migrated: true }),
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
    expect(deps.replaceCartTransform).not.toHaveBeenCalled();
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
      failedShops: 0,
      cartTransformsToReplace: 2,
      cartTransformsReplaced: 0,
      fpbProxyMigrations: 1,
      publicPagesToDelete: 1,
      previewPagesToDelete: 1,
      pageRedirectsToCreate: 1,
      productRedirectsToUpdate: 1,
      productHandlesToInternalize: 1,
    });
    expect(deps.replaceCartTransform).not.toHaveBeenCalled();
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
      failedShops: 0,
      cartTransformsToReplace: 2,
      cartTransformsReplaced: 2,
    });
    expect(deps.getAdmin).toHaveBeenCalledWith("alpha.myshopify.com");
    expect(deps.getAdmin).toHaveBeenCalledWith("beta.myshopify.com");
    expect(deps.replaceCartTransform).toHaveBeenCalledWith(
      expect.objectContaining({ graphql: expect.any(Function) }),
      "alpha.myshopify.com",
    );
    expect(deps.replaceCartTransform).toHaveBeenCalledWith(
      expect.objectContaining({ graphql: expect.any(Function) }),
      "beta.myshopify.com",
    );
    expect(deps.replaceCartTransform.mock.invocationCallOrder[0]).toBeLessThan(
      deps.syncBundle.mock.invocationCallOrder[0],
    );
    expect(deps.migrateFpbPageHost).toHaveBeenCalledWith({
      admin: expect.objectContaining({ graphql: expect.any(Function) }),
      prisma: deps.prisma,
      bundle: expect.objectContaining({ id: "bundle-1" }),
    });
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

  it("skips a shop's bundles and records a shop failure when replacement fails", async () => {
    const deps = makeDeps();
    deps.replaceCartTransform
      .mockResolvedValueOnce({ success: false, error: "replacement failed" })
      .mockResolvedValueOnce({
        success: true,
        cartTransformId: "gid://shopify/CartTransform/beta",
      });
    const options = parseDeploymentBackfillEnv({
      WPB_DEPLOYMENT_BACKFILL_ENABLED: "true",
      WPB_DEPLOYMENT_BACKFILL_APPLY: "true",
      WPB_DEPLOYMENT_BACKFILL_CONFIRM: DEPLOYMENT_BACKFILL_CONFIRMATION,
    });

    const result = await runDeploymentBackfill(options, deps);

    expect(result).toMatchObject({
      failedShops: 1,
      cartTransformsToReplace: 2,
      cartTransformsReplaced: 1,
      shopFailures: [{
        shopDomain: "alpha.myshopify.com",
        error: "replacement failed",
      }],
    });
    expect(deps.migrateFpbPageHost).not.toHaveBeenCalled();
    expect(deps.syncBundle).not.toHaveBeenCalledWith(
      expect.objectContaining({ shopDomain: "alpha.myshopify.com" }),
    );
    expect(deps.syncBundle).toHaveBeenCalledWith(
      expect.objectContaining({ shopDomain: "beta.myshopify.com" }),
    );
  });

  it("replaces CartTransforms for selected shops that have no bundles", async () => {
    const deps = makeDeps();
    deps.prisma.bundle.findMany.mockResolvedValueOnce([]);
    const options = parseDeploymentBackfillEnv({
      WPB_DEPLOYMENT_BACKFILL_ENABLED: "true",
      WPB_DEPLOYMENT_BACKFILL_APPLY: "true",
      WPB_DEPLOYMENT_BACKFILL_CONFIRM: DEPLOYMENT_BACKFILL_CONFIRMATION,
    });

    const result = await runDeploymentBackfill(options, deps);

    expect(result).toMatchObject({
      scannedShops: 2,
      scannedBundles: 0,
      cartTransformsToReplace: 2,
      cartTransformsReplaced: 2,
    });
    expect(deps.replaceCartTransform).toHaveBeenCalledTimes(2);
    expect(deps.syncBundle).not.toHaveBeenCalled();
  });

  it("does not sync an FPB when host migration fails", async () => {
    const deps = makeDeps();
    deps.migrateFpbPageHost.mockRejectedValueOnce(new Error("redirect failed"));
    const options = parseDeploymentBackfillEnv({
      WPB_DEPLOYMENT_BACKFILL_ENABLED: "true",
      WPB_DEPLOYMENT_BACKFILL_APPLY: "true",
      WPB_DEPLOYMENT_BACKFILL_CONFIRM: DEPLOYMENT_BACKFILL_CONFIRMATION,
    });

    const result = await runDeploymentBackfill(options, deps);

    expect(result.failedBundles).toBe(1);
    expect(deps.syncBundle).not.toHaveBeenCalledWith(expect.objectContaining({ bundleId: "bundle-1" }));
    expect(deps.syncBundle).toHaveBeenCalledWith(expect.objectContaining({ bundleId: "bundle-2" }));
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
