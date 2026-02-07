"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";

gsap.registerPlugin(ScrollTrigger);

const navLinks = [
  { href: "/events", label: "Events" },
  { href: "/login", label: "Login" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        start: "top -80",
        onUpdate: (self) => {
          const progress = Math.min(self.scroll() / 100, 1);
          nav.style.backgroundColor = `rgba(255,255,255,${progress * 0.85})`;
          nav.style.backdropFilter = `blur(${progress * 20}px)`;
          nav.style.borderBottom = `1px solid rgba(0,0,0,${progress * 0.08})`;
        },
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <nav
      ref={navRef}
      className="fixed top-0 left-0 right-0 z-50 transition-none"
      style={{ backgroundColor: "transparent", borderBottom: "1px solid transparent" }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <Link href="/">
          <Image
            src="/logo-black.png"
            alt="Ambassadors"
            width={140}
            height={40}
            priority
          />
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="link-underline text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <Link href="/register">
            <span className="inline-flex items-center rounded-full bg-brand-gradient px-6 py-2.5 text-sm font-semibold text-white shadow-brand hover:shadow-brand-lg transition-shadow duration-300">
              Join Now
            </span>
          </Link>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button aria-label="Open menu">
                <Menu className="h-6 w-6 text-gray-800" />
              </button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="flex flex-col gap-6 mt-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="text-lg font-medium hover:text-brand-orange transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="rounded-full bg-brand-gradient px-6 py-3 text-center text-sm font-semibold text-white shadow-brand"
                >
                  Join Now
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
