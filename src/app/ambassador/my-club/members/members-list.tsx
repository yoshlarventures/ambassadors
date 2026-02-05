"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ClubMember, User } from "@/types";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Check, X, UserMinus, Eye, Undo2 } from "lucide-react";
import { ApproveMemberDialog } from "./approve-member-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MembersListProps {
  members: (ClubMember & { users: Pick<User, "id" | "full_name" | "email" | "avatar_url"> | null })[];
  clubId: string;
  currentUserId: string;
  showActions?: boolean;
  showRemove?: boolean;
  showUndoReject?: boolean;
}

export function MembersList({ members, clubId, currentUserId, showActions, showRemove, showUndoReject }: MembersListProps) {
  const router = useRouter();
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<typeof members[0] | null>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [viewingMember, setViewingMember] = useState<typeof members[0] | null>(null);

  const handleApproveClick = (member: typeof members[0]) => {
    setSelectedMember(member);
    setApproveDialogOpen(true);
  };

  const handleViewDetails = (member: typeof members[0]) => {
    setViewingMember(member);
    setViewDetailsOpen(true);
  };

  const handleReject = async (memberId: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("club_members")
      .update({ status: "rejected" })
      .eq("id", memberId);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Request rejected");
      router.refresh();
    }
  };

  const handleRemove = async (memberId: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("club_members")
      .update({ status: "removed" })
      .eq("id", memberId);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Member removed");
      router.refresh();
    }
  };

  const handleUndoReject = async (memberId: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("club_members")
      .update({ status: "pending" })
      .eq("id", memberId);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Moved back to pending");
      router.refresh();
    }
  };

  if (members.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No members found</p>;
  }

  return (
    <>
      <div className="space-y-4">
        {members.map((member) => {
          const user = member.users;
          if (!user) return null;

          const initials = user.full_name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

          return (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{user.full_name}</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                  {member.approval_notes && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Note: {member.approval_notes}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {showActions && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleApproveClick(member)}
                    >
                      <Check className="mr-1 h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(member.id)}
                    >
                      <X className="mr-1 h-4 w-4" />
                      Reject
                    </Button>
                  </>
                )}
                {showRemove && (
                  <>
                    {member.approval_screenshot_url && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleViewDetails(member)}
                      >
                        <Eye className="mr-1 h-4 w-4" />
                        Details
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemove(member.id)}
                    >
                      <UserMinus className="mr-1 h-4 w-4" />
                      Remove
                    </Button>
                  </>
                )}
                {showUndoReject && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUndoReject(member.id)}
                  >
                    <Undo2 className="mr-1 h-4 w-4" />
                    Undo Reject
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Approve Member Dialog */}
      {selectedMember && (
        <ApproveMemberDialog
          open={approveDialogOpen}
          onOpenChange={setApproveDialogOpen}
          member={selectedMember}
          clubId={clubId}
          approverId={currentUserId}
        />
      )}

      {/* View Member Details Dialog */}
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Member Details</DialogTitle>
          </DialogHeader>
          {viewingMember && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={viewingMember.users?.avatar_url || undefined} />
                  <AvatarFallback>
                    {viewingMember.users?.full_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{viewingMember.users?.full_name}</div>
                  <div className="text-sm text-muted-foreground">{viewingMember.users?.email}</div>
                </div>
              </div>

              {viewingMember.joined_at && (
                <div>
                  <div className="text-sm font-medium">Joined</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(viewingMember.joined_at).toLocaleDateString()}
                  </div>
                </div>
              )}

              {viewingMember.approval_notes && (
                <div>
                  <div className="text-sm font-medium">Approval Notes</div>
                  <div className="text-sm text-muted-foreground">{viewingMember.approval_notes}</div>
                </div>
              )}

              {viewingMember.approval_screenshot_url && (
                <div>
                  <div className="text-sm font-medium mb-2">Approval Screenshot</div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={viewingMember.approval_screenshot_url}
                    alt="Approval screenshot"
                    className="w-full max-h-64 object-contain rounded-lg border"
                  />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
