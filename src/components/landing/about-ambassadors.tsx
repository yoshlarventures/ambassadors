"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const bullets = [
  "Organize workshops and startup events in your city",
  "Mentor aspiring entrepreneurs in your community",
  "Connect youth with real investors and opportunities",
];

export function AboutAmbassadors() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const bulletRefs = useRef<HTMLLIElement[]>([]);
  const checkRefs = useRef<SVGSVGElement[]>([]);

  // Logo refs
  const logoBgRef = useRef<HTMLDivElement>(null);
  const circleRef = useRef<HTMLDivElement>(null);
  const chevronWrapperRef = useRef<HTMLDivElement>(null);
  const chevronStrokeRef = useRef<SVGPathElement>(null);
  const chevronFillRef = useRef<SVGPathElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const particleRefs = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      // === LEFT COLUMN ===
      if (leftRef.current) {
        gsap.fromTo(
          leftRef.current,
          { opacity: 0, x: -60 },
          {
            opacity: 1,
            x: 0,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section,
              start: "top 70%",
              toggleActions: "play none none none",
            },
          }
        );
        gsap.to(leftRef.current, {
          y: -40,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
          },
        });
      }

      // Bullets stagger in
      bulletRefs.current.forEach((li, i) => {
        if (!li) return;
        gsap.fromTo(
          li,
          { opacity: 0, x: -30 },
          {
            opacity: 1,
            x: 0,
            duration: 0.7,
            delay: 0.3 + i * 0.12,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section,
              start: "top 65%",
              toggleActions: "play none none none",
            },
          }
        );
      });

      // Checkmark SVG draw
      checkRefs.current.forEach((svg, i) => {
        if (!svg) return;
        const paths = svg.querySelectorAll("circle, path");
        paths.forEach((p) => {
          const el = p as SVGGeometryElement;
          const len = el.getTotalLength();
          gsap.set(el, { strokeDasharray: len, strokeDashoffset: len });
          gsap.to(el, {
            strokeDashoffset: 0,
            duration: 0.6,
            ease: "power2.out",
            delay: i * 0.15,
            scrollTrigger: {
              trigger: svg,
              start: "top 80%",
              toggleActions: "play none none none",
            },
          });
        });
      });

      // === RIGHT COLUMN ===
      if (rightRef.current) {
        gsap.fromTo(
          rightRef.current,
          { opacity: 0, x: 60 },
          {
            opacity: 1,
            x: 0,
            duration: 1,
            delay: 0.15,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section,
              start: "top 70%",
              toggleActions: "play none none none",
            },
          }
        );
        gsap.to(rightRef.current, {
          y: 30,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
          },
        });
      }

      // === LOGO ANIMATION SEQUENCE ===
      const logoTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top 65%",
          toggleActions: "play none none none",
        },
      });

      // 1. Background reveal
      if (logoBgRef.current) {
        gsap.set(logoBgRef.current, { scale: 0.85, opacity: 0 });
        logoTl.to(logoBgRef.current, {
          scale: 1,
          opacity: 1,
          duration: 0.8,
          ease: "cubic-bezier(0.22, 1, 0.36, 1)",
        });
      }

      // 2. Circle drops in with bounce
      if (circleRef.current) {
        gsap.set(circleRef.current, { scale: 0, opacity: 0, y: -50 });
        logoTl.to(
          circleRef.current,
          {
            scale: 1,
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: "elastic.out(1, 0.5)",
          },
          "-=0.3"
        );
      }

      // 3. Chevron shoots up from below with rotation
      if (chevronWrapperRef.current) {
        gsap.set(chevronWrapperRef.current, { opacity: 0, y: 50, scale: 0.6, rotation: 8 });
        logoTl.to(
          chevronWrapperRef.current,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            rotation: 0,
            duration: 0.8,
            ease: "back.out(1.7)",
          },
          "-=0.4"
        );
      }

      // 4. Chevron stroke draws
      if (chevronStrokeRef.current) {
        const len = chevronStrokeRef.current.getTotalLength();
        gsap.set(chevronStrokeRef.current, {
          strokeDasharray: len,
          strokeDashoffset: len,
        });
        logoTl.to(
          chevronStrokeRef.current,
          {
            strokeDashoffset: 0,
            duration: 0.8,
            ease: "cubic-bezier(0.22, 1, 0.36, 1)",
          },
          "-=0.6"
        );
      }

      // 5. Chevron fill fades in
      if (chevronFillRef.current) {
        gsap.set(chevronFillRef.current, { opacity: 0 });
        logoTl.to(chevronFillRef.current, {
          opacity: 1,
          duration: 0.5,
          ease: "power2.out",
        }, "-=0.3");
      }

      // — Continuous idle animations after reveal —

      // Circle: gentle pulse / breathe
      if (circleRef.current) {
        logoTl.add(() => {
          gsap.to(circleRef.current, {
            scale: 1.06,
            duration: 2,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
          });
        });
      }

      // Chevron: gentle bob up/down (opposite rhythm to circle)
      if (chevronWrapperRef.current) {
        logoTl.add(() => {
          gsap.to(chevronWrapperRef.current, {
            y: 5,
            duration: 2.2,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
          });
        }, "<");
      }

      // 6. Shimmer overlay fades in (on the bg's ::after pseudo - use a real element)
      const shimmer = logoBgRef.current?.querySelector(".shimmer");
      if (shimmer) {
        gsap.set(shimmer, { opacity: 0 });
        logoTl.to(shimmer, { opacity: 1, duration: 0.6, ease: "power2.out" }, "-=0.3");
      }

      // 7. Glow pulse starts
      if (glowRef.current) {
        gsap.set(glowRef.current, { opacity: 0, scale: 0.9 });
        logoTl.add(() => {
          gsap.to(glowRef.current, {
            opacity: 1,
            scale: 1.15,
            duration: 1.5,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
          });
        });
      }

      // 8. Particles float
      particleRefs.current.forEach((p, i) => {
        if (!p) return;
        const dirs = [
          { y: -20, x: 5 },
          { y: -15, x: -8 },
          { y: -25, x: 3 },
          { y: -18, x: -5 },
        ];
        const d = dirs[i % dirs.length];
        gsap.set(p, { opacity: 0 });
        gsap.to(p, {
          opacity: 0.5,
          y: d.y,
          x: d.x,
          duration: 4 + i,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          delay: 2 + i * 0.5,
        });
      });

      // 9. Hover-like idle float on whole logo
      const logoContainer = rightRef.current?.querySelector(".logo-wrapper");
      if (logoContainer) {
        logoTl.to(logoContainer, {
          y: -6,
          duration: 2.5,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-32 px-6 overflow-hidden">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-16 lg:gap-20 md:flex-row">
        {/* Left column */}
        <div ref={leftRef} className="flex-1 opacity-0">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-[2px] w-8 bg-gradient-to-r from-[#ff6005] to-[#feb703] rounded-full" />
            <span className="text-sm font-semibold tracking-wider uppercase text-[#ff6005]">
              Our Ambassadors
            </span>
          </div>

          <h2
            className="font-bold text-gray-900 leading-tight"
            style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)" }}
          >
            The Leaders Behind{" "}
            <span className="text-gradient">the Clubs</span>
          </h2>

          <p className="mt-6 text-gray-600 text-lg leading-relaxed">
            Our ambassadors are student leaders passionate about
            entrepreneurship. They bring{" "}
            <span className="text-gradient font-semibold">
              startup culture
            </span>{" "}
            to their communities by organizing events, mentoring peers, and
            creating opportunities for youth across Uzbekistan.
          </p>

          <ul className="mt-10 space-y-5">
            {bullets.map((text, i) => (
              <li
                key={i}
                ref={(el) => {
                  if (el) bulletRefs.current[i] = el;
                }}
                className="flex items-start gap-4 opacity-0"
              >
                <svg
                  ref={(el) => {
                    if (el) checkRefs.current[i] = el;
                  }}
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="shrink-0 mt-0.5"
                >
                  <defs>
                    <linearGradient
                      id={`chk-g-${i}`}
                      x1="0"
                      y1="0"
                      x2="24"
                      y2="24"
                    >
                      <stop stopColor="#ff6005" />
                      <stop offset="1" stopColor="#feb703" />
                    </linearGradient>
                  </defs>
                  <circle
                    cx="12"
                    cy="12"
                    r="10.5"
                    stroke={`url(#chk-g-${i})`}
                    strokeWidth="1.5"
                    fill="none"
                  />
                  <path
                    d="M8 12l3 3 5-6"
                    stroke={`url(#chk-g-${i})`}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
                <span className="text-gray-700 text-[1.05rem] leading-relaxed">
                  {text}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right column — Animated logo */}
        <div
          ref={rightRef}
          className="hidden flex-1 items-center justify-center md:flex opacity-0"
        >
          <div className="logo-wrapper relative w-56 h-56 md:w-64 md:h-64">
            {/* Background — gradient with selective rounded corners */}
            <div
              ref={logoBgRef}
              className="absolute inset-0 will-change-transform"
              style={{
                background:
                  "linear-gradient(to bottom left, #feb703, #ff6005)",
                borderRadius: "60px 0 60px 0",
                boxShadow:
                  "0 30px 80px rgba(255, 100, 0, 0.3), 0 0 0 1px rgba(255,255,255,0.05) inset",
              }}
            >
              {/* Shimmer highlight overlay */}
              <div
                className="shimmer absolute inset-0 pointer-events-none"
                style={{
                  borderRadius: "60px 0 60px 0",
                  background:
                    "radial-gradient(ellipse at 30% 25%, rgba(255,255,255,0.18) 0%, transparent 60%)",
                }}
              />
            </div>

            {/* Ambient glow pulse */}
            <div
              ref={glowRef}
              className="absolute pointer-events-none z-0"
              style={{
                width: "65%",
                height: "65%",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(255,150,50,0.25) 0%, transparent 70%)",
              }}
            />

            {/* Floating particles */}
            {[
              { top: "20%", left: "15%", size: 4 },
              { top: "70%", left: "80%", size: 3 },
              { top: "30%", left: "78%", size: 2 },
              { top: "75%", left: "22%", size: 3 },
            ].map((p, i) => (
              <div
                key={i}
                ref={(el) => {
                  if (el) particleRefs.current[i] = el;
                }}
                className="absolute rounded-full bg-white/40 pointer-events-none z-[4]"
                style={{
                  top: p.top,
                  left: p.left,
                  width: p.size,
                  height: p.size,
                }}
              />
            ))}

            {/* Circle (head) */}
            <div
              ref={circleRef}
              className="absolute rounded-full z-[1] will-change-transform"
              style={{
                width: "38%",
                height: "38%",
                background: "#f5d4be",
                top: "16%",
                left: "50%",
                transform: "translateX(-50%)",
              }}
            />

            {/* Chevron */}
            <div
              ref={chevronWrapperRef}
              className="absolute z-[3]"
              style={{
                top: "45%",
                left: "50%",
                transform: "translateX(-50%)",
                width: "44%",
              }}
            >
              <svg
                viewBox="0 0 200 140"
                fill="none"
                className="w-full"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Fill shape (fades in after stroke draws) */}
                <path
                  ref={chevronFillRef}
                  d="M100,0 L200,100 L170,130 L100,60 L30,130 L0,100 Z"
                  fill="white"
                />
                {/* Stroke outline (draws on scroll) */}
                <path
                  ref={chevronStrokeRef}
                  d="M100,0 L200,100 L170,130 L100,60 L30,130 L0,100 Z"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinejoin="miter"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
