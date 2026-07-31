import type { OccupationStatus } from "@/lib/backend/dto/member.dto";

export const OCCUPATION_STATUSES = [
  "student",
  "employed",
  "self_employed",
  "not_employed",
  "other",
] as const satisfies readonly OccupationStatus[];

export const OCCUPATION_STATUS_LABELS: Record<OccupationStatus, string> = {
  student: "Student",
  employed: "Employed",
  self_employed: "Self-employed",
  not_employed: "Not employed",
  other: "Other",
};

export function formatOccupationStatus(value?: OccupationStatus): string {
  return value ? OCCUPATION_STATUS_LABELS[value] : "Not specified";
}