"use client";

import { useEffect, useRef } from "react";
import { GraduationCap, Users, Rocket } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const panels = [
  {
    icon: GraduationCap,
    title: "Learn",
    subtitle: "Startup Fundamentals",
    description:
      "Access free courses on ideation, validation, business models, and building your first MVP. Learn from real founders and mentors.",
    accent: "from-[#ff6005] to-[#ff8040]",
  },
  {
    icon: Users,
    title: "Community",
    subtitle: "Nationwide Network",
    description:
      "Connect with clubs across 14 regions. Attend events, find co-founders, and grow your network with thousands of like-minded youth.",
    accent: "from-[#ff8040] to-[#feb703]",
  },
  {
    icon: Rocket,
    title: "Investment",
    subtitle: "Path to Funding",
    description:
      "The best ideas get funded. Pitch to Yoshlar Ventures and turn your startup dream into a real, funded company.",
    accent: "from-[#feb703] to-[#fec940]",
  },
];

export function ValueCards() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    // Only horizontal scroll on desktop
    const mm = gsap.matchMedia();

    mm.add("(min-width: 768px)", () => {
      const totalScroll = track.scrollWidth - window.innerWidth;

      const tween = gsap.to(track, {
        x: -totalScroll,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          pin: true,
          scrub: 1,
          end: () => `+=${totalScroll}`,
          invalidateOnRefresh: true,
        },
      });

      // Progress bar
      if (progressRef.current) {
        gsap.to(progressRef.current, {
          scaleX: 1,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            scrub: 1,
            start: "top top",
            end: () => `+=${totalScroll}`,
          },
        });
      }

      return () => {
        tween.kill();
      };
    });

    return () => mm.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-white">
      {/* Desktop: horizontal scroll track */}
      <div
        ref={trackRef}
        className="flex flex-col md:flex-row items-stretch gap-8 px-6 py-24 md:py-0 md:h-screen md:items-center md:gap-12 md:px-[10vw]"
        style={{ willChange: "transform" }}
      >
        {panels.map((panel) => {
          const Icon = panel.icon;
          return (
            <div
              key={panel.title}
              className="flex-shrink-0 w-full md:w-[75vw] bg-gray-50 rounded-3xl p-10 md:p-16 flex flex-col justify-center shadow-card hover:shadow-card-hover transition-shadow duration-500"
            >
              <div
                className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${panel.accent} mb-8`}
              >
                <Icon size={32} className="text-white" />
              </div>
              <h3
                className="font-bold text-gray-900 leading-tight"
                style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}
              >
                {panel.title}
              </h3>
              <p className="text-lg md:text-xl text-gray-500 font-medium mt-1">
                {panel.subtitle}
              </p>
              <p className="mt-6 text-gray-600 text-base md:text-lg max-w-xl leading-relaxed">
                {panel.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Progress bar (desktop only) */}
      <div className="hidden md:block absolute bottom-8 left-1/2 -translate-x-1/2 w-48 h-[3px] bg-gray-200 rounded-full overflow-hidden">
        <div
          ref={progressRef}
          className="h-full bg-brand-gradient rounded-full origin-left"
          style={{ transform: "scaleX(0)" }}
        />
      </div>
    </section>
  );
}
