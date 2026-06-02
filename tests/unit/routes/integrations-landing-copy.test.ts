import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Integrations landing copy", () => {
  it("matches the captured EB heading, description, and primary action", () => {
    const source = readFileSync(join(process.cwd(), "app/routes/app/app.integrations.tsx"), "utf8");

    expect(source).toContain("Integrations Hub");
    expect(source).toContain("Browse supported integrations to extend your bundle capabilities.");
    expect(source).toContain("Request Integration");
  });
});
