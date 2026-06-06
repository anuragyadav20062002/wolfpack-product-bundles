import { ThemeTemplateService } from "../../../app/services/theme-template.server";

describe("ThemeTemplateService", () => {
  it("reports the default product template path when direct theme-file creation is unavailable", async () => {
    const service = new ThemeTemplateService({} as any, { shop: "agent-5sfidg3m.myshopify.com" } as any);

    await expect(service.ensureProductTemplate("codex-ppb-2026-05-21")).resolves.toMatchObject({
      success: true,
      created: false,
      templatePath: "templates/product.json",
    });
  });
});
