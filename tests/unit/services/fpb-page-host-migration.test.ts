import { migrateFpbPageHost } from "../../../app/services/bundles/fpb-page-host-migration.server";

function response(body: unknown) {
  return Promise.resolve(new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
  }));
}

function makeBundle() {
  return {
    id: "bundle-1",
    shopId: "test-shop.myshopify.com",
    shopifyProductId: "gid://shopify/Product/10",
    shopifyPageId: "gid://shopify/Page/1",
    shopifyPageHandle: "old-page",
    shopifyPreviewPageId: "gid://shopify/Page/2",
    shopifyPreviewPageHandle: "old-preview",
    shopifyProductHandle: "bundle-product",
  };
}

describe("FPB Page host migration", () => {
  it("ensures redirects before deleting Pages and clears references after cleanup", async () => {
    const calls: string[] = [];
    const redirects = new Map<string, { id: string; path: string; target: string }>();
    const admin = {
      graphql: jest.fn((query: string, options?: any) => {
        if (query.includes("FindUrlRedirect")) {
          calls.push("find-redirect");
          const path = String(options?.variables?.query).match(/path:"([^"]+)/)?.[1] ?? "";
          return response({ data: { urlRedirects: { nodes: redirects.has(path) ? [redirects.get(path)] : [] } } });
        }
        if (query.includes("CreateUrlRedirect")) {
          calls.push("create-redirect");
          const urlRedirect = options?.variables?.urlRedirect;
          const created = { id: `redirect-${redirects.size + 1}`, ...urlRedirect };
          redirects.set(urlRedirect.path, created);
          return response({ data: { urlRedirectCreate: { urlRedirect: created, userErrors: [] } } });
        }
        if (query.includes("GetFpbParentProductHandle")) {
          calls.push("load-parent-handle");
          return response({ data: { product: { id: "gid://shopify/Product/10", handle: "bundle-product" } } });
        }
        if (query.includes("UpdateFpbParentProductHandle")) {
          calls.push("update-parent-handle");
          return response({ data: { productUpdate: { product: { id: "gid://shopify/Product/10", handle: "wpb-parent-bundle-1" }, userErrors: [] } } });
        }
        calls.push("delete-page");
        return response({ data: { pageDelete: { deletedPageId: "page", userErrors: [] } } });
      }),
    };
    const prisma = { bundle: { update: jest.fn().mockImplementation(() => {
      calls.push("clear-references");
      return Promise.resolve({});
    }) } };

    await migrateFpbPageHost({ admin, prisma, bundle: makeBundle() });

    expect(calls).toEqual([
      "find-redirect", "create-redirect",
      "load-parent-handle",
      "find-redirect", "create-redirect",
      "update-parent-handle",
      "find-redirect",
      "delete-page", "delete-page", "clear-references",
    ]);
    expect(admin.graphql).toHaveBeenCalledWith(
      expect.stringContaining("UpdateFpbParentProductHandle"),
      {
        variables: {
          product: {
            id: "gid://shopify/Product/10",
            handle: "wpb-parent-bundle-1",
            redirectNewHandle: false,
          },
        },
      },
    );
    expect(prisma.bundle.update).toHaveBeenCalledWith(expect.objectContaining({
      data: {
        shopifyPageId: null,
        shopifyPageHandle: null,
        shopifyPreviewPageId: null,
        shopifyPreviewPageHandle: null,
        shopifyProductHandle: "wpb-parent-bundle-1",
      },
    }));
  });

  it("does not delete Pages or clear references when a redirect fails", async () => {
    const admin = {
      graphql: jest.fn((query: string) => {
        if (query.includes("FindUrlRedirect")) {
          return response({ data: { urlRedirects: { nodes: [] } } });
        }
        return response({ data: { urlRedirectCreate: { urlRedirect: null, userErrors: [{ message: "taken" }] } } });
      }),
    };
    const prisma = { bundle: { update: jest.fn() } };

    await expect(migrateFpbPageHost({ admin, prisma, bundle: makeBundle() }))
      .rejects.toThrow("Failed to ensure redirect");

    expect(admin.graphql).not.toHaveBeenCalledWith(expect.stringContaining("DeletePage"), expect.anything());
    expect(prisma.bundle.update).not.toHaveBeenCalled();
  });

  it("accepts already-correct redirects and already-deleted Pages", async () => {
    const bundle = { ...makeBundle(), shopifyProductHandle: "wpb-parent-bundle-1" };
    const target = "/apps/product-bundles/wpb/bundle-1";
    const admin = {
      graphql: jest.fn((query: string, options?: any) => {
        if (query.includes("FindUrlRedirect")) {
          const path = String(options?.variables?.query).includes("/pages/")
            ? "/pages/old-page"
            : "/products/wpb-parent-bundle-1";
          return response({ data: { urlRedirects: { nodes: [{ id: "redirect-1", path, target }] } } });
        }
        if (query.includes("GetFpbParentProductHandle")) {
          return response({ data: { product: { id: bundle.shopifyProductId, handle: "wpb-parent-bundle-1" } } });
        }
        return response({ data: { pageDelete: { deletedPageId: null, userErrors: [{ code: "NOT_FOUND", message: "Page not found" }] } } });
      }),
    };
    const prisma = { bundle: { update: jest.fn().mockResolvedValue({}) } };

    await expect(migrateFpbPageHost({ admin, prisma, bundle })).resolves.toMatchObject({ migrated: true });
    expect(admin.graphql).not.toHaveBeenCalledWith(expect.stringContaining("CreateUrlRedirect"), expect.anything());
    expect(admin.graphql).not.toHaveBeenCalledWith(expect.stringContaining("UpdateUrlRedirect"), expect.anything());
    expect(admin.graphql).not.toHaveBeenCalledWith(expect.stringContaining("UpdateFpbParentProductHandle"), expect.anything());
    expect(prisma.bundle.update).toHaveBeenCalled();
  });

  it("does not delete Pages or clear references when the parent handle update fails", async () => {
    const admin = {
      graphql: jest.fn((query: string, options?: any) => {
        if (query.includes("FindUrlRedirect")) {
          return response({ data: { urlRedirects: { nodes: [] } } });
        }
        if (query.includes("CreateUrlRedirect")) {
          return response({ data: { urlRedirectCreate: { urlRedirect: { id: "redirect-1", ...options?.variables?.urlRedirect }, userErrors: [] } } });
        }
        if (query.includes("GetFpbParentProductHandle")) {
          return response({ data: { product: { id: "gid://shopify/Product/10", handle: "bundle-product" } } });
        }
        if (query.includes("UpdateFpbParentProductHandle")) {
          return response({ data: { productUpdate: { product: null, userErrors: [{ message: "Handle is taken" }] } } });
        }
        throw new Error(`Unexpected operation: ${query}`);
      }),
    };
    const prisma = { bundle: { update: jest.fn() } };

    await expect(migrateFpbPageHost({ admin, prisma, bundle: makeBundle() }))
      .rejects.toThrow("Failed to move FPB parent product");

    expect(admin.graphql).not.toHaveBeenCalledWith(expect.stringContaining("DeletePage"), expect.anything());
    expect(prisma.bundle.update).not.toHaveBeenCalled();
  });

  it("recovers when Shopify already has the internal handle but the DB still has the old handle", async () => {
    const bundle = makeBundle();
    const target = "/apps/product-bundles/wpb/bundle-1";
    const admin = {
      graphql: jest.fn((query: string, options?: any) => {
        if (query.includes("FindUrlRedirect")) {
          const path = String(options?.variables?.query).includes("/pages/")
            ? "/pages/old-page"
            : "/products/bundle-product";
          return response({ data: { urlRedirects: { nodes: [{ id: "redirect-1", path, target }] } } });
        }
        if (query.includes("GetFpbParentProductHandle")) {
          return response({ data: { product: { id: bundle.shopifyProductId, handle: "wpb-parent-bundle-1" } } });
        }
        return response({ data: { pageDelete: { deletedPageId: "page", userErrors: [] } } });
      }),
    };
    const prisma = { bundle: { update: jest.fn().mockResolvedValue({}) } };

    await migrateFpbPageHost({ admin, prisma, bundle });

    expect(admin.graphql).not.toHaveBeenCalledWith(expect.stringContaining("UpdateFpbParentProductHandle"), expect.anything());
    expect(prisma.bundle.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ shopifyProductHandle: "wpb-parent-bundle-1" }),
    }));
  });

  it("keeps the stored redirect and allows normal sync to recreate a deleted parent", async () => {
    const admin = {
      graphql: jest.fn((query: string, options?: any) => {
        if (query.includes("FindUrlRedirect")) {
          return response({ data: { urlRedirects: { nodes: [] } } });
        }
        if (query.includes("CreateUrlRedirect")) {
          return response({ data: { urlRedirectCreate: { urlRedirect: { id: "redirect-1", ...options?.variables?.urlRedirect }, userErrors: [] } } });
        }
        if (query.includes("GetFpbParentProductHandle")) {
          return response({ data: { product: null } });
        }
        return response({ data: { pageDelete: { deletedPageId: "page", userErrors: [] } } });
      }),
    };
    const prisma = { bundle: { update: jest.fn().mockResolvedValue({}) } };

    await migrateFpbPageHost({ admin, prisma, bundle: makeBundle() });

    expect(admin.graphql).not.toHaveBeenCalledWith(expect.stringContaining("UpdateFpbParentProductHandle"), expect.anything());
    expect(prisma.bundle.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.not.objectContaining({ shopifyProductHandle: expect.anything() }),
    }));
  });
});
