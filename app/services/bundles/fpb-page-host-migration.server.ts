import { buildFpbStorefrontUrl } from "../../lib/fpb-storefront-url";

interface AdminGraphqlClient {
  graphql: (query: string, options?: { variables?: Record<string, unknown> }) => Promise<Response>;
}

export interface FpbPageHostMigrationBundle {
  id: string;
  shopId: string;
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

function proxyTarget(bundle: FpbPageHostMigrationBundle): string {
  return new URL(buildFpbStorefrontUrl(bundle.shopId, bundle.id)).pathname;
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
  if (input.bundle.shopifyProductHandle) {
    await ensureRedirect(
      input.admin,
      `/products/${input.bundle.shopifyProductHandle}`,
      target,
    );
  }

  await deletePageIfPresent(input.admin, input.bundle.shopifyPageId);
  await deletePageIfPresent(input.admin, input.bundle.shopifyPreviewPageId);

  await input.prisma.bundle.update({
    where: { id: input.bundle.id, shopId: input.bundle.shopId },
    data: {
      shopifyPageId: null,
      shopifyPageHandle: null,
      shopifyPreviewPageId: null,
      shopifyPreviewPageHandle: null,
    },
  });

  return { migrated: true, target };
}
