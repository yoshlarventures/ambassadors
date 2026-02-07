"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import { Calendar, Clock, MapPin, Users, Image as ImageIcon } from "lucide-react";
import { Event, Region, User } from "@/types";
import { EventDetailDialog } from "./event-detail-dialog";

type EventWithRelations = Event & {
  regions: Pick<Region, "name"> | null;
  organizer: Pick<User, "full_name" | "email"> | null;
  event_collaborators?: { user_id?: string; user?: Pick<User, "full_name"> | null }[];
  event_photos?: { id: string; image_url: string }[];
};

interface PublicEventsSectionProps {
  upcomingEvents: EventWithRelations[];
  pastEvents: EventWithRelations[];
  regions?: Pick<Region, "id" | "name">[];
  title?: string;
}

function EventCard({
  event,
  isPast,
  onView,
}: {
  event: EventWithRelations;
  isPast: boolean;
  onView: () => void;
}) {
  const photoCount = event.event_photos?.length || 0;
  const collaborators = event.event_collaborators
    ?.filter((c) => c.user)
    .map((c) => c.user!.full_name) || [];

  return (
    <Card className="flex flex-col overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={onView}>
      {/* Cover image or gradient placeholder */}
      <div className="relative h-36">
        {event.cover_image_url ? (
          <Image
            src={event.cover_image_url}
            alt={event.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
        )}
        <div className="absolute top-2 right-2">
          <Badge>{event.regions?.name}</Badge>
        </div>
        {isPast && event.status === "completed" && (
          <div className="absolute top-2 left-2">
            <Badge variant="secondary">Completed</Badge>
          </div>
        )}
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg line-clamp-1">{event.title}</CardTitle>
        <CardDescription className="text-xs">
          By {event.organizer?.full_name}
          {collaborators.length > 0 && ` & ${collaborators.join(", ")}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-3 pt-0">
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className="text-xs font-normal">
            <Calendar className="h-3 w-3 mr-1" />
            {new Date(event.event_date).toLocaleDateString()}
          </Badge>
          <Badge variant="outline" className="text-xs font-normal">
            <Clock className="h-3 w-3 mr-1" />
            {event.start_time.slice(0, 5)}
            {event.end_time && `-${event.end_time.slice(0, 5)}`}
          </Badge>
          <Badge variant="outline" className="text-xs font-normal">
            <MapPin className="h-3 w-3 mr-1" />
            {event.location}
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {event.max_attendees && !isPast && (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              Max {event.max_attendees}
            </span>
          )}
          {isPast && event.confirmed_attendees && (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {event.confirmed_attendees} attended
            </span>
          )}
          {isPast && photoCount > 0 && (
            <span className="flex items-center gap-1">
              <ImageIcon className="h-3 w-3" />
              {photoCount} photo{photoCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function PublicEventsSection({
  upcomingEvents,
  pastEvents,
  regions = [],
  title = "Public Events",
}: PublicEventsSectionProps) {
  const [viewEvent, setViewEvent] = useState<EventWithRelations | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>("all");

  // Filter events on client side using user's LOCAL time (not UTC!)
  const now = new Date();
  // Use local date components, not toISOString() which gives UTC
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const currentTime = now.toTimeString().slice(0, 5); // "HH:MM" in local time

  // Filter to only show events that haven't started yet (based on user's local time)
  const filteredUpcoming = upcomingEvents.filter((event) => {
    const eventTime = event.start_time.slice(0, 5);
    if (event.event_date > today) return true;
    if (event.event_date === today && eventTime > currentTime) return true;
    return false;
  });

  // Apply region filter
  const regionFilteredUpcoming = selectedRegion === "all"
    ? filteredUpcoming
    : filteredUpcoming.filter((event) => event.region_id === selectedRegion);

  const regionFilteredPast = selectedRegion === "all"
    ? pastEvents
    : pastEvents.filter((event) => event.region_id === selectedRegion);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        {regions.length > 0 && (
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger className="w-[180px]">
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
        )}
      </div>
      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({regionFilteredUpcoming.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({regionFilteredPast.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          {regionFilteredUpcoming.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold">No upcoming events</h3>
                <p className="text-muted-foreground">
                  {selectedRegion !== "all" ? "No events in this region. Try selecting a different region." : "Check back later for new events"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {regionFilteredUpcoming.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  isPast={false}
                  onView={() => setViewEvent(event)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past">
          {regionFilteredPast.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold">No past events</h3>
                <p className="text-muted-foreground">
                  {selectedRegion !== "all" ? "No completed events in this region." : "Completed events will appear here"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {regionFilteredPast.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  isPast={true}
                  onView={() => setViewEvent(event)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {viewEvent && (
        <EventDetailDialog
          event={viewEvent}
          open={!!viewEvent}
          onOpenChange={(open) => !open && setViewEvent(null)}
          showActivityLog={false}
        />
      )}
    </div>
  );
}
