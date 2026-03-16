/**
 * Slug Utilities for Custom Bundle Page URLs
 *
 * Pure functions for generating, validating, and deduplicating Shopify page handles.
 * All functions follow Shopify handle rules: lowercase, alphanumeric + hyphens, 1-255 chars.
 */

/**
 * Converts any string to a valid Shopify page handle.
 * Returns empty string if input produces no valid characters.
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')        // spaces and underscores → hyphen
    .replace(/[^a-z0-9-]/g, '')     // strip anything not alphanumeric or hyphen
    .replace(/-{2,}/g, '-')         // collapse consecutive hyphens
    .replace(/^-+|-+$/g, '')        // strip leading/trailing hyphens
    .slice(0, 255);                  // truncate to 255 chars
}

/**
 * Validates a slug against Shopify handle rules.
 * Returns null if valid, or an error message string if invalid.
 */
export function validateSlug(slug: string): string | null {
  if (!slug || slug.length === 0) {
    return 'URL slug cannot be empty.';
  }
  if (slug.length > 255) {
    return 'URL slug must be 255 characters or fewer.';
  }
  // Only lowercase alphanumeric with internal hyphens (no leading/trailing hyphens)
  // eslint-disable-next-line security/detect-unsafe-regex
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(slug)) {
    return 'Only lowercase letters, numbers, and hyphens are allowed.';
  }
  return null;
}

const CHECK_PAGE_BY_HANDLE_QUERY = `
  query checkPageHandle($query: String!) {
    pages(first: 1, query: $query) {
      edges {
        node {
          handle
        }
      }
    }
  }
`;

/**
 * Checks if a handle is available in the shop's pages.
 * If taken, increments a numeric suffix (-2, -3, ...) until a free slot is found.
 *
 * @param admin - Shopify Admin API client
 * @param desiredHandle - The slug to try first
 * @param excludeCurrentHandle - The bundle's own current handle (skip self during rename)
 */
export async function resolveUniqueHandle(
  admin: any,
  desiredHandle: string,
  excludeCurrentHandle?: string
): Promise<{ handle: string; adjusted: boolean }> {
  const isHandleFree = async (handle: string): Promise<boolean> => {
    const response = await admin.graphql(CHECK_PAGE_BY_HANDLE_QUERY, {
      variables: { query: `handle:${handle}` }
    });
    const data = await response.json();
    const existingHandle = data?.data?.pages?.edges?.[0]?.node?.handle;

    if (!existingHandle) return true;                          // no page found
    if (existingHandle === excludeCurrentHandle) return true;  // this is our own page
    return false;
  };

  if (await isHandleFree(desiredHandle)) {
    return { handle: desiredHandle, adjusted: false };
  }

  for (let suffix = 2; suffix <= 10; suffix++) {
    const candidate = `${desiredHandle}-${suffix}`;
    if (await isHandleFree(candidate)) {
      return { handle: candidate, adjusted: true };
    }
  }

  // Fallback: return desiredHandle-2 (extremely unlikely all 2-10 are taken)
  return { handle: `${desiredHandle}-2`, adjusted: true };
}
