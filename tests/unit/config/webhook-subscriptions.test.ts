import * as fs from "node:fs";
import { join } from "node:path";

const requiredTopics = [
  "app_purchases_one_time/update",
  "app_subscriptions/update",
  "app/uninstalled",
  "app/scopes_update",
  "products/delete",
];

const removedTopics = [
  "orders/create",
  "products/update",
  "inventory_levels/update",
];

function readTopics(configPath: string) {
  // Test fixture paths are fixed by the table below.
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const source = fs.readFileSync(join(process.cwd(), configPath), "utf8");
  const topicsBlock = source.match(/topics\s*=\s*\[([\s\S]*?)\]/)?.[1] ?? "";
  return [...topicsBlock.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
}

describe("Shopify webhook subscriptions", () => {
  it.each([
    ["SIT", "shopify.app.wolfpack-product-bundles-sit.toml"],
    ["production", "shopify.app.toml"],
  ])("%s config subscribes only to required operational webhook topics", (_label, configPath) => {
    const topics = readTopics(configPath);

    expect(topics.sort()).toEqual([...requiredTopics].sort());
    for (const topic of removedTopics) {
      expect(topics).not.toContain(topic);
    }
  });
});
