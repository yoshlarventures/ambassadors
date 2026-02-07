"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AuroraGrid } from "./aurora-grid";

gsap.registerPlugin(ScrollTrigger);

const line1 = "Learn Startups.";

export function HeroSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animate characters staggered on load
      const chars = headlineRef.current?.querySelectorAll(".char");
      if (chars) {
        gsap.fromTo(
          chars,
          { opacity: 0, y: 60, rotateX: -40 },
          {
            opacity: 1,
            y: 0,
            rotateX: 0,
            duration: 0.8,
            stagger: 0.03,
            ease: "back.out(1.7)",
            delay: 0.2,
          }
        );
      }

      // Fade in subtext and CTAs
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 1, ease: "power3.out", delay: 1.2 }
      );

      // Scroll-driven: headline scales down and moves up
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      });

      tl.to(headlineRef.current, {
        scale: 0.7,
        y: -80,
        opacity: 0.3,
        ease: "none",
      });

      // Fade scroll indicator on scroll
      tl.to(scrollIndicatorRef.current, { opacity: 0, y: -20 }, 0);
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const renderChars = (text: string, isGradient = false) =>
    text.split("").map((char, i) => (
      <span
        key={`${text}-${i}`}
        className={`char inline-block ${char === " " ? "w-[0.3em]" : ""} ${
          isGradient ? "text-gradient" : ""
        }`}
        style={{ willChange: "transform, opacity" }}
      >
        {char === " " ? "\u00A0" : char}
      </span>
    ));

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #fffcf7 0%, #fff9f2 30%, #fff8f0 60%, #ffffff 100%)",
      }}
    >
      {/* Aurora Grid Background */}
      <AuroraGrid />

      {/* Headline */}
      <div
        ref={headlineRef}
        className="relative z-10 text-center will-change-transform"
        style={{ perspective: "1000px" }}
      >
        <h1
          className="font-bold tracking-tight text-gray-900 leading-[1.05]"
          style={{ fontSize: "clamp(2.5rem, 9vw, 9rem)" }}
        >
          <span className="block">{renderChars(line1)}</span>
          <span className="block">
            {renderChars("Build the ")}
            {renderChars("Future.", true)}
          </span>
        </h1>
      </div>

      {/* Subtext + CTAs */}
      <div ref={contentRef} className="relative z-10 mt-8 text-center opacity-0">
        <p className="max-w-2xl mx-auto text-lg text-gray-600 md:text-xl px-4">
          Join 200,000 youth across Uzbekistan learning startup fundamentals,
          building MVPs, and turning ideas into funded companies.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center px-4">
          <Link href="/register">
            <span className="inline-flex items-center rounded-full bg-brand-gradient px-8 py-3.5 text-lg font-semibold text-white shadow-brand hover:shadow-brand-lg transition-all duration-300 hover:scale-105">
              Join a Club
            </span>
          </Link>
          <Link href="/events">
            <span className="inline-flex items-center rounded-full border border-gray-200 bg-white/80 backdrop-blur-sm px-8 py-3.5 text-lg font-semibold text-gray-800 hover:bg-white transition-all duration-300 hover:scale-105">
              Browse Events
            </span>
          </Link>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        ref={scrollIndicatorRef}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10"
      >
        <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">
          Scroll
        </span>
        <div className="w-5 h-8 rounded-full border-2 border-gray-300 flex items-start justify-center p-1">
          <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" />
        </div>
      </div>
    </section>
  );
}
