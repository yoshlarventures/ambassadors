"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const partners = [
  { src: "/partner-yoshlar-ventures.png", alt: "Yoshlar Ventures", width: 1674, height: 477 },
  { src: "/partner-fund.png", alt: "Yoshlar Fund", width: 2632, height: 464 },
  { src: "/partner-youth-agency.png", alt: "Youth Agency", width: 1280, height: 306 },
];

export function PartnersSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const cardRefs = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      if (labelRef.current) {
        gsap.fromTo(
          labelRef.current,
          { opacity: 0, y: 15 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section,
              start: "top 75%",
              toggleActions: "play none none none",
            },
          }
        );
      }

      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        gsap.fromTo(
          card,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            delay: i * 0.15,
            ease: "back.out(1.4)",
            scrollTrigger: {
              trigger: section,
              start: "top 70%",
              toggleActions: "play none none none",
            },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-32 md:py-40 px-6">
      <div className="text-center mb-16">
        <span
          ref={labelRef}
          className="text-sm font-semibold tracking-[0.25em] uppercase text-[#ff6005]/60 opacity-0"
        >
          Partners
        </span>
      </div>

      <div className="mx-auto max-w-5xl flex flex-col md:flex-row items-center justify-center gap-12 md:gap-20">
        {partners.map((partner, i) => (
          <div
            key={partner.alt}
            ref={(el) => {
              if (el) cardRefs.current[i] = el;
            }}
            className="flex items-center justify-center opacity-0"
          >
            <Image
              src={partner.src}
              width={partner.width}
              height={partner.height}
              alt={partner.alt}
              className="h-12 md:h-14 w-auto object-contain"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
