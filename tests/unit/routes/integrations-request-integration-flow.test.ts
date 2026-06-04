import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Integrations Request Integration flow", () => {
  it("uses the captured request action without an inline request panel", () => {
    const source = readFileSync(
      join(process.cwd(), "app/routes/app/app.integrations.tsx"),
      "utf8",
    );

    expect(source).toContain("Request Integration");
    expect(source).toContain("integrationRequestButton");
    expect(source).toContain('href="https://wolfpackapps.com"');
    expect(source).toContain('target="_blank"');
    expect(source).not.toContain("requestOpen");
    expect(source).not.toContain("requestCard");
    expect(source).not.toContain("Send the integration name, required bundle flow, and storefront behavior to the support team.");
    expect(source).not.toContain("request-intent flow");
    expect(source).not.toContain('href="/app/events"');
    expect(source).not.toMatch(/hmac=|id_token=|jwt=|session=|accessToken|refreshToken/i);
  });
});
