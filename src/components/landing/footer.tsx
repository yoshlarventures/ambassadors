"use client";

import Image from "next/image";
import Link from "next/link";

const navLinks = [
  { label: "Events", href: "/events" },
  { label: "Login", href: "/login" },
  { label: "Register", href: "/register" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative bg-white py-10 px-6">
      {/* Gradient top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#ff6005] to-transparent opacity-40" />

      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex flex-col items-center gap-2 md:items-start">
            <Image
              src="/logo-black.png"
              width={120}
              height={35}
              alt="Startup Ambassadors"
            />
            <span className="text-sm text-gray-500">
              Building the startup ecosystem
            </span>
          </div>
          <nav className="flex gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="link-underline text-gray-500 transition-colors hover:text-gray-900 text-sm"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="mt-8 text-center text-sm text-gray-400">
          &copy; {year} Startup Ambassadors. All rights reserved.
        </p>
        <p className="mt-2 text-center text-xs text-gray-300">
          Developed by Abbos Mavlonov
        </p>
      </div>
    </footer>
  );
}
