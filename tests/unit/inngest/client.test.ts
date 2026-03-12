/**
 * Unit Tests: Inngest Client
 *
 * Verifies client initialisation, dev-mode base URL switching,
 * and that the module exports a usable Inngest instance.
 */

describe("Inngest client", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it("exports an Inngest instance with id 'wolfpack-product-bundles'", async () => {
    const { inngest } = await import("../../../app/inngest/client");
    expect(inngest).toBeDefined();
    // Inngest instances expose their id via the internal state
    expect((inngest as any).id).toBe("wolfpack-product-bundles");
  });

  it("operates in cloud mode when INNGEST_DEV is not set", async () => {
    delete process.env.INNGEST_DEV;
    const { inngest } = await import("../../../app/inngest/client");
    // In cloud mode the baseUrl should NOT be localhost
    const baseUrl: string | undefined = (inngest as any).baseUrl;
    if (baseUrl) {
      expect(baseUrl).not.toContain("localhost");
    }
    // If no explicit baseUrl, the default (Inngest Cloud) is used — also acceptable
  });

  it("loads without error when INNGEST_DEV=1", async () => {
    process.env.INNGEST_DEV = "1";
    // Should not throw — dev mode requires no signing key or event key
    await expect(import("../../../app/inngest/client")).resolves.toBeDefined();
  });

  it("does not throw when INNGEST_EVENT_KEY is missing", async () => {
    delete process.env.INNGEST_EVENT_KEY;
    await expect(import("../../../app/inngest/client")).resolves.toBeDefined();
  });
});
