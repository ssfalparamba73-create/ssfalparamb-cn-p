import type { Member } from "./admin-types";
import type { MemberDTO } from "../backend/dto/member.dto";

export function mapMemberDto(member: MemberDTO): Member {
  return {
    id: member.id,
    memberId: member.memberCode,
    name: member.name,
    phone: member.phone,
    alternatePhone: member.alternatePhone,
    age: member.age,
    bloodGroup: member.bloodGroup,
    isBloodDonor: member.isBloodDonor,
    donorAvailable: member.donorAvailable,
    address: member.address,
    area: member.area,
    occupation: member.occupation,
    familyCount: member.familyCount,
    status: member.status,
    monthlyTier: member.monthlyTier,
    monthlyAmount: member.monthlyAmount,
    pinStatus: member.pinStatus,
    joinedAt: member.joinedAt,
    lastPaidAt: member.lastPaidAt,
    duesPending: member.duesPending,
    createdAt: member.createdAt,
    updatedAt: member.updatedAt,
    familyMembers: member.familyMembers?.map((familyMember) => ({
      id: familyMember.id,
      memberId: familyMember.memberId,
      name: familyMember.name,
      relationship: familyMember.relationship,
      age: familyMember.age,
      bloodGroup: familyMember.bloodGroup,
      isBloodDonor: familyMember.isBloodDonor,
      phone: familyMember.phone,
    })),
  };
}
