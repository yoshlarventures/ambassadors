"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Trophy } from "lucide-react";
import { awardManualPoints } from "@/app/actions/points";

interface Member {
  id: string;
  full_name: string;
  email: string;
}

interface GivePointsFormProps {
  members: Member[];
  clubId: string;
}

export function GivePointsForm({ members, clubId }: GivePointsFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [memberId, setMemberId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!memberId) {
      toast.error("Please select a member");
      return;
    }

    if (!reason.trim()) {
      toast.error("Please provide a reason");
      return;
    }

    const pointAmount = parseInt(amount, 10);
    if (isNaN(pointAmount) || pointAmount < 1 || pointAmount > 100) {
      toast.error("Amount must be between 1 and 100");
      return;
    }

    setLoading(true);
    const result = await awardManualPoints(memberId, pointAmount, reason.trim(), clubId);
    setLoading(false);

    if (result.success) {
      toast.success("Points awarded successfully!");
      setMemberId("");
      setAmount("");
      setReason("");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to award points");
    }
  };

  if (members.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">
        No approved members in this club yet.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="member">Member</Label>
        <Select value={memberId} onValueChange={setMemberId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a member" />
          </SelectTrigger>
          <SelectContent>
            {members.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reason">Reason <span className="text-destructive">*</span></Label>
        <Input
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g., Helped organize the workshop"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Points (1-100)</Label>
        <Input
          id="amount"
          type="number"
          min="1"
          max="100"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="10"
          required
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Trophy className="mr-2 h-4 w-4" />
        )}
        Award Points
      </Button>
    </form>
  );
}
