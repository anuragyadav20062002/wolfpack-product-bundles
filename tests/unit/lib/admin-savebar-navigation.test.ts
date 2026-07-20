import { runAfterSaveBarLeaveConfirmation } from "../../../app/lib/admin-savebar-navigation.client";

describe("runAfterSaveBarLeaveConfirmation", () => {
  it("waits for App Bridge leave confirmation before navigating", async () => {
    const calls: string[] = [];
    const release = Promise.resolve().then(() => {
      calls.push("confirmed");
    });
    const shopify = { saveBar: { leaveConfirmation: jest.fn(() => release) } };

    await runAfterSaveBarLeaveConfirmation(shopify, () => calls.push("navigated"));

    expect(calls).toEqual(["confirmed", "navigated"]);
    expect(shopify.saveBar.leaveConfirmation).toHaveBeenCalledTimes(1);
  });

  it("does not navigate without the required App Bridge save bar API", async () => {
    const navigate = jest.fn();

    await expect(runAfterSaveBarLeaveConfirmation(undefined as never, navigate)).rejects.toThrow();

    expect(navigate).not.toHaveBeenCalled();
  });

  it("does not navigate when leave confirmation rejects", async () => {
    const navigate = jest.fn();
    const shopify = { saveBar: { leaveConfirmation: jest.fn().mockRejectedValue(new Error("stay")) } };

    await expect(runAfterSaveBarLeaveConfirmation(shopify, navigate)).rejects.toThrow("stay");
    expect(navigate).not.toHaveBeenCalled();
  });
});
