import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const FPB_CONFIGURE_ROUTE_DIR = join(
  process.cwd(),
  "app/routes/app/app.bundles.full-page-bundle.configure.$bundleId",
);

function collectRouteSourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(dir, entry.name);
    if (entry.isDirectory()) return collectRouteSourceFiles(entryPath);
    return /\.(ts|tsx)$/.test(entry.name) ? [entryPath] : [];
  });
}

export function readFpbConfigureRouteFamilySource() {
  return collectRouteSourceFiles(FPB_CONFIGURE_ROUTE_DIR)
    .sort()
    .map((filePath) => readFileSync(filePath, "utf8"))
    .join("\n");
}
