import fs from "node:fs";
import path from "node:path";

const ROOT_DIR = process.cwd();
const MAX_ADMIN_FILE_LINES = 600;
const CONFIGURE_ROUTE_FAMILY_COMFORT_LINES = 500;

const SCAN_ROOTS = ["app/routes/app", "app/components"];
const EXCLUDED_PATH_PARTS = [
  ".css",
  ".module.css",
  "bundle-widget",
  "build/",
  "dist/",
  "node_modules/",
];

const ACTIVE_REFACTOR_BACKLOG = new Set<string>([
  "app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/sections/StepSetupCategoryAccordion.tsx",
  "app/routes/app/app.dashboard/DashboardPage.tsx",
]);

const CONFIGURE_ROUTE_FAMILY_REFACTOR_BACKLOG = new Set<string>([
  "app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/save-bundle.server.ts",
  "app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/sections/FreeGiftAddonTierEditor.tsx",
  "app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/sections/StepSetupCategoryAccordion.tsx",
]);

const CONFIGURE_ROUTE_FAMILIES = [
  "app/routes/app/app.bundles.full-page-bundle.configure.$bundleId",
  "app/routes/app/app.bundles.product-page-bundle.configure.$bundleId",
];

type FileLineCount = {
  relativePath: string;
  lineCount: number;
};

function collectSourceFiles(dir: string): string[] {
  const absoluteDir = path.join(ROOT_DIR, dir);
  return fs.readdirSync(absoluteDir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(entryPath);
    return [entryPath];
  });
}

function shouldScan(relativePath: string): boolean {
  if (!/\.(ts|tsx)$/.test(relativePath)) return false;
  return !EXCLUDED_PATH_PARTS.some((part) => relativePath.includes(part));
}

function countLines(relativePath: string): FileLineCount {
  const source = fs.readFileSync(path.join(ROOT_DIR, relativePath), "utf8");
  return {
    relativePath,
    lineCount: source.split(/\r?\n/).length,
  };
}

function adminFileLineCounts(): FileLineCount[] {
  return SCAN_ROOTS.flatMap(collectSourceFiles)
    .filter(shouldScan)
    .map(countLines);
}

describe("Admin route and component file boundaries", () => {
  it("keeps new Admin route/component files under the hard line-count cap", () => {
    const oversizedFiles = adminFileLineCounts()
      .filter(({ lineCount }) => lineCount > MAX_ADMIN_FILE_LINES)
      .filter(({ relativePath }) => !ACTIVE_REFACTOR_BACKLOG.has(relativePath));

    expect(oversizedFiles).toEqual([]);
  });

  it("keeps the active refactor backlog explicit until each file is split", () => {
    const countsByPath = new Map(
      adminFileLineCounts().map((file) => [file.relativePath, file.lineCount])
    );

    const staleBacklogEntries = [
      ...[...ACTIVE_REFACTOR_BACKLOG]
        .filter((relativePath) => (countsByPath.get(relativePath) ?? 0) <= MAX_ADMIN_FILE_LINES),
      ...[...CONFIGURE_ROUTE_FAMILY_REFACTOR_BACKLOG]
        .filter((relativePath) => (countsByPath.get(relativePath) ?? 0) <= CONFIGURE_ROUTE_FAMILY_COMFORT_LINES),
    ];

    expect(staleBacklogEntries).toEqual([]);
  });

  it("keeps configure route-family splits readable instead of hiding bulk state in any-typed flow objects", () => {
    const configureSources = adminFileLineCounts()
      .map(({ relativePath }) => relativePath)
      .filter((relativePath) =>
        CONFIGURE_ROUTE_FAMILIES.some((family) => relativePath.startsWith(family))
      )
      .map((relativePath) => ({
        relativePath,
        source: fs.readFileSync(path.join(ROOT_DIR, relativePath), "utf8"),
      }));

    const flowObjectFiles = configureSources
      .filter(({ source }) => /\bsectionFlow\b|flow:\s*any/.test(source))
      .map(({ relativePath }) => relativePath);

    expect(flowObjectFiles).toEqual([]);
  });

  it("keeps configure route-family files under the comfort cap", () => {
    const oversizedTargets = adminFileLineCounts()
      .filter(({ relativePath }) =>
        CONFIGURE_ROUTE_FAMILIES.some((family) => relativePath.startsWith(family))
      )
      .filter(
        ({ lineCount }) => lineCount > CONFIGURE_ROUTE_FAMILY_COMFORT_LINES
      )
      .filter(({ relativePath }) => !CONFIGURE_ROUTE_FAMILY_REFACTOR_BACKLOG.has(relativePath));

    expect(oversizedTargets).toEqual([]);
  });
});
