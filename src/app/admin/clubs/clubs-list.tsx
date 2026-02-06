"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ClubActions } from "@/components/clubs/club-actions";
import { AmbassadorOption } from "@/components/clubs/create-club-dialog";
import { Search } from "lucide-react";
import { Region, Club } from "@/types";

interface ClubAmbassador {
  id: string;
  ambassador_id: string;
  is_primary: boolean;
  ambassador: { full_name: string; email: string; avatar_url: string | null } | null;
}

interface ClubWithData extends Club {
  club_ambassadors: ClubAmbassador[];
  regions: { name: string } | null;
  club_members: { id: string; status: string }[];
  sessions: { id: string; session_date: string; start_time: string; is_confirmed: boolean }[];
}

interface ClubsListProps {
  clubs: ClubWithData[];
  regions: Region[];
  ambassadors: AmbassadorOption[];
}

export function ClubsList({ clubs, regions, ambassadors }: ClubsListProps) {
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState<string>("all");

  // Calculate if session is past
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const currentTime = now.toTimeString().slice(0, 5);

  const isSessionPast = (session: { session_date: string; start_time: string }) => {
    if (session.session_date < today) return true;
    if (session.session_date === today && session.start_time.slice(0, 5) <= currentTime) return true;
    return false;
  };

  const filteredClubs = useMemo(() => {
    return clubs.filter((club) => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesName = club.name.toLowerCase().includes(searchLower);
        const matchesAddress = club.address?.toLowerCase().includes(searchLower);
        const matchesAmbassador = club.club_ambassadors?.some(
          (ca) => ca.ambassador?.full_name.toLowerCase().includes(searchLower)
        );
        if (!matchesName && !matchesAddress && !matchesAmbassador) return false;
      }

      // Region filter
      if (regionFilter !== "all" && club.region_id !== regionFilter) {
        return false;
      }

      return true;
    });
  }, [clubs, search, regionFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by club name, address, or ambassador..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={regionFilter} onValueChange={setRegionFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by region" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Regions</SelectItem>
            {regions.map((region) => (
              <SelectItem key={region.id} value={region.id}>
                {region.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Club</TableHead>
            <TableHead>Ambassadors</TableHead>
            <TableHead>Region</TableHead>
            <TableHead>Members</TableHead>
            <TableHead>Sessions</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredClubs.map((club) => {
            const clubAmbassadors = club.club_ambassadors || [];

            const approvedMembers = club.club_members?.filter(
              (m) => m.status === "approved"
            ).length || 0;

            const pastSessionsCount = club.sessions?.filter(
              (s) => isSessionPast(s) && s.is_confirmed
            ).length || 0;

            return (
              <TableRow key={club.id}>
                <TableCell>
                  <Link href={`/admin/clubs/${club.id}`} className="block hover:underline">
                    <div className="font-medium">{club.name}</div>
                    {club.address && (
                      <div className="text-sm text-muted-foreground">{club.address}</div>
                    )}
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {clubAmbassadors.map((ca) => {
                      const amb = ca.ambassador;
                      if (!amb) return null;
                      const initials = amb.full_name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2);
                      return (
                        <div key={ca.id} className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={amb.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{amb.full_name}</span>
                        </div>
                      );
                    })}
                    {clubAmbassadors.length === 0 && (
                      <span className="text-sm text-muted-foreground">No ambassadors</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {club.regions?.name}
                  </Badge>
                </TableCell>
                <TableCell>{approvedMembers}</TableCell>
                <TableCell>{pastSessionsCount}</TableCell>
                <TableCell>
                  {new Date(club.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <ClubActions
                    club={{
                      ...club,
                      club_ambassadors: clubAmbassadors,
                    }}
                    regions={regions}
                    ambassadors={ambassadors}
                    userRole="admin"
                  />
                </TableCell>
              </TableRow>
            );
          })}
          {filteredClubs.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                No clubs found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
