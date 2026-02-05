"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Check, Clock } from "lucide-react";
import { MemberStatus } from "@/types";

interface JoinClubButtonProps {
  clubId: string;
  userId: string;
  status?: MemberStatus;
}

export function JoinClubButton({ clubId, userId, status }: JoinClubButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.from("club_members").insert({
      club_id: clubId,
      user_id: userId,
      status: "pending",
    });

    if (error) {
      if (error.code === "23505") {
        toast.error("You have already requested to join this club");
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success("Join request sent!");
      router.refresh();
    }

    setLoading(false);
  };

  if (status === "approved") {
    return (
      <Button size="sm" variant="secondary" disabled>
        <Check className="mr-1 h-4 w-4" />
        Member
      </Button>
    );
  }

  if (status === "pending") {
    return (
      <Button size="sm" variant="outline" disabled>
        <Clock className="mr-1 h-4 w-4" />
        Pending
      </Button>
    );
  }

  if (status === "rejected") {
    return (
      <Button size="sm" variant="outline" disabled>
        Rejected
      </Button>
    );
  }

  return (
    <Button size="sm" onClick={handleJoin} disabled={loading}>
      {loading && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
      Join
    </Button>
  );
}
