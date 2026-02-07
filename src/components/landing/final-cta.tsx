"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function FinalCta() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const text = textRef.current;
    const button = buttonRef.current;
    if (!section || !text || !button) return;

    const ctx = gsap.context(() => {
      // Scale up text reveal on scroll
      gsap.fromTo(
        text,
        { scale: 0.2, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top 70%",
            end: "top 20%",
            scrub: 1,
          },
        }
      );

      // Button appears after text is revealed
      gsap.fromTo(
        button,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: section,
            start: "top 25%",
            toggleActions: "play none none none",
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-40 md:py-56 px-6 flex flex-col items-center justify-center text-center"
      style={{ background: "linear-gradient(180deg, #ffffff 0%, #fffbf5 30%, #fff8f0 70%, #ffffff 100%)" }}
    >
      <h2
        ref={textRef}
        className="font-bold text-gray-900 max-w-4xl leading-tight will-change-transform"
        style={{
          fontSize: "clamp(2rem, 6vw, 5rem)",
          transform: "scale(0.2)",
          opacity: 0,
        }}
      >
        Ready to build{" "}
        <span className="text-gradient">the future</span>?
      </h2>

      <div ref={buttonRef} className="mt-10 opacity-0">
        <Link href="/register">
          <span className="inline-flex items-center rounded-full bg-brand-gradient px-10 py-4 text-lg font-bold text-white shadow-brand hover:shadow-brand-lg transition-all duration-300 hover:scale-105">
            Join Now
          </span>
        </Link>
      </div>
    </section>
  );
}
