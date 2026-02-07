"use client";

import { useEffect, useRef } from "react";
import { Users, MapPinned, Calendar, TrendingUp } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const stats = [
  {
    value: 200,
    suffix: "+",
    label: "Ambassadors",
    sublabel: "Student leaders nationwide",
    icon: Users,
    ringFill: 0.75,
  },
  {
    value: 14,
    suffix: "",
    label: "Regions",
    sublabel: "Across Uzbekistan",
    icon: MapPinned,
    ringFill: 0.88,
  },
  {
    value: 500,
    suffix: "+",
    label: "Events",
    sublabel: "Workshops & competitions",
    icon: Calendar,
    ringFill: 0.68,
  },
  {
    value: 10000,
    suffix: "+",
    label: "Participants",
    sublabel: "Youth reached",
    icon: TrendingUp,
    ringFill: 0.92,
  },
];

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function formatNumber(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(0) + "K";
  return n.toString();
}

/** Compute the (x,y) position at the end of the arc for a given fill ratio */
function getRingEndpoint(fill: number) {
  const angle = (-90 + fill * 360) * (Math.PI / 180);
  return {
    x: 60 + RADIUS * Math.cos(angle),
    y: 60 + RADIUS * Math.sin(angle),
  };
}

export function StatsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<HTMLDivElement[]>([]);
  const numberRefs = useRef<HTMLSpanElement[]>([]);
  const ringRefs = useRef<SVGCircleElement[]>([]);
  const dotRefs = useRef<SVGCircleElement[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      // Heading
      if (headingRef.current) {
        gsap.fromTo(
          headingRef.current,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section,
              start: "top 70%",
              toggleActions: "play none none none",
            },
          }
        );
      }

      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        const stat = stats[i];

        // Card spring entrance
        gsap.fromTo(
          card,
          { opacity: 0, y: 60, scale: 0.85 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.9,
            delay: i * 0.15,
            ease: "back.out(1.4)",
            scrollTrigger: {
              trigger: section,
              start: "top 65%",
              toggleActions: "play none none none",
            },
          }
        );

        // Number count-up
        const num = numberRefs.current[i];
        const counter = { val: 0 };
        gsap.to(counter, {
          val: stat.value,
          duration: 2,
          delay: i * 0.15 + 0.3,
          ease: "power2.out",
          onUpdate: () => {
            if (num) num.textContent = formatNumber(Math.round(counter.val));
          },
          scrollTrigger: {
            trigger: section,
            start: "top 65%",
            toggleActions: "play none none none",
          },
        });

        // Ring fill
        const ring = ringRefs.current[i];
        if (ring) {
          ring.style.strokeDasharray = `${CIRCUMFERENCE}`;
          ring.style.strokeDashoffset = `${CIRCUMFERENCE}`;

          gsap.to(ring, {
            strokeDashoffset: CIRCUMFERENCE * (1 - stat.ringFill),
            duration: 2,
            delay: i * 0.15 + 0.2,
            ease: "power2.out",
            scrollTrigger: {
              trigger: section,
              start: "top 65%",
              toggleActions: "play none none none",
            },
          });
        }

        // Glowing endpoint dot appears after ring fills
        const dot = dotRefs.current[i];
        if (dot) {
          gsap.fromTo(
            dot,
            { opacity: 0, attr: { r: 0 } },
            {
              opacity: 1,
              attr: { r: 5 },
              duration: 0.5,
              delay: i * 0.15 + 2,
              ease: "back.out(2)",
              scrollTrigger: {
                trigger: section,
                start: "top 65%",
                toggleActions: "play none none none",
              },
            }
          );
        }
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative py-32 px-6 overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #fffbf5 0%, #fff8f0 50%, #fffbf5 100%)",
      }}
    >
      {/* Decorative concentric background circles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-[#ff6005]/[0.06]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[750px] rounded-full border border-[#ff6005]/[0.04]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] rounded-full border border-[#ff6005]/[0.02]" />
      </div>

      {/* Heading */}
      <div ref={headingRef} className="relative text-center mb-20 opacity-0">
        <h2
          className="font-bold text-gray-900"
          style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
        >
          Our Impact
        </h2>
        <p className="mt-4 text-gray-500 text-lg max-w-xl mx-auto">
          Growing a nationwide movement, one community at a time
        </p>
      </div>

      {/* Stats grid */}
      <div className="relative mx-auto max-w-5xl grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-10">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          const endpoint = getRingEndpoint(stat.ringFill);

          return (
            <div
              key={stat.label}
              ref={(el) => {
                if (el) cardRefs.current[i] = el;
              }}
              className="flex flex-col items-center text-center group cursor-default"
            >
              {/* Ring container */}
              <div className="relative w-36 h-36 md:w-44 md:h-44 mb-5">
                <svg className="w-full h-full" viewBox="0 0 120 120">
                  <defs>
                    <linearGradient
                      id={`sr-${i}`}
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#ff6005" />
                      <stop offset="100%" stopColor="#feb703" />
                    </linearGradient>
                    <filter id={`sr-glow-${i}`}>
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Background track ring */}
                  <circle
                    cx="60"
                    cy="60"
                    r={RADIUS}
                    fill="none"
                    stroke="#efe9e2"
                    strokeWidth="5"
                  />

                  {/* Animated gradient fill ring */}
                  <circle
                    ref={(el) => {
                      if (el) ringRefs.current[i] = el;
                    }}
                    cx="60"
                    cy="60"
                    r={RADIUS}
                    fill="none"
                    stroke={`url(#sr-${i})`}
                    strokeWidth="6"
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                    className="drop-shadow-[0_0_6px_rgba(255,96,5,0.3)]"
                  />

                  {/* Glowing dot at ring endpoint */}
                  <circle
                    ref={(el) => {
                      if (el) dotRefs.current[i] = el;
                    }}
                    cx={endpoint.x}
                    cy={endpoint.y}
                    r="0"
                    fill="#ff6005"
                    filter={`url(#sr-glow-${i})`}
                    opacity="0"
                  />
                </svg>

                {/* Centered content inside ring */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Icon
                    size={18}
                    className="text-[#ff6005]/60 mb-1"
                  />
                  <div className="flex items-baseline gap-0.5">
                    <span
                      ref={(el) => {
                        if (el) numberRefs.current[i] = el;
                      }}
                      className="text-gradient font-bold"
                      style={{
                        fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                        lineHeight: 1,
                      }}
                    >
                      0
                    </span>
                    {stat.suffix && (
                      <span className="text-gradient font-bold text-lg">
                        {stat.suffix}
                      </span>
                    )}
                  </div>
                </div>

                {/* Hover glow behind ring */}
                <div
                  className="absolute inset-0 rounded-full blur-[30px] opacity-0 group-hover:opacity-15 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(circle, #ff6005, transparent 70%)",
                  }}
                />
              </div>

              <h3 className="font-bold text-gray-900 text-lg">
                {stat.label}
              </h3>
              <p className="mt-1 text-gray-500 text-sm">{stat.sublabel}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
