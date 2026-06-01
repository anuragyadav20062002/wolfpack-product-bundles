import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Integrations route recovered contract shape", () => {
  it("renders categories from cards using visible EB CTA labels", () => {
    const source = readFileSync(join(process.cwd(), "app/routes/app/app.integrations.tsx"), "utf8");

    expect(source).toContain("category.cards.map");
    expect(source).toContain("integration.title");
    expect(source).toContain("integration.ctaLabel");
    expect(source).toContain("integration.ctaType");
    expect(source).toContain("Chat setup");
    expect(source).toContain("Setup guide");
    expect(source).toContain("integration.logoUrl");
    expect(source).toContain("logoImage");
    expect(source).not.toContain("category.integrations");
    expect(source).not.toContain("integration.name");
    expect(source).not.toContain("setupAction");
    expect(source).not.toContain("Open Chat Setup");
  });
});
