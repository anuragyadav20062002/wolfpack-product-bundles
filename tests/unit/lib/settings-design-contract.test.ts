import {
  createSettingsDesignState,
  parseSettingsDesignPayload,
} from "../../../app/lib/settings-design-contract";

describe("Settings Design DTO", () => {
  it("normalizes a complete known field map", () => {
    const state = createSettingsDesignState();

    expect(parseSettingsDesignPayload(state)).toEqual(state);
  });

  it.each([
    { field: "Primary Color", value: "not-a-color" },
    { field: "Primary Font Size", value: "-1" },
    { field: "Primary Font Weight", value: "Heavy" },
    { field: "Image Fit", value: "Crop" },
  ])("rejects invalid $field values", ({ field, value }) => {
    const state = createSettingsDesignState();

    expect(() => parseSettingsDesignPayload({
      ...state,
      fieldValues: { ...state.fieldValues, [field]: value },
    })).toThrow(`Invalid Design field: ${field}`);
  });

  it("rejects unknown fields instead of persisting an unbounded record", () => {
    const state = createSettingsDesignState();

    expect(() => parseSettingsDesignPayload({
      ...state,
      fieldValues: { ...state.fieldValues, unknownField: "value" },
    })).toThrow("Unknown Design field: unknownField");
  });

  it("hydrates valid persisted values over current defaults", () => {
    const state = createSettingsDesignState({
      isExpertControlsEnabled: true,
      fieldValues: { "Primary Color": "#123456" },
    });

    expect(state.isExpertControlsEnabled).toBe(true);
    expect(state.fieldValues["Primary Color"]).toBe("#123456");
    expect(state.fieldValues["Button Text Color"]).toBe("#ffffff");
  });
});
