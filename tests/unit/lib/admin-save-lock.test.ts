import {
  handleAdminSaveLockedEvent,
  shouldBlockAdminConfigInteraction,
} from "../../../app/lib/admin-save-lock";

function targetWithClosest(match: boolean) {
  return {
    closest: jest.fn((selector: string) => {
      if (selector === '[data-save-lock-allow="true"]') return null;
      return match ? {} : null;
    }),
  };
}

describe("admin save lock", () => {
  it("blocks editable controls while saving", () => {
    expect(shouldBlockAdminConfigInteraction({
      isSaving: true,
      target: targetWithClosest(true),
    })).toBe(true);
  });

  it("does not block editable controls while idle", () => {
    expect(shouldBlockAdminConfigInteraction({
      isSaving: false,
      target: targetWithClosest(true),
    })).toBe(false);
  });

  it("does not block static content while saving", () => {
    expect(shouldBlockAdminConfigInteraction({
      isSaving: true,
      target: targetWithClosest(false),
    })).toBe(false);
  });

  it("allows explicit save-lock bypass targets", () => {
    const target = {
      closest: jest.fn((selector: string) => (
        selector === '[data-save-lock-allow="true"]' ? {} : {}
      )),
    };

    expect(shouldBlockAdminConfigInteraction({
      isSaving: true,
      target,
    })).toBe(false);
  });

  it("cancels blocked events and triggers the blocked callback", () => {
    const onBlocked = jest.fn();
    const event = {
      target: targetWithClosest(true) as unknown as EventTarget,
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
    };

    const blocked = handleAdminSaveLockedEvent(event, true, onBlocked);

    expect(blocked).toBe(true);
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(event.stopPropagation).toHaveBeenCalledTimes(1);
    expect(onBlocked).toHaveBeenCalledTimes(1);
  });
});
