import { describe, expect, it } from "vitest";
import {
  validateCompleteMemberProfileInput,
  validateCreateMemberInput,
  validateMemberListFilters,
  validateUpdateMemberInput,
} from "@/lib/backend/validation/memberSchemas";

const validMember = {
  name: "Test Member",
  phone: "9876543210",
  monthlyTier: "flexible" as const,
  monthlyAmount: 50,
};

describe("member occupation status validation", () => {
  it("requires occupation status when a member is created", () => {
    const result = validateCreateMemberInput(validMember);

    expect(result.ok).toBe(false);
    expect(result.error?.field).toBe("occupationStatus");
  });

  it("accepts a supported occupation status", () => {
    const result = validateCreateMemberInput({
      ...validMember,
      occupationStatus: "student",
    });

    expect(result.ok).toBe(true);
    expect(result.data?.occupationStatus).toBe("student");
  });

  it("rejects invalid update and filter values", () => {
    const update = validateUpdateMemberInput({
      occupationStatus: "retired",
    } as never);
    const filter = validateMemberListFilters({
      occupationStatus: "retired",
    } as never);

    expect(update.ok).toBe(false);
    expect(filter.ok).toBe(false);
  });

  it("requires occupation status during first-login profile completion", () => {
    const result = validateCompleteMemberProfileInput({
      whatsapp: "9876543210",
      age: 24,
      bloodGroup: "O+",
      address: "Alparamba",
      occupation: "Student",
    } as never);

    expect(result.ok).toBe(false);
    expect(result.error?.field).toBe("occupationStatus");
  });
});
