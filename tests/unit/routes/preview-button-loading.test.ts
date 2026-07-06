import { readFileSync } from "node:fs";
import { join } from "node:path";

function readRouteFile(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Preview Bundle button loading state", () => {
  it("tracks the clicked dashboard preview bundle and passes loading to that row button", () => {
    const dashboardSource = readRouteFile("app/routes/app/app.dashboard/DashboardPage.tsx");
    const actionsSource = readRouteFile("app/routes/app/app.dashboard/BundleActionsButtons.tsx");

    expect(dashboardSource).toContain("previewingBundleId");
    expect(dashboardSource).toContain("isPreviewing={previewingBundleId === bundle.id}");
    expect(actionsSource).toContain("isPreviewing");
    expect(actionsSource).toContain("loading={isPreviewing || undefined}");
  });

  it("tracks the clicked dashboard edit bundle and passes loading state to the edit row button", () => {
    const dashboardSource = readRouteFile("app/routes/app/app.dashboard/DashboardPage.tsx");
    const actionsSource = readRouteFile("app/routes/app/app.dashboard/BundleActionsButtons.tsx");

    expect(dashboardSource).toContain("editingBundleId");
    expect(dashboardSource).toContain("isEditing={editingBundleId === bundle.id}");
    expect(actionsSource).toContain("isEditing");
    expect(actionsSource).toContain("loading={isEditing || undefined}");
    expect(actionsSource).toContain("disabled={isEditing || undefined}");
  });

  it("passes shared FPB preview loading state to header and template-dialog preview buttons", () => {
    const actionControllerSource = readRouteFile(
      "app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/useConfigureActionController.ts",
    );
    const headerSource = readRouteFile(
      "app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/ConfigureCanvasHeader.tsx",
    );
    const dialogSource = readRouteFile(
      "app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/sections/ConfigureTemplateDialog.tsx",
    );

    expect(actionControllerSource).toContain("isPreviewBundleLoading");
    expect(actionControllerSource).toContain("setIsPreviewBundleLoading");
    expect(headerSource).toContain("loading={isPreviewBundleLoading || undefined}");
    expect(dialogSource).toContain("loading={isPreviewBundleLoading || undefined}");
  });

  it("keeps FPB preview loading owned by the continuous preview flow", () => {
    const actionControllerSource = readRouteFile(
      "app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/useConfigureActionController.ts",
    );

    expect(actionControllerSource).toContain("const handlePreviewBundle = useCallback(async () => {");
    expect(actionControllerSource).toContain("setIsPreviewBundleLoading(true);");
    expect(actionControllerSource).not.toContain(
      "if (!isPreviewBundleLoading || flow.fetcher.state !== \"idle\") return;",
    );
  });

  it("passes shared PPB preview loading state to header and template-dialog preview buttons", () => {
    const previewHandlersSource = readRouteFile(
      "app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/usePpbPreviewReadinessHandlers.ts",
    );
    const headerSource = readRouteFile(
      "app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/PpbCanvasHeader.tsx",
    );
    const dialogSource = readRouteFile(
      "app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/PpbSelectTemplateDialog.tsx",
    );

    expect(previewHandlersSource).toContain("isPreviewBundleLoading");
    expect(previewHandlersSource).toContain("setIsPreviewBundleLoading");
    expect(headerSource).toContain("loading={isPreviewBundleLoading || undefined}");
    expect(dialogSource).toContain("loading={isPreviewBundleLoading || undefined}");
  });
});
