import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Integrations route recovered contract shape", () => {
  it("renders categories from cards using visible CTA labels", () => {
    const source = readFileSync(join(process.cwd(), "app/routes/app/app.integrations.tsx"), "utf8");

    expect(source).toContain("category.cards.map");
    expect(source).toContain("integration.title");
    expect(source).toContain("integration.ctaLabel");
    expect(source).toContain("integration.setupUrl");
    expect(source).toContain("integration.logoUrl");
    expect(source).toContain("logoImage");
    expect(source).toContain('target="_blank"');
    expect(source).toContain('rel="noreferrer"');
    expect(source).toContain("integrationCtaArrow");
    expect(source).toContain("integrationTile");
    expect(source).not.toContain("guideBox");
    expect(source).not.toContain("openIntegrationId");
    expect(source).not.toContain("category.integrations");
    expect(source).not.toContain("integration.name");
    expect(source).not.toContain("setupAction");
    expect(source).not.toContain("Open Chat Setup");
  });
});
