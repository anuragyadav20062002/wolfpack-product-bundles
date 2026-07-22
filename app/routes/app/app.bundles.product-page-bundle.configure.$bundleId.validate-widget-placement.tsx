import {
  json,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import { requireAdminSession } from "../../lib/auth-guards.server";
import { handleValidateWidgetPlacement } from "./app.bundles.product-page-bundle.configure.$bundleId/handlers/widget-placement.server";

export const loader = async (_args: LoaderFunctionArgs) =>
  json({ success: false, error: "Method not allowed" }, { status: 405 });

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const bundleId = params.bundleId;
  if (!bundleId) {
    return json(
      { success: false, error: "Invalid bundle widget placement route" },
      { status: 400 },
    );
  }

  const { admin, session } = await requireAdminSession(request);
  return handleValidateWidgetPlacement(admin, session, bundleId);
};
