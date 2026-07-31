import { describe, expect, it } from "vitest";
import { validateUpdateUnitSettingsInput } from "@/lib/backend/validation/unitSettingsSchemas";

const validInput = {
  unitName: "SSF Alparamba",
  branchSector: "Alparamba Sector",
  areas: ["North Block", "South Block"],
  officialEmail: "unit@example.com",
  address: "Alparamba",
  cityDistrict: "Malappuram",
  pinCode: "676000",
};

describe("validateUpdateUnitSettingsInput", () => {
  it("normalizes valid Block names and unit fields", () => {
    const result = validateUpdateUnitSettingsInput({
      ...validInput,
      unitName: "  SSF Alparamba  ",
      areas: ["  North Block  ", "South Block"],
    });

    expect(result.ok).toBe(true);
    expect(result.data?.unitName).toBe("SSF Alparamba");
    expect(result.data?.areas).toEqual(["North Block", "South Block"]);
  });

  it("requires at least one Block", () => {
    const result = validateUpdateUnitSettingsInput({ ...validInput, areas: [] });

    expect(result.ok).toBe(false);
    expect(result.error?.field).toBe("areas");
    expect(result.error?.message).toContain("at least one Block");
  });

  it("rejects duplicate Block names regardless of case and whitespace", () => {
    const result = validateUpdateUnitSettingsInput({
      ...validInput,
      areas: ["North Block", " north block "],
    });

    expect(result.ok).toBe(false);
    expect(result.error?.field).toBe("areas");
    expect(result.error?.message).toContain("unique");
  });

  it("rejects blank, oversized, and excessive Block lists", () => {
    const blank = validateUpdateUnitSettingsInput({ ...validInput, areas: [" "] });
    const oversized = validateUpdateUnitSettingsInput({ ...validInput, areas: ["B".repeat(81)] });
    const excessive = validateUpdateUnitSettingsInput({
      ...validInput,
      areas: Array.from({ length: 51 }, (_, index) => `Block ${index + 1}`),
    });

    expect(blank.ok).toBe(false);
    expect(oversized.ok).toBe(false);
    expect(excessive.ok).toBe(false);
  });

  it("continues validating non-Block unit fields", () => {
    const invalidEmail = validateUpdateUnitSettingsInput({
      ...validInput,
      officialEmail: "invalid-email",
    });
    const invalidPin = validateUpdateUnitSettingsInput({ ...validInput, pinCode: "123" });

    expect(invalidEmail.ok).toBe(false);
    expect(invalidEmail.error?.field).toBe("officialEmail");
    expect(invalidPin.ok).toBe(false);
    expect(invalidPin.error?.field).toBe("pinCode");
  });
});