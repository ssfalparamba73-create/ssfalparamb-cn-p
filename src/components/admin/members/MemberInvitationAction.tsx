"use client";

import { useState, type MouseEvent } from "react";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import type { Member } from "@/lib/admin/admin-types";
import type { IssuedMemberPinDTO } from "@/lib/backend/dto/member.dto";
import { issueAdminMemberPin } from "@/lib/api/memberClient";
import { Button } from "@/components/ui/button";
import { MemberInvitationDialog } from "./MemberInvitationDialog";

interface MemberInvitationActionProps {
  member: Member;
  compact?: boolean;
}

export function MemberInvitationAction({ member, compact = false }: MemberInvitationActionProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [invitation, setInvitation] = useState<IssuedMemberPinDTO | null>(null);

  const generate = async (event: MouseEvent) => {
    event.stopPropagation();
    if (member.status !== "active") return;
    const confirmed = window.confirm(
      `Generate a new login PIN for ${member.name}? The previous PIN will stop working and active member sessions will be logged out.`
    );
    if (!confirmed) return;

    setIsGenerating(true);
    try {
      setInvitation(await issueAdminMemberPin(member.id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to prepare the invitation.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isGenerating || member.status !== "active"}
        title={member.status === "active" ? "Generate a new one-time login invitation" : "Only active members can receive invitations"}
        onClick={generate}
        className={compact ? "h-8 px-2" : ""}
      >
        <MessageCircle className="h-4 w-4" />
        {!compact && <span className="ml-2">{isGenerating ? "Generating..." : member.pinStatus === "issued" ? "Resend Invite" : "Invite"}</span>}
      </Button>
      {invitation && (
        <MemberInvitationDialog
          memberName={invitation.memberName}
          phone={invitation.phone}
          pin={invitation.pin}
          message={invitation.message}
          title="Member invitation ready"
          description="Share this new login invitation now. The previous PIN no longer works, and this PIN is shown only once."
          onClose={() => setInvitation(null)}
        />
      )}
    </>
  );
}
