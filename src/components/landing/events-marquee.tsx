"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { MapPin, ArrowRight, Sparkles } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface MarqueeEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  region: string;
  image: string | null;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/** Generates a deterministic gradient based on the event title */
function getPlaceholderGradient(title: string) {
  const gradients = [
    "from-[#ff6005] via-[#ff8040] to-[#feb703]",
    "from-[#feb703] via-[#ff8040] to-[#ff6005]",
    "from-[#ff6005] via-[#feb703] to-[#fec940]",
    "from-[#fec940] via-[#ff6005] to-[#ff8040]",
    "from-[#ff8040] via-[#feb703] to-[#ff6005]",
  ];
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}

function getInitials(title: string) {
  return title
    .split(/[\s:–—-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function EventCard({ event }: { event: MarqueeEvent }) {
  return (
    <Link href="/events" className="block flex-shrink-0 w-[340px] md:w-[380px]">
      <div className="bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover hover:-translate-y-2 transition-all duration-300 cursor-pointer group h-full">
        {/* Image / Placeholder */}
        <div className="relative h-48 overflow-hidden">
          {event.image ? (
            <Image
              src={event.image}
              alt={event.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="380px"
            />
          ) : (
            <div
              className={`h-full w-full bg-gradient-to-br ${getPlaceholderGradient(event.title)} flex items-center justify-center relative`}
            >
              {/* Abstract decorative pattern */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-4 left-4 w-16 h-16 border-2 border-white/40 rounded-full" />
                <div className="absolute bottom-6 right-6 w-24 h-24 border-2 border-white/30 rounded-full" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-white/20 rounded-full" />
                <div className="absolute top-8 right-10 w-8 h-8 bg-white/15 rounded-lg rotate-45" />
                <div className="absolute bottom-10 left-8 w-6 h-6 bg-white/15 rounded-full" />
              </div>
              <div className="relative flex flex-col items-center gap-2">
                <Sparkles size={28} className="text-white/80" />
                <span className="text-white/90 text-3xl font-bold tracking-wider">
                  {getInitials(event.title)}
                </span>
              </div>
            </div>
          )}
          {/* Date badge overlay */}
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-sm">
            <span className="text-xs font-semibold text-gray-800">
              {formatDate(event.date)}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <h4 className="text-lg font-semibold text-gray-900 group-hover:text-[#ff6005] transition-colors line-clamp-2 leading-snug">
            {event.title}
          </h4>
          <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
            <MapPin size={14} className="text-[#ff6005] shrink-0" />
            <span className="truncate">{event.location}</span>
            {event.region && (
              <span className="text-xs text-gray-400 shrink-0">
                · {event.region}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export function EventsMarquee({ events }: { events: MarqueeEvent[] }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const heading = headingRef.current;
    if (!section || !heading) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        heading,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: section,
            start: "top 75%",
            toggleActions: "play none none none",
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const hasEvents = events.length > 0;

  // Duplicate for seamless loop
  const fillEvents = (list: MarqueeEvent[]) => {
    if (list.length === 0) return [];
    const repeats = Math.max(3, Math.ceil(12 / list.length));
    const filled: MarqueeEvent[] = [];
    for (let r = 0; r < repeats; r++) {
      filled.push(...list);
    }
    return filled;
  };

  const row = fillEvents(events);

  return (
    <section ref={sectionRef} className="py-24 overflow-hidden bg-[#fffdf9]">
      {/* Heading */}
      <div ref={headingRef} className="text-center mb-14 px-6 opacity-0">
        <h2
          className="font-bold text-gray-900"
          style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)" }}
        >
          Upcoming Events
        </h2>
        <p className="mt-3 text-gray-500 text-lg max-w-xl mx-auto">
          Workshops, pitch nights, and hackathons happening across Uzbekistan
        </p>
      </div>

      {hasEvents ? (
        <div className="marquee-row gap-8">
          {row.map((event, i) => (
            <div key={`e-${i}`} className="flex-shrink-0 px-2">
              <EventCard event={event} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-400 py-12">
          <p className="text-lg">New events coming soon</p>
        </div>
      )}

      {/* View All CTA */}
      <div className="mt-12 text-center">
        <Link href="/events">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-gradient px-8 py-3.5 text-base font-semibold text-white shadow-brand hover:shadow-brand-lg transition-all duration-300 hover:scale-105 group">
            View All Events
            <ArrowRight
              size={18}
              className="group-hover:translate-x-1 transition-transform"
            />
          </span>
        </Link>
      </div>
    </section>
  );
}
