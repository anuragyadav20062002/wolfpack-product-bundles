import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { requireAdminSession } from "../../../lib/auth-guards.server";
import { fetchEmbedData } from "../../../lib/bundle-configure-loader.server";
import db from "../../../db.server";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { admin, session } = await requireAdminSession(request);
  const bundleId = params.bundleId!;

  const bundle = await db.bundle.findUnique({
    where: { id: bundleId, shopId: session.shop },
    include: {
      steps: {
        orderBy: { position: "asc" },
        include: {
          StepProduct: { orderBy: { position: "asc" } },
          StepCategory: { orderBy: { sortOrder: "asc" } },
        },
      },
      pricing: true,
      customFields: { orderBy: { position: "asc" } },
    },
  });

  if (!bundle) return redirect("/app/bundles");

  let shopLocales: { locale: string; name: string; primary: boolean }[] = [];
  try {
    const resp = await admin.graphql(
      `query { shopLocales { locale name primary published } }`
    );
    const data = (await resp.json()) as any;
    shopLocales = ((data.data?.shopLocales ?? []) as any[]).filter(
      (l) => l.published
    );
  } catch {}

  let appEmbedEnabled = false;
  let themeEditorUrl: string | null = null;
  try {
    const embedData = await fetchEmbedData(
      admin,
      session.shop,
      process.env.SHOPIFY_API_KEY || "",
      "bundle-app-embed",
    );
    appEmbedEnabled = embedData.appEmbedEnabled;
    themeEditorUrl = embedData.themeEditorUrl;
  } catch {}

  let parentProductActive = false;
  if (bundle.shopifyProductId) {
    try {
      const resp = await admin.graphql(
        `query { product(id: "${bundle.shopifyProductId}") { status } }`
      );
      const data = (await resp.json()) as any;
      parentProductActive = data.data?.product?.status === "ACTIVE";
    } catch {}
  }

  const routeBase =
    bundle.bundleType === "full_page" ? "full-page-bundle" : "product-page-bundle";

  return json({
    bundle: {
      id: bundle.id,
      name: bundle.name,
      status: bundle.status,
      bundleType: bundle.bundleType,
      searchBarEnabled: bundle.searchBarEnabled,
      promoBannerBgImage: bundle.promoBannerBgImage ?? null,
      loadingGif: bundle.loadingGif ?? null,
      shopifyProductId: bundle.shopifyProductId,
      shopifyProductHandle: bundle.shopifyProductHandle,
      shopifyPageId: bundle.shopifyPageId,
      shopifyPageHandle: bundle.shopifyPageHandle,
      textOverridesByLocale: (bundle.textOverridesByLocale as any) ?? {},
      steps: bundle.steps as any[],
      customFields: bundle.customFields.map((cf) => ({
        id: cf.id,
        label: cf.label,
        fieldType: cf.fieldType,
        required: cf.required,
        options: (cf.options as string[] | null) ?? [],
      })),
      pricing: bundle.pricing
        ? {
            enabled: bundle.pricing.enabled,
            method: bundle.pricing.method as string,
            rules: bundle.pricing.rules,
            showFooter: bundle.pricing.showFooter,
            showProgressBar: bundle.pricing.showProgressBar,
            messages: bundle.pricing.messages,
          }
        : null,
    },
    readiness: {
      appEmbedEnabled,
      hasDiscount: bundle.pricing?.enabled ?? false,
      hasBundleVisibility: !!(
        bundle.shopifyPageId || bundle.status === "active"
      ),
      parentProductActive,
    },
    configureUrl: `/app/bundles/${routeBase}/configure/${bundle.id}`,
    shopLocales,
    shop: session.shop,
    themeEditorUrl,
  });
};
