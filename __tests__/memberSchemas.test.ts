import { describe, expect, it } from "vitest";
import {
  validateCompleteMemberProfileInput,
  validateCreateMemberInput,
  validateMemberListFilters,
  validateUpdateMemberProfileInput,
} from "@/lib/backend/validation/memberSchemas";

const validMember = {
  name: "Test Member",
  phone: "9876543210",
  area: "ALPARAMBA",
  occupation: "Teacher",
  isStudent: false,
  isMuthaallim: false,
  workLocation: "india" as const,
  monthlyTier: "flexible" as const,
  monthlyAmount: 50,
};

const validCompletion = {
  whatsapp: "9876543210",
  age: 24,
  bloodGroup: "O+",
  address: "Alparamba",
  area: "ALPARAMBA",
  occupation: "Teacher",
  isStudent: false,
  isMuthaallim: false,
  workLocation: "india" as const,
};

describe("member study and employment validation", () => {
  it("accepts a non-student member with occupation and work location", () => {
    const result = validateCreateMemberInput(validMember);

    expect(result.ok).toBe(true);
    expect(result.data?.isStudent).toBe(false);
    expect(result.data?.workLocation).toBe("india");
  });

  it("requires class, course, and institution when student is true", () => {
    const result = validateCreateMemberInput({ ...validMember, isStudent: true });

    expect(result.ok).toBe(false);
    expect(result.error?.field).toBe("studentClass");
  });

  it("accepts complete student details", () => {
    const result = validateCreateMemberInput({
      ...validMember,
      occupation: undefined,
      workLocation: undefined,
      isStudent: true,
      studentClass: "Degree",
      studentCourse: "B.Com",
      studentInstitution: "Example College",
    });

    expect(result.ok).toBe(true);
    expect(result.data?.studentCourse).toBe("B.Com");
    expect(result.data?.occupation).toBeUndefined();
    expect(result.data?.workLocation).toBeUndefined();
  });

  it("requires institution when Mutha'allim is true", () => {
    const result = validateCreateMemberInput({ ...validMember, isMuthaallim: true });

    expect(result.ok).toBe(false);
    expect(result.error?.field).toBe("muthaallimInstitution");
  });

  it("accepts a Mutha'allim without occupation or work location", () => {
    const result = validateCreateMemberInput({
      ...validMember,
      occupation: undefined,
      workLocation: undefined,
      isMuthaallim: true,
      muthaallimInstitution: "Example Dars",
    });

    expect(result.ok).toBe(true);
    expect(result.data?.occupation).toBeUndefined();
    expect(result.data?.workLocation).toBeUndefined();
  });

  it("accepts a member without occupation or work location", () => {
    const result = validateCreateMemberInput({
      ...validMember,
      occupation: undefined,
      workLocation: undefined,
    });

    expect(result.ok).toBe(true);
    expect(result.data?.occupation).toBeUndefined();
    expect(result.data?.workLocation).toBeUndefined();
  });

  it("accepts profile completion without occupation or work location", () => {
    const result = validateCompleteMemberProfileInput({
      ...validCompletion,
      occupation: undefined,
      workLocation: undefined,
    } as never);

    expect(result.ok).toBe(true);
  });

  it("rejects invalid work location filters", () => {
    const result = validateMemberListFilters({ workLocation: "remote" } as never);

    expect(result.ok).toBe(false);
    expect(result.error?.field).toBe("workLocation");
  });

  it("validates Block updates from member profile", () => {
    const missing = validateUpdateMemberProfileInput({ area: "" });
    const valid = validateUpdateMemberProfileInput({ area: "ALPARAMBA" });

    expect(missing.ok).toBe(false);
    expect(missing.error?.field).toBe("area");
    expect(valid.ok).toBe(true);
    expect(valid.data?.area).toBe("ALPARAMBA");
  });
});