"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const paragraph =
  "We are building the largest startup ecosystem in Uzbekistan. Every ambassador brings startup culture to their community — organizing events, mentoring peers, and connecting youth with real investors. Our mission: turn 200,000 young people into founders of funded companies.";

const gradientPhrases = ["startup culture", "funded companies", "200,000 young people"];

export function TextReveal() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const wordsRef = useRef<HTMLSpanElement[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      const words = wordsRef.current;

      ScrollTrigger.create({
        trigger: section,
        start: "top 60%",
        end: "bottom 40%",
        scrub: 1,
        onUpdate: (self) => {
          const progress = self.progress;
          const totalWords = words.length;
          const activeIndex = Math.floor(progress * totalWords);

          words.forEach((word, i) => {
            if (!word) return;
            if (i <= activeIndex) {
              word.style.opacity = "1";
            } else {
              word.style.opacity = "0.15";
            }
          });
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Build words with gradient phrases detected
  const words = paragraph.split(" ");
  const wordElements: { text: string; isGradient: boolean }[] = [];

  let i = 0;
  while (i < words.length) {
    let matched = false;
    for (const phrase of gradientPhrases) {
      const phraseWords = phrase.split(" ");
      const slice = words.slice(i, i + phraseWords.length).join(" ").toLowerCase();
      // Remove trailing punctuation for matching
      const cleanSlice = slice.replace(/[.,;!?]/g, "");
      const cleanPhrase = phrase.toLowerCase().replace(/[.,;!?]/g, "");
      if (cleanSlice === cleanPhrase) {
        phraseWords.forEach((_, j) => {
          wordElements.push({ text: words[i + j], isGradient: true });
        });
        i += phraseWords.length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      wordElements.push({ text: words[i], isGradient: false });
      i++;
    }
  }

  return (
    <section
      ref={sectionRef}
      className="py-32 md:py-48 px-6 bg-[#fffdf9]"
    >
      <div className="mx-auto max-w-4xl">
        <p
          className="font-semibold leading-relaxed md:leading-relaxed"
          style={{ fontSize: "clamp(1.25rem, 3vw, 2rem)" }}
        >
          {wordElements.map((word, idx) => (
            <span
              key={idx}
              ref={(el) => {
                if (el) wordsRef.current[idx] = el;
              }}
              className={`inline-block mr-[0.3em] transition-opacity duration-200 ${
                word.isGradient ? "text-gradient font-bold" : "text-gray-900"
              }`}
              style={{ opacity: 0.15 }}
            >
              {word.text}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
