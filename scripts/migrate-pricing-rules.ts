import { Prisma } from "@prisma/client";
import { migrateNestedRule, parsePricingRule } from "../app/lib/pricing-rule-parser";
import { prisma } from "../app/db.server";

const VALID_CONDITION_TYPES = new Set(["quantity", "amount"]);

function isPricingRuleLike(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function needsNestedMigration(rule: unknown): rule is Record<string, unknown> {
  if (!isPricingRuleLike(rule)) {
    return false;
  }

  const conditionType = typeof rule.conditionType === "string" ? rule.conditionType : null;
  return !conditionType || !VALID_CONDITION_TYPES.has(conditionType);
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  console.log(`[pricing-migrate] start (dryRun=${dryRun})`);

  const rows = await prisma.bundlePricing.findMany({
    where: {
      rules: {
        not: Prisma.JsonNull,
      },
    },
    select: {
      id: true,
      bundleId: true,
      rules: true,
    },
  });

  let visited = 0;
  let migrated = 0;
  let errors = 0;

  for (const row of rows) {
    visited += 1;
    if (!Array.isArray(row.rules)) {
      continue;
    }

    let rowNeedsMigration = false;

    const migratedRules: Array<Record<string, unknown>> = [];
    let rowFailed = false;

    for (let index = 0; index < row.rules.length; index += 1) {
      const rule = row.rules[index];

      try {
        if (!isPricingRuleLike(rule)) {
          throw new Error("rule must be an object");
        }

        const sourceRule = rule;
        const normalizedRule = needsNestedMigration(sourceRule)
          ? migrateNestedRule(sourceRule)
          : parsePricingRule(sourceRule);

        if (needsNestedMigration(sourceRule)) {
          rowNeedsMigration = true;
        }

        migratedRules.push({
          id: normalizedRule.id,
          conditionType: normalizedRule.conditionType,
          conditionValue: normalizedRule.conditionValue,
          discountValue: normalizedRule.discountValue,
          customerBuys: normalizedRule.customerBuys,
          customerGets: normalizedRule.customerGets,
          bxyDiscountType: normalizedRule.bxyDiscountType,
          bxyApplyMode: normalizedRule.bxyApplyMode,
        });
      } catch (error) {
        errors += 1;
        rowFailed = true;
        console.error(`[pricing-migrate] bundlePricing=${row.id} rule=${index} invalid`, {
          bundleId: row.bundleId,
          rule,
          error: (error as Error).message,
        });
        break;
      }
    }

    if (rowFailed) {
      continue;
    }

    if (!rowNeedsMigration) {
      continue;
    }

    migrated += 1;
    if (dryRun) {
      console.log(`[pricing-migrate] DRY-RUN would migrate bundlePricing=${row.id} bundle=${row.bundleId}`);
      continue;
    }

    await prisma.bundlePricing.update({
      where: { id: row.id },
      data: {
        rules: migratedRules,
      },
    });

    console.log(`[pricing-migrate] migrated bundlePricing=${row.id} bundle=${row.bundleId}`);
  }

  console.log(`[pricing-migrate] done: scanned=${visited} migrated=${migrated} errors=${errors}`);
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error("[pricing-migrate] failed", error);
  await prisma.$disconnect();
  process.exitCode = 1;
});
