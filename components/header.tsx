"use client";

import Link from "next/link";
import { AudioWaveform, X, Menu } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { SignInButton } from "./auth/sign-in-button";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function Header() {
  const navItems = [
    { href: "/features", label: "Features" },
    { href: "/about", label: "About Aura" },
  ];

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="fixed top-0 z-50 w-full bg-white/95 dark:bg-black/95 backdrop-blur">
      <div className="absolute inset-0 border-b border-black/10 dark:border-white/10">
        <header className="relative mx-auto max-w-6xl px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 transition-opacity hover:opacity-80"
            >
              <AudioWaveform className="h-7 w-7 text-[#7fbfb0] animate-pulse-gentle" />

              <span className="inline-block text-lg font-semibold bg-gradient-to-r from-[#7fbfb0] to-[#7fbfb0]/80 bg-clip-text text-transparent">
                Aura3.0
              </span>
            </Link>

            {/* Desktop nav */}
            <div className="flex items-center gap-4">
              <nav className="hidden md:flex items-center space-x-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group relative px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors"
                  >
                    {item.label}
                    <span className="absolute bottom-0 left-0 h-0.5 w-full scale-x-0 bg-[#7fbfb0] transition-transform duration-200 origin-left group-hover:scale-x-100" />
                  </Link>
                ))}
              </nav>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <SignInButton />

                {/* Mobile menu toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                  {isMenuOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile menu */}
          {isMenuOpen && (
            <div className="md:hidden border-t border-black/10 dark:border-white/10">
              <nav className="flex flex-col space-y-1 py-4">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-md px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 hover:text-black dark:hover:text-white transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          )}
        </header>
      </div>
    </div>
  );
}
