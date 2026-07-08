import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { requireAdminSession } from "../../lib/auth-guards.server";
import { handlePrepareStorefrontPreview } from "./shared/storefront-sync-action.server";

function normalizeBundleType(bundleType: string | undefined) {
  if (bundleType === "full-page-bundle") {
    return "full_page";
  }
  if (bundleType === "product-page-bundle") {
    return "product_page";
  }
  return null;
}

export const loader = async (_args: LoaderFunctionArgs) =>
  json({ success: false, error: "Method not allowed" }, { status: 405 });

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const bundleId = params.bundleId;
  const bundleType = normalizeBundleType(params.bundleType);

  if (!bundleId || !bundleType) {
    return json(
      { success: false, statusCode: 400, error: "Invalid bundle preview route" },
      { status: 400 },
    );
  }

  const { admin, session } = await requireAdminSession(request);
  return handlePrepareStorefrontPreview(admin, session, bundleId, bundleType);
};
