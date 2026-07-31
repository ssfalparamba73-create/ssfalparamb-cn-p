import type {
  CreateMemberInput,
  CompleteMemberProfileInput,
  FamilyMemberInput,
  UpdateMemberInput,
  UpdateMemberProfileInput,
} from "../contracts/member.contract";
import type { BackendResult } from "../contracts/common.contract";
import type { MemberListFilters } from "../dto/member.dto";
import { fail, ok } from "../errors/resultHelpers";
import { validationError } from "../errors/createBackendError";
import {
  validatePhone,
  validatePositiveAmount,
  validateRequiredString,
  includesValue,
} from "./commonSchemas";

const memberStatuses = ["active", "inactive", "blocked"] as const;
const monthlyTiers = ["base", "premium", "custom", "flexible"] as const;
const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
const paymentStatuses = ["clear", "arrears", "long_overdue"] as const;
const occupationStatuses = ["student", "employed", "self_employed", "not_employed", "other"] as const;
const workLocations = ["india", "abroad"] as const;
const memberSortOptions = ["newest", "name-asc", "name-desc", "dues-desc"] as const;
const MAX_FAMILY_MEMBERS = 25;

export function validateCreateMemberInput(input: Partial<CreateMemberInput>): BackendResult<CreateMemberInput> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return fail(validationError("Member input must be an object."));
  }
  const name = validateRequiredString(input.name, "name", "Name");
  if (!name.ok) return fail(name.error!);
  if (name.data!.length > 120) return fail(validationError("Name is too long.", "name"));

  const phone = validatePhone(input.phone);
  if (!phone.ok) return fail(phone.error!);

  const amount = validatePositiveAmount(input.monthlyAmount ?? 50, "monthlyAmount", 1);
  if (!amount.ok) return fail(amount.error!);

  const tier = input.monthlyTier ?? "flexible";
  if (!includesValue(monthlyTiers, tier)) {
    return fail(validationError("Invalid monthly tier.", "monthlyTier"));
  }

  const status = input.status ?? "active";
  if (!includesValue(memberStatuses, status)) {
    return fail(validationError("Invalid member status.", "status"));
  }

  const age = validateAge(input.age, "age");
  if (!age.ok) return fail(age.error!);

  const joinedAt = validateJoinedAt(input.joinedAt);
  if (!joinedAt.ok) return fail(joinedAt.error!);

  if (input.bloodGroup && !includesValue(bloodGroups, input.bloodGroup)) {
    return fail(validationError("Invalid blood group.", "bloodGroup"));
  }

  const alternatePhone = validateOptionalPhone(input.alternatePhone, "alternatePhone");
  if (!alternatePhone.ok) return fail(alternatePhone.error!);

  const familyMembers = validateFamilyMembers(input.familyMembers);
  if (!familyMembers.ok) return fail(familyMembers.error!);

  const area = validateRequiredString(input.area, "area", "Block");
  if (!area.ok) return fail(area.error!);
  if (area.data!.length > 80) return fail(validationError("Block is too long.", "area"));

  const structuredProfile = validateStructuredProfile(input);
  if (!structuredProfile.ok) return fail(structuredProfile.error!);

  const isBloodDonor = Boolean(input.isBloodDonor);
  return ok({
    name: name.data!,
    phone: phone.data!,
    alternatePhone: alternatePhone.data ?? undefined,
    age: age.data ?? undefined,
    address: normalizeOptionalString(input.address),
    area: normalizeOptionalString(input.area),
    ...structuredProfile.data!,
    monthlyTier: tier,
    monthlyAmount: amount.data!,
    status,
    joinedAt: joinedAt.data ?? undefined,
    bloodGroup: input.bloodGroup,
    isBloodDonor,
    donorAvailable: isBloodDonor && Boolean(input.donorAvailable),
    familyMembers: familyMembers.data ?? undefined,
  });
}

export function validateUpdateMemberInput(input: UpdateMemberInput): BackendResult<UpdateMemberInput> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return fail(validationError("Member input must be an object."));
  }
  const output: UpdateMemberInput = { ...input };

  if (hasOwn(input, "name")) {
    const name = validateRequiredString(input.name, "name", "Name");
    if (!name.ok) return fail(name.error!);
    if (name.data!.length > 120) return fail(validationError("Name is too long.", "name"));
    output.name = name.data!;
  }

  if (hasOwn(input, "phone")) {
    const phone = validatePhone(input.phone);
    if (!phone.ok) return fail(phone.error!);
    output.phone = phone.data!;
  }

  if (hasOwn(input, "alternatePhone")) {
    const alternatePhone = validateOptionalPhone(input.alternatePhone, "alternatePhone");
    if (!alternatePhone.ok) return fail(alternatePhone.error!);
    output.alternatePhone = alternatePhone.data ?? "";
  }

  if (hasOwn(input, "age")) {
    const age = validateAge(input.age, "age");
    if (!age.ok) return fail(age.error!);
    output.age = age.data ?? undefined;
  }

  if (input.monthlyAmount !== undefined) {
    const amount = validatePositiveAmount(input.monthlyAmount, "monthlyAmount", 1);
    if (!amount.ok) return fail(amount.error!);
    output.monthlyAmount = amount.data!;
  }

  if (input.status && !includesValue(memberStatuses, input.status)) {
    return fail(validationError("Invalid member status. Use soft delete for left members.", "status"));
  }

  if (input.monthlyTier && !includesValue(monthlyTiers, input.monthlyTier)) {
    return fail(validationError("Invalid monthly tier.", "monthlyTier"));
  }

  if (input.bloodGroup && !includesValue(bloodGroups, input.bloodGroup)) {
    return fail(validationError("Invalid blood group.", "bloodGroup"));
  }

  if (hasOwn(input, "joinedAt")) {
    const joinedAt = validateJoinedAt(input.joinedAt);
    if (!joinedAt.ok) return fail(joinedAt.error!);
    output.joinedAt = joinedAt.data ?? undefined;
  }

  if (hasOwn(input, "familyMembers")) {
    const familyMembers = validateFamilyMembers(input.familyMembers);
    if (!familyMembers.ok) return fail(familyMembers.error!);
    output.familyMembers = familyMembers.data ?? undefined;
  }

  if (hasOwn(input, "address")) output.address = normalizeOptionalString(input.address) ?? "";
  if (hasOwn(input, "area")) output.area = normalizeOptionalString(input.area) ?? "";
  if (hasOwn(input, "occupation")) output.occupation = normalizeOptionalString(input.occupation) ?? "";
  if (hasStructuredProfileFields(input)) {
    const structuredProfile = validateStructuredProfile(input);
    if (!structuredProfile.ok) return fail(structuredProfile.error!);
    Object.assign(output, structuredProfile.data);
  }
  if (hasOwn(input, "isBloodDonor")) {
    if (typeof input.isBloodDonor !== "boolean") {
      return fail(validationError("Invalid blood donor status.", "isBloodDonor"));
    }
    output.isBloodDonor = input.isBloodDonor;
  }
  if (hasOwn(input, "donorAvailable")) {
    if (typeof input.donorAvailable !== "boolean") {
      return fail(validationError("Invalid donor availability.", "donorAvailable"));
    }
    output.donorAvailable = input.donorAvailable;
  }
  if (input.isBloodDonor === false) output.donorAvailable = false;

  return ok(output);
}

export function validateUpdateMemberProfileInput(
  input: UpdateMemberProfileInput
): BackendResult<UpdateMemberProfileInput> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return fail(validationError("Profile input must be an object."));
  }
  const output: UpdateMemberProfileInput = {};

  if (hasOwn(input, "name")) {
    const name = validateRequiredString(input.name, "name", "Name");
    if (!name.ok) return fail(name.error!);
    if (name.data!.length > 120) return fail(validationError("Name is too long.", "name"));
    output.name = name.data!;
  }

  if (hasOwn(input, "whatsapp")) {
    const whatsapp = validateOptionalPhone(input.whatsapp, "whatsapp");
    if (!whatsapp.ok) return fail(whatsapp.error!);
    output.whatsapp = whatsapp.data ?? "";
  }

  if (hasOwn(input, "age")) {
    const age = validateAge(input.age, "age");
    if (!age.ok || age.data === undefined || age.data === null) {
      return fail(age.error ?? validationError("Age is required.", "age"));
    }
    output.age = age.data;
  }

  if (hasOwn(input, "bloodGroup")) {
    if (input.bloodGroup && !includesValue(bloodGroups, input.bloodGroup)) {
      return fail(validationError("Invalid blood group.", "bloodGroup"));
    }
    output.bloodGroup = input.bloodGroup ?? "";
  }

  if (hasOwn(input, "address")) {
    const address = normalizeOptionalString(input.address) ?? "";
    if (address.length > 500) return fail(validationError("Address is too long.", "address"));
    output.address = address;
  }

  if (hasOwn(input, "area")) {
    const area = normalizeOptionalString(input.area) ?? "";
    if (!area) return fail(validationError("Block is required.", "area"));
    if (area.length > 80) return fail(validationError("Block is too long.", "area"));
    output.area = area;
  }

  if (hasOwn(input, "occupation")) {
    const occupation = normalizeOptionalString(input.occupation) ?? "";
    if (occupation.length > 120) return fail(validationError("Occupation is too long.", "occupation"));
    output.occupation = occupation;
  }

  if (hasStructuredProfileFields(input)) {
    const structuredProfile = validateStructuredProfile(input);
    if (!structuredProfile.ok) return fail(structuredProfile.error!);
    Object.assign(output, structuredProfile.data);
  }

  if (hasOwn(input, "biometricEnabled")) {
    if (typeof input.biometricEnabled !== "boolean") {
      return fail(validationError("Invalid biometric preference.", "biometricEnabled"));
    }
    output.biometricEnabled = input.biometricEnabled;
  }

  return ok(output);
}

export function validateCompleteMemberProfileInput(
  input: CompleteMemberProfileInput
): BackendResult<CompleteMemberProfileInput> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return fail(validationError("Profile completion input must be an object."));
  }

  const whatsapp = validatePhone(input.whatsapp, "whatsapp");
  if (!whatsapp.ok) return fail(whatsapp.error!);

  const age = validateAge(input.age, "age");
  if (!age.ok || age.data === undefined || age.data === null) {
    return fail(age.error ?? validationError("Age is required.", "age"));
  }

  if (!input.bloodGroup || !includesValue(bloodGroups, input.bloodGroup)) {
    return fail(validationError("Blood group is required.", "bloodGroup"));
  }

  const address = validateRequiredString(input.address, "address", "Address");
  if (!address.ok) return fail(address.error!);
  if (address.data!.length > 500) {
    return fail(validationError("Address is too long.", "address"));
  }

  const area = validateRequiredString(input.area, "area", "Block");
  if (!area.ok) return fail(area.error!);
  if (area.data!.length > 80) return fail(validationError("Block is too long.", "area"));

  const structuredProfile = validateStructuredProfile(input);
  if (!structuredProfile.ok) return fail(structuredProfile.error!);

  return ok({
    whatsapp: whatsapp.data!,
    age: age.data,
    bloodGroup: input.bloodGroup,
    address: address.data!,
    area: area.data!,
    ...structuredProfile.data!,
  });
}

export function validateMemberListFilters(input: MemberListFilters): BackendResult<MemberListFilters> {
  const allMemberStatuses = [...memberStatuses, "left"] as const;
  if (input.status && !includesValue(allMemberStatuses, input.status)) {
    return fail(validationError("Invalid member status filter.", "status"));
  }

  if (input.monthlyTier && !includesValue(monthlyTiers, input.monthlyTier)) {
    return fail(validationError("Invalid monthly tier filter.", "monthlyTier"));
  }

  if (input.bloodGroup && !includesValue(bloodGroups, input.bloodGroup)) {
    return fail(validationError("Invalid blood group filter.", "bloodGroup"));
  }

  if (input.occupationStatus && input.occupationStatus !== "not_specified" && !includesValue(occupationStatuses, input.occupationStatus)) {
    return fail(validationError("Invalid employment / study status filter.", "occupationStatus"));
  }

  if (input.workLocation && input.workLocation !== "not_specified" && !includesValue(workLocations, input.workLocation)) {
    return fail(validationError("Invalid work location filter.", "workLocation"));
  }

  if (input.paymentStatus && !includesValue(paymentStatuses, input.paymentStatus)) {
    return fail(validationError("Invalid payment status filter.", "paymentStatus"));
  }

  if (input.isBloodDonor !== undefined && typeof input.isBloodDonor !== "boolean") {
    return fail(validationError("Invalid blood donor filter.", "isBloodDonor"));
  }

  if (input.donorAvailable !== undefined && typeof input.donorAvailable !== "boolean") {
    return fail(validationError("Invalid donor availability filter.", "donorAvailable"));
  }

  if (input.sort && !includesValue(memberSortOptions, input.sort)) {
    return fail(validationError("Invalid member sort option.", "sort"));
  }

  return ok(input);
}

interface StructuredProfileInput {
  isStudent?: boolean;
  studentClass?: string;
  studentCourse?: string;
  studentInstitution?: string;
  isMuthaallim?: boolean;
  muthaallimInstitution?: string;
  occupation?: string;
  workLocation?: string;
}

interface StructuredProfileData {
  isStudent: boolean;
  studentClass?: string;
  studentCourse?: string;
  studentInstitution?: string;
  isMuthaallim: boolean;
  muthaallimInstitution?: string;
  occupation?: string;
  workLocation?: "india" | "abroad";
}

function hasStructuredProfileFields(input: StructuredProfileInput): boolean {
  return [
    "isStudent",
    "studentClass",
    "studentCourse",
    "studentInstitution",
    "isMuthaallim",
    "muthaallimInstitution",
    "occupation",
    "workLocation",
  ].some((key) => hasOwn(input, key));
}

function validateStructuredProfile(input: StructuredProfileInput): BackendResult<StructuredProfileData> {
  if (typeof input.isStudent !== "boolean") {
    return fail(validationError("Please select whether you are a student.", "isStudent"));
  }
  if (typeof input.isMuthaallim !== "boolean") {
    return fail(validationError("Please select whether you are a Mutha'allim.", "isMuthaallim"));
  }

  const studentClass = normalizeOptionalString(input.studentClass);
  const studentCourse = normalizeOptionalString(input.studentCourse);
  const studentInstitution = normalizeOptionalString(input.studentInstitution);
  const muthaallimInstitution = normalizeOptionalString(input.muthaallimInstitution);
  const occupation = normalizeOptionalString(input.occupation);
  const textFields = [studentClass, studentCourse, studentInstitution, muthaallimInstitution];
  if (textFields.some((value) => (value?.length ?? 0) > 160)) {
    return fail(validationError("Study information is too long.", "studentInstitution"));
  }
  if ((occupation?.length ?? 0) > 120) return fail(validationError("Occupation is too long.", "occupation"));
  if (input.workLocation && !includesValue(workLocations, input.workLocation)) {
    return fail(validationError("Please select India or Abroad.", "workLocation"));
  }

  if (input.isStudent && !studentClass) return fail(validationError("Class is required for students.", "studentClass"));
  if (input.isStudent && !studentCourse) return fail(validationError("Course is required for students.", "studentCourse"));
  if (input.isStudent && !studentInstitution) return fail(validationError("Institution is required for students.", "studentInstitution"));
  if (input.isMuthaallim && !muthaallimInstitution) {
    return fail(validationError("Institution is required for Mutha'allim members.", "muthaallimInstitution"));
  }

  return ok({
    isStudent: input.isStudent,
    studentClass: input.isStudent ? studentClass : undefined,
    studentCourse: input.isStudent ? studentCourse : undefined,
    studentInstitution: input.isStudent ? studentInstitution : undefined,
    isMuthaallim: input.isMuthaallim,
    muthaallimInstitution: input.isMuthaallim ? muthaallimInstitution : undefined,
    occupation: !input.isStudent && !input.isMuthaallim ? occupation : undefined,
    workLocation: !input.isStudent && !input.isMuthaallim ? input.workLocation as "india" | "abroad" | undefined : undefined,
  });
}
function validateFamilyMembers(input: FamilyMemberInput[] | undefined): BackendResult<FamilyMemberInput[] | undefined> {
  if (input === undefined) return ok(undefined);
  if (!Array.isArray(input)) return fail(validationError("Family members must be a list.", "familyMembers"));
  if (input.length > MAX_FAMILY_MEMBERS) {
    return fail(validationError(`A maximum of ${MAX_FAMILY_MEMBERS} family members is allowed.`, "familyMembers"));
  }

  const members: FamilyMemberInput[] = [];
  for (let index = 0; index < input.length; index += 1) {
    const item = input[index];
    if (!item || typeof item !== "object") {
      return fail(validationError("Invalid family member.", `familyMembers.${index}`));
    }

    const name = validateRequiredString(item.name, `familyMembers.${index}.name`, "Family member name");
    if (!name.ok) return fail(name.error!);
    const relationship = validateRequiredString(
      item.relationship,
      `familyMembers.${index}.relationship`,
      "Relationship"
    );
    if (!relationship.ok) return fail(relationship.error!);
    if (name.data!.length > 120 || relationship.data!.length > 60) {
      return fail(validationError("Family member text is too long.", `familyMembers.${index}`));
    }

    const age = validateAge(item.age, `familyMembers.${index}.age`);
    if (!age.ok) return fail(age.error!);
    if (item.bloodGroup && !includesValue(bloodGroups, item.bloodGroup)) {
      return fail(validationError("Invalid blood group.", `familyMembers.${index}.bloodGroup`));
    }
    const phone = validateOptionalPhone(item.phone, `familyMembers.${index}.phone`);
    if (!phone.ok) return fail(phone.error!);

    members.push({
      id: item.id,
      name: name.data!,
      relationship: relationship.data!,
      age: age.data ?? undefined,
      bloodGroup: item.bloodGroup,
      isBloodDonor: Boolean(item.isBloodDonor),
      phone: phone.data ?? undefined,
    });
  }

  return ok(members);
}

function validateAge(input: number | undefined, field: string): BackendResult<number | undefined> {
  if (input === undefined) return ok(undefined);
  if (!Number.isInteger(input) || input < 0 || input > 130) {
    return fail(validationError("Age must be a whole number between 0 and 130.", field));
  }
  return ok(input);
}

function validateJoinedAt(input: string | undefined): BackendResult<string | undefined> {
  if (!input) return ok(undefined);
  const timestamp = Date.parse(input);
  if (Number.isNaN(timestamp)) return fail(validationError("Invalid joined date.", "joinedAt"));
  if (timestamp > Date.now() + 86_400_000) {
    return fail(validationError("Joined date cannot be in the future.", "joinedAt"));
  }
  return ok(new Date(timestamp).toISOString());
}

function validateOptionalPhone(input: string | undefined, field: string): BackendResult<string | undefined> {
  if (!input?.trim()) return ok(undefined);
  const phone = validatePhone(input, field);
  return phone.ok ? ok(phone.data!) : fail(phone.error!);
}

function normalizeOptionalString(input: string | undefined): string | undefined {
  return input === undefined ? undefined : input.trim();
}

function hasOwn(value: object, key: PropertyKey): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}
