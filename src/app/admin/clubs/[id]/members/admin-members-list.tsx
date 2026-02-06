"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye } from "lucide-react";

interface Member {
  id: string;
  status: string;
  joined_at: string | null;
  approval_notes: string | null;
  approval_screenshot_url: string | null;
  users: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
  } | null;
}

interface AdminMembersListProps {
  members: Member[];
  emptyMessage: string;
}

export function AdminMembersList({ members, emptyMessage }: AdminMembersListProps) {
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [viewingMember, setViewingMember] = useState<Member | null>(null);

  const handleViewDetails = (member: Member) => {
    setViewingMember(member);
    setViewDetailsOpen(true);
  };

  if (members.length === 0) {
    return <p className="text-muted-foreground text-center py-8">{emptyMessage}</p>;
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
              <div className="flex items-center gap-4">
                {member.joined_at && (
                  <div className="text-sm text-muted-foreground">
                    Joined {new Date(member.joined_at).toLocaleDateString()}
                  </div>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleViewDetails(member)}
                >
                  <Eye className="mr-1 h-4 w-4" />
                  Details
                </Button>
              </div>
            </div>
          );
        })}
      </div>

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

              <div>
                <div className="text-sm font-medium">Status</div>
                <div className="text-sm text-muted-foreground capitalize">
                  {viewingMember.status}
                </div>
              </div>

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

              {!viewingMember.approval_notes && !viewingMember.approval_screenshot_url && (
                <div className="text-sm text-muted-foreground">
                  No approval notes or screenshot available.
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
