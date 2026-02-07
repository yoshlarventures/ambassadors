"use client";

import { useEffect, useRef, useCallback } from "react";
import gsap from "gsap";

const COLS = 14;
const ROWS = 9;
const TOTAL = COLS * ROWS;
const MOUSE_RADIUS = 3; // how many cells the mouse glow reaches

const orbs = [
  { size: 400, x: "15%", y: "20%", color: "rgba(255,96,5,0.09)" },
  { size: 320, x: "75%", y: "15%", color: "rgba(254,183,3,0.08)" },
  { size: 360, x: "60%", y: "70%", color: "rgba(255,128,64,0.07)" },
  { size: 280, x: "25%", y: "75%", color: "rgba(254,183,3,0.08)" },
  { size: 300, x: "85%", y: "50%", color: "rgba(255,96,5,0.06)" },
  { size: 340, x: "45%", y: "35%", color: "rgba(255,128,64,0.07)" },
];

export function AuroraGrid() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef<(HTMLDivElement | null)[]>(new Array(TOTAL).fill(null));
  const orbRefs = useRef<(HTMLDivElement | null)[]>([]);
  const intervalsRef = useRef<ReturnType<typeof setInterval>[]>([]);
  // Track which cells are "mouse-lit" so we can fade them when mouse moves away
  const mouseLitRef = useRef<Set<number>>(new Set());
  const rafRef = useRef<number>(0);
  const mousePos = useRef<{ x: number; y: number } | null>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const grid = gridRef.current;
    if (!grid) return;
    const rect = grid.getBoundingClientRect();
    // Compute which grid column/row the mouse is over
    const relX = (e.clientX - rect.left) / rect.width;
    const relY = (e.clientY - rect.top) / rect.height;
    mousePos.current = { x: relX * COLS, y: relY * ROWS };

    // Throttle updates with rAF
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      updateMouseGlow();
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    mousePos.current = null;
    // Fade out all mouse-lit cells
    mouseLitRef.current.forEach((idx) => {
      const cell = cellRefs.current[idx];
      if (cell) {
        gsap.to(cell, {
          opacity: 0,
          duration: 0.6,
          ease: "power2.out",
          overwrite: "auto",
        });
      }
    });
    mouseLitRef.current.clear();
  }, []);

  const updateMouseGlow = useCallback(() => {
    const pos = mousePos.current;
    if (!pos) return;

    const cells = cellRefs.current;
    const newLit = new Set<number>();

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const dist = Math.sqrt((c + 0.5 - pos.x) ** 2 + (r + 0.5 - pos.y) ** 2);
        if (dist > MOUSE_RADIUS) continue;

        const idx = r * COLS + c;
        const cell = cells[idx];
        if (!cell) continue;

        const intensity = 1 - dist / (MOUSE_RADIUS + 0.3);
        const targetOpacity = 0.15 + intensity * 0.6;
        newLit.add(idx);

        gsap.to(cell, {
          opacity: targetOpacity,
          duration: 0.15,
          ease: "power2.out",
          overwrite: "auto",
        });
      }
    }

    // Fade out cells that were lit but no longer in range
    mouseLitRef.current.forEach((idx) => {
      if (!newLit.has(idx)) {
        const cell = cells[idx];
        if (cell) {
          gsap.to(cell, {
            opacity: 0,
            duration: 0.5,
            ease: "power2.out",
            overwrite: "auto",
          });
        }
      }
    });

    mouseLitRef.current = newLit;
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const cells = cellRefs.current;
    const orbEls = orbRefs.current;

    // Mouse tracking — listen on the parent hero section
    const heroSection = container?.parentElement;
    if (heroSection) {
      heroSection.addEventListener("mousemove", handleMouseMove);
      heroSection.addEventListener("mouseleave", handleMouseLeave);
    }

    // Drift aurora orbs
    orbEls.forEach((orb) => {
      if (!orb) return;
      const drift = () => {
        gsap.to(orb, {
          x: gsap.utils.random(-50, 50),
          y: gsap.utils.random(-30, 30),
          duration: gsap.utils.random(8, 14),
          ease: "sine.inOut",
          onComplete: drift,
        });
      };
      drift();
    });

    // Wave function: radiate glow from a random origin
    const runWave = () => {
      const originCol = Math.floor(Math.random() * COLS);
      const originRow = Math.floor(Math.random() * ROWS);
      const radius = 2.5 + Math.random() * 2;

      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const dist = Math.sqrt((c - originCol) ** 2 + (r - originRow) ** 2);
          if (dist > radius) continue;

          const idx = r * COLS + c;
          const cell = cells[idx];
          if (!cell) continue;

          // Skip cells currently lit by mouse to avoid conflict
          if (mouseLitRef.current.has(idx)) continue;

          const delay = dist * 0.09;
          const intensity = 1 - dist / (radius + 0.5);

          gsap.killTweensOf(cell);
          gsap.fromTo(
            cell,
            { opacity: 0 },
            {
              opacity: 0.15 + intensity * 0.55,
              duration: 0.5,
              delay,
              ease: "power2.out",
              onComplete: () => {
                // Only fade out if mouse isn't on this cell
                if (!mouseLitRef.current.has(idx)) {
                  gsap.to(cell, {
                    opacity: 0,
                    duration: 1 + dist * 0.12,
                    delay: 0.1,
                    ease: "power2.inOut",
                  });
                }
              },
            }
          );
        }
      }
    };

    // Start wave cycles
    const t1 = setTimeout(() => runWave(), 300);
    const i1 = setInterval(runWave, 2000);
    const i2 = setInterval(runWave, 3200);
    intervalsRef.current = [i1, i2];

    return () => {
      clearTimeout(t1);
      intervalsRef.current.forEach(clearInterval);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (heroSection) {
        heroSection.removeEventListener("mousemove", handleMouseMove);
        heroSection.removeEventListener("mouseleave", handleMouseLeave);
      }
      cells.forEach((cell) => {
        if (cell) gsap.killTweensOf(cell);
      });
      orbEls.forEach((orb) => {
        if (orb) gsap.killTweensOf(orb);
      });
    };
  }, [handleMouseMove, handleMouseLeave]);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
      {/* Aurora orbs */}
      {orbs.map((orb, i) => (
        <div
          key={`orb-${i}`}
          ref={(el) => { orbRefs.current[i] = el; }}
          className="absolute rounded-full will-change-transform pointer-events-none"
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.x,
            top: orb.y,
            background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
            filter: "blur(60px)",
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}

      {/* Animated glow cells */}
      <div
        ref={gridRef}
        className="absolute inset-0 pointer-events-none"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gridTemplateRows: `repeat(${ROWS}, 1fr)`,
          gap: "1px",
          maskImage:
            "radial-gradient(ellipse 80% 70% at 50% 50%, black 30%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 70% at 50% 50%, black 30%, transparent 100%)",
        }}
      >
        {Array.from({ length: TOTAL }).map((_, i) => (
          <div
            key={i}
            ref={(el) => { cellRefs.current[i] = el; }}
            className="rounded-[3px]"
            style={{
              opacity: 0,
              background:
                "linear-gradient(135deg, rgba(255,96,5,0.5) 0%, rgba(254,183,3,0.35) 100%)",
              boxShadow: "0 0 12px rgba(255,96,5,0.15)",
            }}
          />
        ))}
      </div>

      {/* Static grid lines (always visible, very subtle) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0,0,0,0.035) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,0,0,0.035) 1px, transparent 1px)
          `,
          backgroundSize: `${100 / COLS}% ${100 / ROWS}%`,
          maskImage:
            "radial-gradient(ellipse 85% 75% at 50% 50%, black 20%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 85% 75% at 50% 50%, black 20%, transparent 100%)",
        }}
      />
    </div>
  );
}
