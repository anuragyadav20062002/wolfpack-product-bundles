import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Integrations Request Integration flow", () => {
  it("uses sanitized in-page request guidance instead of an unrelated events route", () => {
    const source = readFileSync(
      join(process.cwd(), "app/routes/app/app.integrations.tsx"),
      "utf8",
    );

    expect(source).toContain("Request Integration");
    expect(source).toContain("Send the integration name, required bundle flow, and storefront behavior to the support team.");
    expect(source).toContain("request-intent flow");
    expect(source).not.toContain('href="/app/events"');
    expect(source).not.toMatch(/hmac=|id_token=|jwt=|session=|accessToken|refreshToken/i);
  });
});
