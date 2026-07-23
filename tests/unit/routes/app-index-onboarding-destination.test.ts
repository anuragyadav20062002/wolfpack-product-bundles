import { getInitialAppDestination } from "../../../app/routes/app/app._index";

describe("initial app destination", () => {
  it("opens the existing onboarding route for a newly installed shop", () => {
    expect(getInitialAppDestination(true, true)).toBe("/app/onboarding");
  });

  it("opens the dashboard for returning shops and intentional app-home visits", () => {
    expect(getInitialAppDestination(true, false)).toBe("/app/dashboard");
    expect(getInitialAppDestination(false, true)).toBeNull();
  });
});
