import { validateProductBundleWidgetSetup } from "../../../app/services/widget-installation/widget-product-bundle.server";

type AdminClient = Parameters<typeof validateProductBundleWidgetSetup>[0];

function makeAdmin(responses: unknown[]) {
  let callIndex = 0;
  return {
    graphql: jest.fn().mockImplementation(() => {
      const body = responses[callIndex++] ?? { data: null };
      return Promise.resolve({ json: async () => body });
    }),
  };
}

function makeSeedResponse(templateSuffix: string | null = null) {
  return {
    data: {
      currentAppInstallation: {
        app: { handle: "wolfpack-product-bundles-sit" },
      },
      product: {
        id: "gid://shopify/Product/10307255992615",
        handle: "pdp-ayg",
        templateSuffix,
      },
      themes: {
        nodes: [{ id: "gid://shopify/OnlineStoreTheme/184666030375" }],
      },
    },
  };
}

function makeTemplateResponse(content?: string) {
  return {
    data: {
      theme: {
        files: {
          nodes:
            content === undefined
              ? []
              : [
                  {
                    filename: "templates/product.json",
                    body: { content },
                  },
                ],
        },
      },
    },
  };
}

describe("validateProductBundleWidgetSetup", () => {
  it("reports the widget installed when the effective product template contains the PPB app block", async () => {
    const admin = makeAdmin([
      makeSeedResponse(),
      makeTemplateResponse(
        JSON.stringify({
          sections: {
            apps: {
              type: "apps",
              blocks: {
                widget: {
                  type: "shopify://apps/wolfpack-product-bundles-sit/blocks/bundle-product-page/uid",
                },
              },
            },
          },
        })
      ),
    ]);

    await expect(
      validateProductBundleWidgetSetup(
        admin as unknown as AdminClient,
        "clothingstoretest1234.myshopify.com",
        "test-api-key",
        "bundle-1",
        "gid://shopify/Product/10307255992615"
      )
    ).resolves.toMatchObject({
      widgetInstalled: true,
      requiresOneTimeSetup: false,
      productUrl:
        "https://clothingstoretest1234.myshopify.com/products/pdp-ayg",
    });
  });

  it("requires placement when the effective product template lacks the PPB app block", async () => {
    const admin = makeAdmin([
      makeSeedResponse(),
      makeTemplateResponse(
        JSON.stringify({ sections: { main: { type: "main-product" } } })
      ),
    ]);

    const result = await validateProductBundleWidgetSetup(
      admin as unknown as AdminClient,
      "clothingstoretest1234.myshopify.com",
      "test-api-key",
      "bundle-1",
      "gid://shopify/Product/10307255992615"
    );

    expect(result).toMatchObject({
      widgetInstalled: false,
      requiresOneTimeSetup: true,
    });
    expect(result.installationLink).toContain("template=product");
    expect(result.installationLink).toContain(
      "addAppBlockId=test-api-key%2Fbundle-product-page"
    );
    expect(result.installationLink).toContain("target=newAppsSection");
    expect(result.installationLink).toContain(
      "previewPath=%2Fproducts%2Fpdp-ayg"
    );
  });

  it("reads the product's assigned custom template", async () => {
    const admin = makeAdmin([
      makeSeedResponse("custom-product"),
      makeTemplateResponse(JSON.stringify({ sections: {} })),
    ]);

    await validateProductBundleWidgetSetup(
      admin as unknown as AdminClient,
      "clothingstoretest1234.myshopify.com",
      "test-api-key",
      "bundle-1",
      "gid://shopify/Product/10307255992615"
    );

    expect(admin.graphql).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("files(filenames: $filenames)"),
      {
        variables: {
          themeId: "gid://shopify/OnlineStoreTheme/184666030375",
          filenames: ["templates/product.custom-product.json"],
        },
      }
    );
  });

  it("fails closed when the effective product template cannot be read", async () => {
    const admin = makeAdmin([makeSeedResponse(), makeTemplateResponse()]);

    await expect(
      validateProductBundleWidgetSetup(
        admin as unknown as AdminClient,
        "clothingstoretest1234.myshopify.com",
        "test-api-key",
        "bundle-1",
        "gid://shopify/Product/10307255992615"
      )
    ).resolves.toMatchObject({
      widgetInstalled: false,
      requiresOneTimeSetup: true,
    });
  });

  it("does not accept the same block handle from a different app", async () => {
    const admin = makeAdmin([
      makeSeedResponse(),
      makeTemplateResponse(
        JSON.stringify({
          sections: {
            apps: {
              type: "apps",
              blocks: {
                widget: {
                  type: "shopify://apps/different-app/blocks/bundle-product-page/uid",
                },
              },
            },
          },
        })
      ),
    ]);

    await expect(
      validateProductBundleWidgetSetup(
        admin as unknown as AdminClient,
        "clothingstoretest1234.myshopify.com",
        "test-api-key",
        "bundle-1",
        "gid://shopify/Product/10307255992615"
      )
    ).resolves.toMatchObject({
      widgetInstalled: false,
      requiresOneTimeSetup: true,
    });
  });
});
