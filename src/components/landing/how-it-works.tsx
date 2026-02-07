"use client";

import { useEffect, useRef } from "react";
import { MapPin, BookOpen, Rocket } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    number: "01",
    icon: MapPin,
    title: "Find a Club Near You",
    description:
      "Browse clubs in your region and sign up for free. There are communities in all 14 regions of Uzbekistan.",
  },
  {
    number: "02",
    icon: BookOpen,
    title: "Learn & Build",
    description:
      "Attend workshops, complete courses, and build your MVP alongside a supportive community of peers.",
  },
  {
    number: "03",
    icon: Rocket,
    title: "Launch & Get Invested",
    description:
      "Pitch your idea to real investors and compete for funding through Yoshlar Ventures.",
  },
];

export function HowItWorks() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<HTMLDivElement[]>([]);
  const numberRefs = useRef<HTMLSpanElement[]>([]);
  const iconRefs = useRef<HTMLDivElement[]>([]);
  const connectorRefs = useRef<SVGPathElement[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      // Heading
      if (headingRef.current) {
        gsap.fromTo(
          headingRef.current,
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section,
              start: "top 70%",
              toggleActions: "play none none none",
            },
          }
        );
      }

      // Step animations
      stepRefs.current.forEach((step, i) => {
        if (!step) return;
        const isEven = i % 2 === 0;

        // Card slide-in from side
        gsap.fromTo(
          step,
          { opacity: 0, x: isEven ? -80 : 80 },
          {
            opacity: 1,
            x: 0,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: step,
              start: "top 82%",
              toggleActions: "play none none none",
            },
          }
        );

        // Number elastic pop
        const num = numberRefs.current[i];
        if (num) {
          gsap.fromTo(
            num,
            { scale: 0.3, opacity: 0 },
            {
              scale: 1,
              opacity: 1,
              duration: 1.2,
              ease: "elastic.out(1, 0.4)",
              scrollTrigger: {
                trigger: step,
                start: "top 82%",
                toggleActions: "play none none none",
              },
            }
          );
        }

        // Icon spin-in
        const icon = iconRefs.current[i];
        if (icon) {
          gsap.fromTo(
            icon,
            { scale: 0, rotation: -180 },
            {
              scale: 1,
              rotation: 0,
              duration: 0.8,
              delay: 0.2,
              ease: "back.out(1.7)",
              scrollTrigger: {
                trigger: step,
                start: "top 82%",
                toggleActions: "play none none none",
              },
            }
          );
        }
      });

      // SVG connector path drawing
      connectorRefs.current.forEach((path) => {
        if (!path) return;
        const length = path.getTotalLength();
        path.style.strokeDasharray = `${length}`;
        path.style.strokeDashoffset = `${length}`;

        const svgEl = path.closest("svg");
        if (!svgEl) return;

        gsap.to(path, {
          strokeDashoffset: 0,
          ease: "none",
          scrollTrigger: {
            trigger: svgEl,
            start: "top 75%",
            end: "bottom 60%",
            scrub: 1,
          },
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-32 px-6 overflow-hidden">
      {/* Heading */}
      <div ref={headingRef} className="text-center mb-24 opacity-0">
        <h2
          className="font-bold text-gray-900"
          style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
        >
          How It Works
        </h2>
        <p className="mt-4 text-gray-500 text-lg max-w-xl mx-auto">
          Your journey from curious student to funded founder
        </p>
      </div>

      <div className="mx-auto max-w-5xl">
        {steps.map((step, i) => {
          const Icon = step.icon;
          const isEven = i % 2 === 0;
          const isLast = i === steps.length - 1;

          return (
            <div key={step.number}>
              {/* Step row */}
              <div
                ref={(el) => {
                  if (el) stepRefs.current[i] = el;
                }}
                className={`flex flex-col items-center gap-4 md:gap-12 ${
                  isEven ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                {/* Massive gradient number */}
                <div className="relative flex-shrink-0 flex items-center justify-center">
                  <span
                    ref={(el) => {
                      if (el) numberRefs.current[i] = el;
                    }}
                    className="font-black text-transparent bg-clip-text bg-gradient-to-br from-[#ff6005] to-[#feb703] select-none will-change-transform"
                    style={{
                      fontSize: "clamp(7rem, 18vw, 14rem)",
                      lineHeight: 0.85,
                    }}
                  >
                    {step.number}
                  </span>
                  {/* Warm radial glow behind number */}
                  <div
                    className="absolute inset-0 blur-[60px] opacity-20 pointer-events-none"
                    style={{
                      background:
                        "radial-gradient(circle, #ff6005 0%, transparent 70%)",
                    }}
                  />
                </div>

                {/* Content block */}
                <div className="flex-1 max-w-lg text-center md:text-left">
                  {/* Icon with double pulsing rings */}
                  <div
                    ref={(el) => {
                      if (el) iconRefs.current[i] = el;
                    }}
                    className="relative inline-flex mb-5 will-change-transform"
                  >
                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-[#ff6005] to-[#feb703] flex items-center justify-center shadow-lg shadow-[#ff6005]/20">
                      <Icon size={26} className="text-white" />
                    </div>
                    {/* Inner ring */}
                    <div className="absolute -inset-2.5 rounded-xl border-2 border-[#ff6005]/20 animate-[pulse_2s_ease-in-out_infinite]" />
                    {/* Outer ring */}
                    <div className="absolute -inset-5 rounded-2xl border border-[#ff6005]/10 animate-[pulse_2.5s_ease-in-out_infinite_0.5s]" />
                  </div>

                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Connector between steps */}
              {!isLast && (
                <div className="flex justify-center my-2 md:my-0">
                  {/* Mobile: gradient line */}
                  <div className="md:hidden w-[3px] h-16 rounded-full bg-gradient-to-b from-[#ff6005]/30 to-[#feb703]/30" />

                  {/* Desktop: curved SVG path that draws on scroll */}
                  <svg
                    className="hidden md:block w-full max-w-lg h-20"
                    viewBox="0 0 400 70"
                    preserveAspectRatio="none"
                    fill="none"
                  >
                    <defs>
                      <linearGradient
                        id={`hiw-conn-${i}`}
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="0%"
                      >
                        <stop
                          offset="0%"
                          stopColor="#ff6005"
                          stopOpacity="0.5"
                        />
                        <stop
                          offset="50%"
                          stopColor="#feb703"
                          stopOpacity="0.7"
                        />
                        <stop
                          offset="100%"
                          stopColor="#ff6005"
                          stopOpacity="0.5"
                        />
                      </linearGradient>
                    </defs>
                    <path
                      ref={(el) => {
                        if (el) connectorRefs.current[i] = el;
                      }}
                      d={
                        isEven
                          ? "M60,0 C60,35 340,35 340,70"
                          : "M340,0 C340,35 60,35 60,70"
                      }
                      stroke={`url(#hiw-conn-${i})`}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
