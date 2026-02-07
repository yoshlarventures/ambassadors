import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { SectionDivider } from "@/components/landing/section-divider";

const SmoothScrollProvider = dynamic(
  () => import("@/components/landing/smooth-scroll-provider").then((m) => m.SmoothScrollProvider),
  { ssr: false }
);
const HeroSection = dynamic(
  () => import("@/components/landing/hero-section").then((m) => m.HeroSection),
  { ssr: false }
);
const ValueCards = dynamic(
  () => import("@/components/landing/value-cards").then((m) => m.ValueCards),
  { ssr: false }
);
const TextReveal = dynamic(
  () => import("@/components/landing/text-reveal").then((m) => m.TextReveal),
  { ssr: false }
);
const HowItWorks = dynamic(
  () => import("@/components/landing/how-it-works").then((m) => m.HowItWorks),
  { ssr: false }
);
const StatsSection = dynamic(
  () => import("@/components/landing/stats-section").then((m) => m.StatsSection),
  { ssr: false }
);
const AboutAmbassadors = dynamic(
  () => import("@/components/landing/about-ambassadors").then((m) => m.AboutAmbassadors),
  { ssr: false }
);
const EventsMarquee = dynamic(
  () => import("@/components/landing/events-marquee").then((m) => m.EventsMarquee),
  { ssr: false }
);
const PartnersSection = dynamic(
  () => import("@/components/landing/partners-section").then((m) => m.PartnersSection),
  { ssr: false }
);
const FinalCta = dynamic(
  () => import("@/components/landing/final-cta").then((m) => m.FinalCta),
  { ssr: false }
);

async function getUpcomingEvents() {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const { data } = await supabase
    .from("events")
    .select(`
      id,
      title,
      event_date,
      location,
      cover_image_url,
      regions(name),
      event_photos(image_url)
    `)
    .eq("status", "approved")
    .gte("event_date", today)
    .order("event_date", { ascending: true })
    .limit(5);

  return (data || []).map((e) => {
    const photos = (e.event_photos as unknown as { image_url: string }[]) || [];
    return {
      id: e.id,
      title: e.title,
      date: e.event_date,
      location: e.location,
      region: (e.regions as unknown as { name: string } | null)?.name || "",
      image: e.cover_image_url || photos[0]?.image_url || null,
    };
  });
}

export default async function Home() {
  const events = await getUpcomingEvents();

  return (
    <SmoothScrollProvider>
      <main className="overflow-x-hidden">
        <Navbar />
        <HeroSection />
        <ValueCards />
        <SectionDivider variant="wave" direction="white-to-warm" />
        <TextReveal />
        <SectionDivider variant="wave-inverse" direction="warm-to-white" />
        <HowItWorks />
        <StatsSection />
        <AboutAmbassadors />
        <SectionDivider variant="slope" direction="white-to-warm" />
        <EventsMarquee events={events} />
        <SectionDivider variant="slope-inverse" direction="warm-to-white" />
        <PartnersSection />
        <FinalCta />
        <Footer />
      </main>
    </SmoothScrollProvider>
  );
}
