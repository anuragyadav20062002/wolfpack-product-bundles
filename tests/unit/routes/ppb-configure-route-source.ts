import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const PPB_CONFIGURE_ROUTE_DIR = join(
  process.cwd(),
  "app/routes/app/app.bundles.product-page-bundle.configure.$bundleId",
);

export function readPpbConfigureRouteFamilySource() {
  return collectRouteSourceFiles(PPB_CONFIGURE_ROUTE_DIR)
    .sort()
    .map((filePath) => readFileSync(filePath, "utf8"))
    .join("\n");
}

function collectRouteSourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(dir, entry.name);
    if (entry.isDirectory()) return collectRouteSourceFiles(entryPath);
    return /\.(ts|tsx)$/.test(entry.name) ? [entryPath] : [];
  });
}
