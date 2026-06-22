import { json, redirect, type ActionFunctionArgs } from "@remix-run/node";
import { Prisma } from "@prisma/client";
import { requireAdminSession } from "../../../lib/auth-guards.server";
import db from "../../../db.server";
import { getBundleWizardConfigurePath } from "../../../lib/bundle-navigation";
import { parseConditionValue } from "../../../lib/parse-condition-value";
import { recordBusinessEvent } from "../../../services/app-events.server";
import type { FilterDef, WizardStepState } from "./types";

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { session } = await requireAdminSession(request);
  const bundleId = params.bundleId!;

  const bundle = await db.bundle.findUnique({
    where: { id: bundleId, shopId: session.shop },
    include: { steps: true },
  });
  if (!bundle) return redirect("/app/bundles");

  const formData = await request.formData();
  const intent = formData.get("_intent") as string | null;

  // ── Save Pricing (Step 03) ───────────────────────────────────
  if (intent === "savePricing") {
    const raw = formData.get("pricingData") as string;
    const p = JSON.parse(raw || "{}");

    await db.bundlePricing.upsert({
      where: { bundleId },
      create: {
        bundleId,
        enabled: p.discountEnabled ?? false,
        method: p.discountType ?? "percentage_off",
        rules: p.discountRules ?? [],
        showFooter: p.discountMessagingEnabled ?? true,
        showProgressBar: p.showProgressBar ?? true,
        messages: p.messages ?? null,
      },
      update: {
        enabled: p.discountEnabled ?? false,
        method: p.discountType ?? "percentage_off",
        rules: p.discountRules ?? [],
        showFooter: p.discountMessagingEnabled ?? true,
        showProgressBar: p.showProgressBar ?? true,
        messages: p.messages ?? null,
      },
    });

    await recordBusinessEvent({
      eventHandle: "pricing_configured",
      shopDomain: session.shop,
      bundleId,
      bundleType: bundle.bundleType,
      surface: "admin",
      actor: "merchant",
      routeFamily: "create_configure",
      result: "success",
      attributes: {
        pricing_mode: p.discountEnabled ? "enabled" : "disabled",
        discount_type: p.discountType ?? "percentage_off",
      },
    });

    await recordBusinessEvent({
      eventHandle: "bundle_create_step_completed",
      shopDomain: session.shop,
      bundleId,
      bundleType: bundle.bundleType,
      surface: "admin",
      actor: "merchant",
      routeFamily: "create_configure",
      result: "success",
      attributes: {
        step_key: "pricing",
        step_index: 3,
      },
    });

    return json({ ok: true, intent: "savePricing" });
  }

  // ── Save Assets (Step 04) ───────────────────────────────────
  if (intent === "saveAssets") {
    const promoBannerBgImage =
      (formData.get("promoBannerBgImage") as string) || null;
    const loadingGif = (formData.get("loadingGif") as string) || null;
    const searchBarEnabled = formData.get("searchBarEnabled") === "true";
    const stepsFiltersJson = formData.get("stepsFilters") as string;
    const customFieldsJson = formData.get("customFields") as string;

    await db.bundle.update({
      where: { id: bundleId },
      data: {
        promoBannerBgImage: promoBannerBgImage || null,
        loadingGif: loadingGif || null,
        searchBarEnabled,
      },
    });

    const stepsFilters: Array<{ stepDbId: string; filters: FilterDef[] }> =
      JSON.parse(stepsFiltersJson || "[]");
    for (const sf of stepsFilters) {
      if (sf.stepDbId) {
        await db.bundleStep.update({
          where: { id: sf.stepDbId },
          data: {
            filters:
              sf.filters && sf.filters.length > 0
                ? (sf.filters as any)
                : Prisma.JsonNull,
          },
        });
      }
    }

    const customFieldsData: Array<{
      label: string;
      fieldType: string;
      required: boolean;
      options: string[];
    }> = JSON.parse(customFieldsJson || "[]");
    await db.bundleCustomField.deleteMany({ where: { bundleId } });
    for (const [i, cf] of customFieldsData.entries()) {
      await db.bundleCustomField.create({
        data: {
          bundleId,
          label: cf.label,
          fieldType: cf.fieldType,
          required: cf.required,
          position: i,
          options:
            cf.options && cf.options.length > 0 ? cf.options : Prisma.JsonNull,
        },
      });
    }

    await recordBusinessEvent({
      eventHandle: "bundle_create_step_completed",
      shopDomain: session.shop,
      bundleId,
      bundleType: bundle.bundleType,
      surface: "admin",
      actor: "merchant",
      routeFamily: "create_configure",
      result: "success",
      attributes: {
        step_key: "assets",
        step_index: 4,
      },
    });

    return json({
      ok: true,
      intent: "saveAssets",
      redirectTo: getBundleWizardConfigurePath(bundle.id),
    });
  }

  // ── Save Config (Step 02) ────────────────────────────────────
  const stepsJson = formData.get("steps") as string;
  const bundleStatus = formData.get("bundleStatus") as string;
  const searchBarEnabled = formData.get("searchBarEnabled") === "true";
  const localeOverridesJson = formData.get("textOverridesByLocale") as string;

  const wizardSteps: WizardStepState[] = JSON.parse(stepsJson || "[]");
  const textOverridesByLocale = localeOverridesJson
    ? JSON.parse(localeOverridesJson)
    : {};

  await db.bundle.update({
    where: { id: bundleId },
    data: { status: bundleStatus as any, searchBarEnabled, textOverridesByLocale },
  });

  const submittedDbIds = wizardSteps.filter((s) => s.dbId).map((s) => s.dbId!);
  const toDelete = bundle.steps
    .map((s) => s.id)
    .filter((id) => !submittedDbIds.includes(id));
  if (toDelete.length > 0) {
    await db.bundleStep.deleteMany({ where: { id: { in: toDelete } } });
  }

  const savedSteps: Array<{ tempId: string; dbId: string }> = [];

  for (const [i, ws] of wizardSteps.entries()) {
    const c1 = ws.conditions?.[0];
    const c2 = ws.conditions?.[1];
    const stepData = {
      name: ws.name?.trim() || `Step ${i + 1}`,
      pageTitle: ws.pageTitle?.trim() || null,
      timelineIconUrl: ws.iconUrl || null,
      position: i,
      collections:
        ws.collections && ws.collections.length > 0 ? (ws.collections as any) : null,
      conditionType: c1?.conditionType || null,
      conditionOperator: c1?.conditionOperator || null,
      conditionValue: parseConditionValue(c1?.conditionValue),
      conditionOperator2: c2?.conditionOperator || null,
      conditionValue2: parseConditionValue(c2?.conditionValue),
      filters: ws.filters && ws.filters.length > 0 ? (ws.filters as any) : null,
    };

    let stepId: string;
    if (ws.dbId) {
      await db.bundleStep.update({ where: { id: ws.dbId }, data: stepData });
      stepId = ws.dbId;
    } else {
      const created = await db.bundleStep.create({
        data: { ...stepData, bundleId },
      });
      stepId = created.id;
    }
    savedSteps.push({ tempId: ws.tempId, dbId: stepId });

    await db.stepProduct.deleteMany({ where: { stepId } });
    for (const [pi, product] of (ws.products || []).entries()) {
      await db.stepProduct.create({
        data: {
          stepId,
          productId: product.id,
          title: product.title || "",
          imageUrl:
            product.imageUrl || product.images?.[0]?.originalSrc || null,
          variants: product.variants ?? [],
          position: pi,
        },
      });
    }

    // Persist StepCategory rows (delete all then recreate)
    await db.stepCategory.deleteMany({ where: { stepId } });
    for (const [ci, cat] of (ws.StepCategory || []).entries()) {
      await db.stepCategory.create({
        data: {
          stepId,
          name: cat.name || '',
          sortOrder: cat.sortOrder ?? ci,
          products: Array.isArray(cat.products) && cat.products.length > 0 ? cat.products : Prisma.JsonNull,
          collections: Array.isArray(cat.collections) && cat.collections.length > 0 ? cat.collections : Prisma.JsonNull,
        },
      });
    }
  }

  await recordBusinessEvent({
    eventHandle: "bundle_saved",
    shopDomain: session.shop,
    bundleId,
    bundleType: bundle.bundleType,
    surface: "admin",
    actor: "merchant",
    routeFamily: "create_configure",
    result: "success",
    attributes: {
      intent: "saveConfig",
      step_count: savedSteps.length,
    },
  });

  await recordBusinessEvent({
    eventHandle: "bundle_create_step_completed",
    shopDomain: session.shop,
    bundleId,
    bundleType: bundle.bundleType,
    surface: "admin",
    actor: "merchant",
    routeFamily: "create_configure",
    result: "success",
    attributes: {
      step_key: "configuration",
      step_index: 2,
    },
  });

  return json({ ok: true, intent: "saveConfig", steps: savedSteps });
};
