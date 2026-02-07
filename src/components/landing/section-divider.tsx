"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type DividerVariant = "wave" | "wave-inverse" | "slope" | "slope-inverse";

const paths: Record<DividerVariant, { path: string; viewBox: string }> = {
  wave: {
    viewBox: "0 0 1440 100",
    path: "M0,0 L0,40 Q180,100 360,60 T720,70 T1080,50 T1440,65 L1440,0 Z",
  },
  "wave-inverse": {
    viewBox: "0 0 1440 100",
    path: "M0,60 Q180,0 360,40 T720,30 T1080,50 T1440,35 L1440,100 L0,100 Z",
  },
  slope: {
    viewBox: "0 0 1440 100",
    path: "M0,0 L0,70 C240,100 480,90 720,65 C960,40 1200,20 1440,30 L1440,0 Z",
  },
  "slope-inverse": {
    viewBox: "0 0 1440 100",
    path: "M0,30 C240,20 480,40 720,65 C960,90 1200,100 1440,70 L1440,100 L0,100 Z",
  },
};

interface SectionDividerProps {
  variant: DividerVariant;
  /** "warm-to-white" fills the shape with warm color (placed at bottom of warm section)
   *  "white-to-warm" fills the shape with warm color (placed at top of warm section) */
  direction: "warm-to-white" | "white-to-warm";
  className?: string;
}

export function SectionDivider({
  variant,
  direction,
  className = "",
}: SectionDividerProps) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;

    const path = svg.querySelector("path");
    if (!path) return;

    gsap.fromTo(
      path,
      { opacity: 0, scale: 1.05 },
      {
        opacity: 1,
        scale: 1,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: svg,
          start: "top 90%",
          toggleActions: "play none none none",
        },
      }
    );
  }, []);

  const { path, viewBox } = paths[variant];

  // Gradient IDs need to be unique per instance
  const gradId = `divider-grad-${variant}-${direction}`;

  // Warm sections are #fffdf9 / #fff8f0
  const stops =
    direction === "warm-to-white"
      ? [
          { offset: "0%", color: "#fffdf9", opacity: 1 },
          { offset: "100%", color: "#ffffff", opacity: 1 },
        ]
      : [
          { offset: "0%", color: "#ffffff", opacity: 1 },
          { offset: "100%", color: "#fffdf9", opacity: 1 },
        ];

  return (
    <div
      className={`relative w-full overflow-hidden -my-px ${className}`}
      style={{ lineHeight: 0 }}
    >
      {/* Brand gradient accent glow behind the shape */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 100% at 50% 50%, rgba(255,96,5,0.04) 0%, transparent 70%)",
        }}
      />
      <svg
        ref={ref}
        viewBox={viewBox}
        preserveAspectRatio="none"
        className="relative block w-full"
        style={{ height: "clamp(50px, 8vw, 100px)" }}
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
            {stops.map((s, i) => (
              <stop
                key={i}
                offset={s.offset}
                stopColor={s.color}
                stopOpacity={s.opacity}
              />
            ))}
          </linearGradient>
          {/* Brand gradient for accent stroke */}
          <linearGradient
            id={`${gradId}-accent`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#ff6005" stopOpacity="0" />
            <stop offset="30%" stopColor="#ff6005" stopOpacity="0.15" />
            <stop offset="50%" stopColor="#feb703" stopOpacity="0.2" />
            <stop offset="70%" stopColor="#ff6005" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#feb703" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Fill shape for background transition */}
        <path d={path} fill={`url(#${gradId})`} />
        {/* Accent stroke along the curve edge */}
        <path
          d={path}
          fill="none"
          stroke={`url(#${gradId}-accent)`}
          strokeWidth="1.5"
        />
      </svg>
    </div>
  );
}
