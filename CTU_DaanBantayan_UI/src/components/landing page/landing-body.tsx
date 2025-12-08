"use client";
import React, { JSX, useEffect, useState } from "react";
import Image from "next/image";
import {
  MotionCTA,
  MotionForText,
  MotionHoverText,
  TypewriterText,
} from "../utils/motion-wrapper";
import LandingCards from "./landing-cards";
import Link from "next/link";
import { settingsService } from "@/services/settings.service";
import { SchoolProfile } from "@/types/settings";

export default function LandingPage(): JSX.Element {
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Defer school profile fetch to prevent blocking initial render
    const timer = setTimeout(async () => {
      try {
        const profile = await settingsService.getSchoolProfile();
        setSchoolProfile(profile);
      } catch (error) {
        console.error('Failed to fetch school profile:', error);
        // Fallback to default values if API fails
      } finally {
        setLoading(false);
      }
    }, 500); // Increased delay to 500ms to allow page to render first

    return () => clearTimeout(timer);
  }, []);

  const schoolName = schoolProfile?.name || "Academia de San Martin";
  const logoUrl = schoolProfile?.logoUrl || "/logoadsm-removebg-preview.png";

  return (
    <main
      style={{
        fontFamily:
          "var(--font-geist-sans, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial)",
      }}>
      {/* HERO */}
      <section
        className="relative min-h-screen flex items-center justify-center bg-cover bg-center"
        style={{ backgroundImage: "url('/hero.jpg')" }}
        aria-label="Hero">
        {/* overlay */}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-0 bg-gradient-to-r from-blue-900/80 via-blue-800/50 to-transparent backdrop-blur-xs"
        />
        <MotionForText className="relative z-10 px-6 py-24 max-w-6xl text-white text-center flex flex-col items-center gap-3 sm:gap-3 md:gap-4 lg:gap-5 xl:gap-6">
          <Image
            src={logoUrl}
            alt={`${schoolName} logo`}
            width={176}
            height={176}
            className="h-28 sm:h-35 md:h-36 lg:h-40 xl:h-44 w-auto max-w-[95%]"
          />
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-snug drop-shadow-sm">
            {schoolName}
          </h1>

          <p className="max-w-3xl mx-auto text-base sm:text-lg md:text-xl text-blue-50/90 leading-relaxed">
            <TypewriterText
              text="Empowering students, teachers, and administrators with digital tools to manage academic performance, attendance, and progress."
              className="whitespace-pre-line"
              delay={1.2}
            />
          </p>
          <MotionCTA
            delay={2.2}
            className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <MotionHoverText>
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-6 py-4 rounded-lg bg-primary text-primary-foreground text-base font-semibold shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/40 transition"
                aria-label="Get started — login">
                Get started
              </Link>
            </MotionHoverText>

            <a
              href="#cards"
              className="inline-flex items-center justify-center px-6 py-4 rounded-lg bg-white/10 text-white border border-white/10 hover:bg-white/20 transition text-base"
              aria-label="Learn more — scroll to cards">
              Learn more
            </a>
          </MotionCTA>
        </MotionForText>
      </section>

      {/* CARDS */}
      <div
        id="cards"
        className="bg-background/70 relative min-h-[50vh] sm:min-h-[60vh] lg:min-h-[70vh]">
        <LandingCards />
      </div>
    </main>
  );
}
