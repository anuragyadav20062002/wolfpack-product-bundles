import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Integrations landing header", () => {
  it("does not render a non-EB kicker above the Integrations Hub heading", () => {
    const source = readFileSync(join(process.cwd(), "app/routes/app/app.integrations.tsx"), "utf8");

    expect(source).toContain("Integrations Hub");
    expect(source).toContain("Browse supported integrations to extend your bundle capabilities.");
    expect(source).not.toContain("Supported connections");
    expect(source).not.toContain("styles.kicker");
  });
});
