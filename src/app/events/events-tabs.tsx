"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Clock, MapPin, Users, Image as ImageIcon, Eye } from "lucide-react";
import { EventDetailDialog } from "@/components/events/event-detail-dialog";
import { Event, Region, User } from "@/types";

type EventWithRelations = Event & {
  regions: Pick<Region, "name"> | null;
  organizer: Pick<User, "full_name" | "email"> | null;
  event_collaborators?: { user_id?: string; user?: Pick<User, "full_name"> | null }[];
  event_photos?: { id: string; image_url: string }[];
};

interface EventsTabsProps {
  approvedEvents: EventWithRelations[];
  pastEvents: EventWithRelations[];
  regions?: Pick<Region, "id" | "name">[];
}

export function EventsTabs({
  approvedEvents,
  pastEvents,
  regions = [],
}: EventsTabsProps) {
  const [viewEvent, setViewEvent] = useState<EventWithRelations | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>("all");

  // Filter events on client side using user's LOCAL time (not UTC!)
  const now = new Date();
  // Use local date components, not toISOString() which gives UTC
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const currentTime = now.toTimeString().slice(0, 5); // "HH:MM" in local time

  const upcomingEvents = approvedEvents.filter((event) => {
    const eventTime = event.start_time.slice(0, 5);
    if (event.event_date > today) return true;
    if (event.event_date === today && eventTime > currentTime) return true;
    return false;
  });

  // Apply region filter
  const regionFilteredUpcoming = selectedRegion === "all"
    ? upcomingEvents
    : upcomingEvents.filter((event) => event.region_id === selectedRegion);

  const regionFilteredPast = selectedRegion === "all"
    ? pastEvents
    : pastEvents.filter((event) => event.region_id === selectedRegion);

  return (
    <>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div />
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

      <Tabs defaultValue="upcoming" className="space-y-6">
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
              {regionFilteredUpcoming.map((event) => {
                const collaborators = event.event_collaborators
                  ?.filter((c) => c.user)
                  .map((c) => c.user!.full_name) || [];

                return (
                  <Card key={event.id} className="flex flex-col">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg">{event.title}</CardTitle>
                        <Badge>{event.regions?.name}</Badge>
                      </div>
                      <CardDescription>
                        By {event.organizer?.full_name}
                        {collaborators.length > 0 && ` & ${collaborators.join(", ")}`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                      {event.description && (
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {event.description}
                        </p>
                      )}
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{new Date(event.event_date).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {event.start_time.slice(0, 5)}
                            {event.end_time && ` - ${event.end_time.slice(0, 5)}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{event.location}</span>
                        </div>
                        {event.max_attendees && (
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>Max {event.max_attendees} attendees</span>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => setViewEvent(event)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
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
              {regionFilteredPast.map((event) => {
                const photoCount = event.event_photos?.length || 0;
                const collaborators = event.event_collaborators
                  ?.filter((c) => c.user)
                  .map((c) => c.user!.full_name) || [];

                return (
                  <Card key={event.id} className="flex flex-col">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg">{event.title}</CardTitle>
                        <Badge variant="secondary">{event.regions?.name}</Badge>
                      </div>
                      <CardDescription>
                        By {event.organizer?.full_name}
                        {collaborators.length > 0 && ` & ${collaborators.join(", ")}`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                      {event.description && (
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {event.description}
                        </p>
                      )}
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{new Date(event.event_date).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {event.start_time.slice(0, 5)}
                            {event.end_time && ` - ${event.end_time.slice(0, 5)}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{event.location}</span>
                        </div>
                        {event.confirmed_attendees && (
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{event.confirmed_attendees} attended</span>
                          </div>
                        )}
                        {photoCount > 0 && (
                          <div className="flex items-center gap-2">
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                            <span>{photoCount} photo{photoCount !== 1 ? "s" : ""}</span>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => setViewEvent(event)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
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
    </>
  );
}
