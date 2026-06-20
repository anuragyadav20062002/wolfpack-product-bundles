import { configureStore } from "@reduxjs/toolkit";
import { adminApi } from "../../../app/store/api/adminApi";

function makeStore() {
  return configureStore({
    reducer: {
      [adminApi.reducerPath]: adminApi.reducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(adminApi.middleware),
  });
}

describe("adminApi", () => {
  beforeEach(() => {
    global.fetch = jest.fn(async () =>
      new Response(JSON.stringify({ ok: true, files: [], pageInfo: { hasNextPage: false, endCursor: null } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    ) as jest.Mock;
  });

  it("lists store files with cursor and query parameters", async () => {
    const store = makeStore();

    await store.dispatch(
      adminApi.endpoints.listStoreFiles.initiate({ cursor: "abc", query: "hero" }),
    );

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/app/store-files?cursor=abc&query=hero"),
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("uploads a store file as multipart form data", async () => {
    const store = makeStore();
    const form = new FormData();
    form.append("file", new Blob(["image"]), "image.png");

    await store.dispatch(adminApi.endpoints.uploadStoreFile.initiate(form));

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/app/upload-store-file"),
      expect.objectContaining({ method: "POST", body: form }),
    );
  });

  it("polls upload status by file ID", async () => {
    const store = makeStore();

    await store.dispatch(adminApi.endpoints.getUploadStoreFileStatus.initiate("gid://shopify/File/1"));

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(
        "/app/upload-store-file?fileId=gid%3A%2F%2Fshopify%2FFile%2F1",
      ),
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("ensures product template with a JSON POST body", async () => {
    const store = makeStore();

    await store.dispatch(
      adminApi.endpoints.ensureProductTemplate.initiate({
        productHandle: "starter-kit",
        bundleId: "bundle-1",
      }),
    );

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/ensure-product-template"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ productHandle: "starter-kit", bundleId: "bundle-1" }),
      }),
    );
  });
});
