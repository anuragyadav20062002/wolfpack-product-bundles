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
    const admin = {
      graphql: jest.fn((query: string) => {
        if (query.includes("FindUrlRedirect")) {
          calls.push("find-redirect");
          return response({ data: { urlRedirects: { nodes: [] } } });
        }
        if (query.includes("CreateUrlRedirect")) {
          calls.push("create-redirect");
          return response({ data: { urlRedirectCreate: { urlRedirect: { id: "redirect-1" }, userErrors: [] } } });
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
      "find-redirect", "create-redirect",
      "delete-page", "delete-page", "clear-references",
    ]);
    expect(prisma.bundle.update).toHaveBeenCalledWith(expect.objectContaining({
      data: {
        shopifyPageId: null,
        shopifyPageHandle: null,
        shopifyPreviewPageId: null,
        shopifyPreviewPageHandle: null,
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
        return response({ data: { pageDelete: { deletedPageId: null, userErrors: [{ code: "NOT_FOUND", message: "Page not found" }] } } });
      }),
    };
    const prisma = { bundle: { update: jest.fn().mockResolvedValue({}) } };

    await expect(migrateFpbPageHost({ admin, prisma, bundle })).resolves.toMatchObject({ migrated: true });
    expect(admin.graphql).not.toHaveBeenCalledWith(expect.stringContaining("CreateUrlRedirect"), expect.anything());
    expect(admin.graphql).not.toHaveBeenCalledWith(expect.stringContaining("UpdateUrlRedirect"), expect.anything());
    expect(prisma.bundle.update).toHaveBeenCalled();
  });
});
