import { buildFpbStorefrontUrl } from "../../lib/fpb-storefront-url";

interface AdminGraphqlClient {
  graphql: (query: string, options?: { variables?: Record<string, unknown> }) => Promise<Response>;
}

export interface FpbPageHostMigrationBundle {
  id: string;
  shopId: string;
  shopifyProductId: string | null;
  shopifyPageId: string | null;
  shopifyPageHandle: string | null;
  shopifyPreviewPageId: string | null;
  shopifyPreviewPageHandle: string | null;
  shopifyProductHandle: string | null;
}

interface MigrationPrismaClient {
  bundle: {
    update: (args: unknown) => Promise<unknown>;
  };
}

const FIND_REDIRECT = `#graphql
  query FindUrlRedirect($query: String!) {
    urlRedirects(first: 10, query: $query) {
      nodes { id path target }
    }
  }
`;

const CREATE_REDIRECT = `#graphql
  mutation CreateUrlRedirect($urlRedirect: UrlRedirectInput!) {
    urlRedirectCreate(urlRedirect: $urlRedirect) {
      urlRedirect { id path target }
      userErrors { code field message }
    }
  }
`;

const UPDATE_REDIRECT = `#graphql
  mutation UpdateUrlRedirect($id: ID!, $urlRedirect: UrlRedirectInput!) {
    urlRedirectUpdate(id: $id, urlRedirect: $urlRedirect) {
      urlRedirect { id path target }
      userErrors { code field message }
    }
  }
`;

const DELETE_PAGE = `#graphql
  mutation DeletePage($id: ID!) {
    pageDelete(id: $id) {
      deletedPageId
      userErrors { code field message }
    }
  }
`;

const GET_PARENT_PRODUCT_HANDLE = `#graphql
  query GetFpbParentProductHandle($id: ID!) {
    product(id: $id) { id handle }
  }
`;

const UPDATE_PARENT_PRODUCT_HANDLE = `#graphql
  mutation UpdateFpbParentProductHandle($product: ProductUpdateInput!) {
    productUpdate(product: $product) {
      product { id handle }
      userErrors { field message }
    }
  }
`;

function proxyTarget(bundle: FpbPageHostMigrationBundle): string {
  return new URL(buildFpbStorefrontUrl(bundle.shopId, bundle.id)).pathname;
}

export function buildFpbInternalParentHandle(bundleId: string): string {
  const normalizedBundleId = bundleId
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `wpb-parent-${normalizedBundleId}`;
}

function isInternalParentHandle(handle: string, canonicalHandle: string): boolean {
  return handle === canonicalHandle || handle.startsWith(`${canonicalHandle}-`);
}

export function isFpbInternalParentHandle(bundleId: string, handle: string): boolean {
  return isInternalParentHandle(handle, buildFpbInternalParentHandle(bundleId));
}

async function ensureRedirect(
  admin: AdminGraphqlClient,
  path: string,
  target: string,
): Promise<void> {
  const findResponse = await admin.graphql(FIND_REDIRECT, {
    variables: { query: `path:${JSON.stringify(path)}` },
  });
  const findData = await findResponse.json() as any;
  const existing = findData.data?.urlRedirects?.nodes?.find(
    (redirect: { path: string }) => redirect.path === path,
  );
  if (existing?.target === target) return;

  const response = existing
    ? await admin.graphql(UPDATE_REDIRECT, {
        variables: { id: existing.id, urlRedirect: { path, target } },
      })
    : await admin.graphql(CREATE_REDIRECT, {
        variables: { urlRedirect: { path, target } },
      });
  const data = await response.json() as any;
  const payload = existing ? data.data?.urlRedirectUpdate : data.data?.urlRedirectCreate;
  const errors = payload?.userErrors ?? [];
  if (errors.length > 0 || !payload?.urlRedirect) {
    throw new Error(`Failed to ensure redirect ${path}: ${errors[0]?.message ?? "unknown error"}`);
  }
}

async function deletePageIfPresent(
  admin: AdminGraphqlClient,
  pageId: string | null,
): Promise<void> {
  if (!pageId) return;
  const response = await admin.graphql(DELETE_PAGE, { variables: { id: pageId } });
  const data = await response.json() as any;
  const payload = data.data?.pageDelete;
  const errors = payload?.userErrors ?? [];
  const alreadyDeleted = errors.length > 0 && errors.every(
    (error: { code?: string; message?: string }) =>
      error.code === "NOT_FOUND" || /not found|does not exist/i.test(error.message ?? ""),
  );
  if (errors.length > 0 && !alreadyDeleted) {
    throw new Error(`Failed to delete Page ${pageId}: ${errors[0]?.message}`);
  }
}

export async function ensureFpbParentProductHost(input: {
  admin: AdminGraphqlClient;
  bundleId: string;
  shopId: string;
  productId: string | null;
  storedHandle: string | null;
  liveHandle?: string | null;
}) {
  const target = new URL(buildFpbStorefrontUrl(input.shopId, input.bundleId)).pathname;
  const canonicalHandle = buildFpbInternalParentHandle(input.bundleId);
  let liveHandle = input.liveHandle;

  if (liveHandle === undefined && input.productId) {
    const response = await input.admin.graphql(GET_PARENT_PRODUCT_HANDLE, {
      variables: { id: input.productId },
    });
    const data = await response.json() as any;
    if (data.errors?.length) {
      throw new Error(`Failed to load FPB parent product: ${data.errors[0]?.message ?? "unknown error"}`);
    }
    liveHandle = data.data?.product?.handle ?? null;
  }

  const legacyHandles = [...new Set([input.storedHandle, liveHandle])]
    .filter((handle): handle is string =>
      Boolean(handle) && !isInternalParentHandle(handle as string, canonicalHandle));

  for (const handle of legacyHandles) {
    await ensureRedirect(input.admin, `/products/${handle}`, target);
  }

  if (!liveHandle || isInternalParentHandle(liveHandle, canonicalHandle)) {
    return { handle: liveHandle ?? null, renamed: false, target };
  }
  if (!input.productId) {
    throw new Error("Failed to move FPB parent product: missing Shopify product ID");
  }

  const response = await input.admin.graphql(UPDATE_PARENT_PRODUCT_HANDLE, {
    variables: {
      product: {
        id: input.productId,
        handle: canonicalHandle,
        redirectNewHandle: false,
      },
    },
  });
  const data = await response.json() as any;
  const payload = data.data?.productUpdate;
  const errors = [...(data.errors ?? []), ...(payload?.userErrors ?? [])];
  const updatedHandle = payload?.product?.handle;
  if (
    errors.length > 0
    || typeof updatedHandle !== "string"
    || !isInternalParentHandle(updatedHandle, canonicalHandle)
  ) {
    throw new Error(
      `Failed to move FPB parent product: ${errors[0]?.message ?? "Shopify returned an unexpected handle"}`,
    );
  }

  for (const handle of legacyHandles) {
    await ensureRedirect(input.admin, `/products/${handle}`, target);
  }

  return { handle: updatedHandle, renamed: true, target };
}

export async function migrateFpbPageHost(input: {
  admin: AdminGraphqlClient;
  prisma: MigrationPrismaClient;
  bundle: FpbPageHostMigrationBundle;
}) {
  const target = proxyTarget(input.bundle);

  if (input.bundle.shopifyPageHandle) {
    await ensureRedirect(
      input.admin,
      `/pages/${input.bundle.shopifyPageHandle}`,
      target,
    );
  }
  const parentHost = await ensureFpbParentProductHost({
    admin: input.admin,
    bundleId: input.bundle.id,
    shopId: input.bundle.shopId,
    productId: input.bundle.shopifyProductId,
    storedHandle: input.bundle.shopifyProductHandle,
  });

  await deletePageIfPresent(input.admin, input.bundle.shopifyPageId);
  await deletePageIfPresent(input.admin, input.bundle.shopifyPreviewPageId);

  await input.prisma.bundle.update({
    where: { id: input.bundle.id, shopId: input.bundle.shopId },
    data: {
      shopifyPageId: null,
      shopifyPageHandle: null,
      shopifyPreviewPageId: null,
      shopifyPreviewPageHandle: null,
      ...(parentHost.handle ? { shopifyProductHandle: parentHost.handle } : {}),
    },
  });

  return { migrated: true, target };
}
