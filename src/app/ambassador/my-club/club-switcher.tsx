"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Suspense } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ClubOption {
  id: string;
  name: string;
}

interface ClubSwitcherProps {
  clubs: ClubOption[];
  currentClubId: string;
}

function ClubSwitcherContent({ clubs, currentClubId }: ClubSwitcherProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  if (clubs.length <= 1) {
    return null;
  }

  const handleClubChange = (clubId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("clubId", clubId);
    // Stay on current sub-page when switching clubs
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Switch club:</span>
      <Select value={currentClubId} onValueChange={handleClubChange}>
        <SelectTrigger className="w-[250px]">
          <SelectValue placeholder="Select club" />
        </SelectTrigger>
        <SelectContent>
          {clubs.map((club) => (
            <SelectItem key={club.id} value={club.id}>
              {club.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function ClubSwitcher({ clubs, currentClubId }: ClubSwitcherProps) {
  if (clubs.length <= 1) {
    return null;
  }

  return (
    <Suspense fallback={<div className="h-10 w-[250px] bg-muted animate-pulse rounded" />}>
      <ClubSwitcherContent clubs={clubs} currentClubId={currentClubId} />
    </Suspense>
  );
}
