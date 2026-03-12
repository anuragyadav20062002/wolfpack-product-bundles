/**
 * UTM Attribution Pixel Activation Service
 *
 * Encapsulates lifecycle management for the Wolfpack UTM web pixel.
 * Called from:
 *  - app.attribution.tsx action handler (enable/disable toggle)
 *  - api.activate-pixel route (manual re-activation for existing stores)
 */

export interface PixelActivationResult {
  success: boolean;
  pixelId?: string;
  deleted?: boolean;
  error?: string;
}

export interface PixelStatus {
  active: boolean;
  pixelId: string | null;
}

export interface PixelDeactivationResult {
  success: boolean;
  error?: string;
}

/**
 * Queries the live pixel status from Shopify's Admin API.
 * Returns active:false (not an error) when no pixel exists.
 */
export async function getPixelStatus(admin: any): Promise<PixelStatus> {
  try {
    const response = await admin.graphql(`query { webPixel { id } }`);
    const data = await response.json();
    const pixelId = data.data?.webPixel?.id ?? null;
    return { active: pixelId !== null, pixelId };
  } catch {
    return { active: false, pixelId: null };
  }
}

/**
 * Deletes the web pixel for this shop, disabling UTM tracking.
 * Returns success:true if the pixel was deleted or did not exist.
 */
export async function deactivateUtmPixel(admin: any): Promise<PixelDeactivationResult> {
  // Query for existing pixel first
  let existingPixelId: string | null = null;
  try {
    const response = await admin.graphql(`query { webPixel { id } }`);
    const data = await response.json();
    existingPixelId = data.data?.webPixel?.id ?? null;
  } catch {
    // No pixel exists — already inactive
    return { success: true };
  }

  if (!existingPixelId) {
    return { success: true };
  }

  const deleteResponse = await admin.graphql(
    `mutation webPixelDelete($id: ID!) {
      webPixelDelete(id: $id) {
        userErrors { field message code }
        deletedWebPixelId
      }
    }`,
    { variables: { id: existingPixelId } }
  );
  const deleteData = await deleteResponse.json();
  const userErrors = deleteData.data?.webPixelDelete?.userErrors ?? [];

  if (userErrors.length > 0) {
    const errorMsg = JSON.stringify(userErrors);
    console.warn("[PIXEL] ⚠️ UTM pixel delete had errors:", errorMsg);
    return { success: false, error: errorMsg };
  }

  console.log("[PIXEL] ✅ UTM pixel deactivated:", existingPixelId);
  return { success: true };
}

/**
 * Activates (or re-activates) the Wolfpack UTM Attribution web pixel for a shop.
 *
 * Strategy: delete-then-recreate on every call. This ensures the pixel record
 * always binds to the CURRENT deployed extension version.
 *
 * IMPORTANT: `webPixelCreate` settings must be a plain object in GraphQL variables
 * (not a JSON.stringify'd string). The JSON scalar expects the actual object.
 *
 * NOTE: If the web pixel extension has never been deployed via `shopify app deploy`,
 * Shopify will return a GraphQL execution error on the query and a userError on create.
 * Both cases are treated as non-fatal warnings.
 */
export async function activateUtmPixel(
  admin: any,
  appUrl: string
): Promise<PixelActivationResult> {
  let deleted = false;

  // Step 1: Query for existing pixel. Shopify throws a GraphQL execution error
  // (not null) when no pixel exists — treat that as "no existing pixel".
  let existingPixelId: string | null = null;
  try {
    const existingPixelResponse = await admin.graphql(`query { webPixel { id } }`);
    const existingPixelData = await existingPixelResponse.json();
    existingPixelId = existingPixelData.data?.webPixel?.id ?? null;
  } catch (queryError: unknown) {
    console.log(
      "[PIXEL] No existing UTM pixel found (first install or extension not yet deployed):",
      (queryError as Error)?.message
    );
  }

  // Step 2: Delete stale pixel if one exists
  if (existingPixelId) {
    const deleteResponse = await admin.graphql(
      `mutation webPixelDelete($id: ID!) {
        webPixelDelete(id: $id) {
          userErrors { field message code }
          deletedWebPixelId
        }
      }`,
      { variables: { id: existingPixelId } }
    );
    const deleteData = await deleteResponse.json();
    const deleteErrors = deleteData.data?.webPixelDelete?.userErrors ?? [];
    if (deleteErrors.length > 0) {
      console.warn("[PIXEL] ⚠️ UTM pixel delete had errors:", JSON.stringify(deleteErrors));
    } else {
      console.log("[PIXEL] ✅ Deleted stale UTM pixel:", existingPixelId);
      deleted = true;
    }
  }

  // Step 3: Create fresh pixel bound to current deployed extension
  const createResponse = await admin.graphql(
    `mutation webPixelCreate($webPixel: WebPixelInput!) {
      webPixelCreate(webPixel: $webPixel) {
        userErrors { field message code }
        webPixel { id settings }
      }
    }`,
    {
      variables: {
        webPixel: { settings: { app_server_url: appUrl } },
      },
    }
  );
  const createData = await createResponse.json();
  const pixelErrors = createData.data?.webPixelCreate?.userErrors ?? [];

  if (pixelErrors.length > 0) {
    const errorMsg = JSON.stringify(pixelErrors);
    console.warn("[PIXEL] ⚠️ UTM pixel creation had errors:", errorMsg);
    return { success: false, deleted, error: errorMsg };
  }

  const pixelId = createData.data?.webPixelCreate?.webPixel?.id as string | undefined;
  console.log("[PIXEL] ✅ UTM pixel activated:", pixelId);
  return { success: true, pixelId, deleted };
}
