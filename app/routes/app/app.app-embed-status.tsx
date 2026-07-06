import { json, type ActionFunctionArgs } from "@remix-run/node";
import { requireAdminSession } from "../../lib/auth-guards.server";
import { fetchEmbedData } from "../../lib/bundle-configure-loader.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await requireAdminSession(request);
  const apiKey = process.env.SHOPIFY_API_KEY || "";
  const embedData = await fetchEmbedData(
    admin,
    session.shop,
    apiKey,
    "bundle-app-embed",
  );

  return json(
    { success: true, ...embedData },
    { headers: { "Cache-Control": "no-store" } },
  );
};
