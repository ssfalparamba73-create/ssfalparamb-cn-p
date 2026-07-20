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
  const canPrepareInvitation = member.status === "active";

  const generate = async (event: MouseEvent) => {
    event.stopPropagation();
    if (!canPrepareInvitation) return;

    setIsGenerating(true);
    try {
      setInvitation(await issueAdminMemberPin(member.id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to prepare the invitation.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!canPrepareInvitation) return null;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isGenerating}
        title="Send member login invitation"
        onClick={generate}
        className={compact ? "h-8 px-2" : ""}
      >
        <MessageCircle className="h-4 w-4" />
        {!compact && <span className="ml-2">{isGenerating ? "Preparing..." : "Invite"}</span>}
      </Button>
      {invitation && (
        <MemberInvitationDialog
          memberName={invitation.memberName}
          phone={invitation.phone}
          pin={invitation.pin}
          message={invitation.message}
          title="Member invitation ready"
          description="Share this member's current login invitation. The PIN will stay the same until Reset PIN is used."
          onClose={() => setInvitation(null)}
        />
      )}
    </>
  );
}
