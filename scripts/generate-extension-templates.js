#!/usr/bin/env node
/**
 * Generates extensions/bundle-builder/templates/*.json with the correct app handle
 * for the target environment.
 *
 * Usage:
 *   node scripts/generate-extension-templates.js --handle wolfpack-product-bundles-4
 *   node scripts/generate-extension-templates.js --handle wolfpack-product-bundles-sit
 *
 * Called automatically by the npm deploy scripts:
 *   npm run deploy:prod   → handle wolfpack-product-bundles-4
 *   npm run deploy:sit    → handle wolfpack-product-bundles-sit
 */

import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const handleIndex = args.indexOf("--handle");
if (handleIndex === -1 || !args[handleIndex + 1]) {
  console.error("Usage: generate-extension-templates.js --handle <app-handle>");
  process.exit(1);
}

const appHandle = args[handleIndex + 1];
const templatesDir = join(__dirname, "../extensions/bundle-builder/templates");

const templates = {
  "product.product-page-bundle.json": {
    sections: {
      bundle: {
        type: `shopify://apps/${appHandle}/blocks/bundle-product-page`,
        settings: {},
      },
    },
    order: ["bundle"],
  },
  "page.full-page-bundle.json": {
    sections: {
      bundle: {
        type: `shopify://apps/${appHandle}/blocks/bundle-full-page`,
        settings: {},
      },
    },
    order: ["bundle"],
  },
};

for (const [filename, content] of Object.entries(templates)) {
  const filePath = join(templatesDir, filename);
  writeFileSync(filePath, JSON.stringify(content, null, 2) + "\n");
  console.log(`✅ ${filename} — handle: ${appHandle}`);
}
