"use client";
import { useEffect, useState } from "react";
import { MotionFooter } from "../utils/motion-wrapper";

export default function Footer() {
  const [showFooter, setShowFooter] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.body.scrollHeight;

      if (scrollY + windowHeight >= documentHeight - 10) {
        setShowFooter(true);
      } else {
        setShowFooter(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return showFooter ? (
    <MotionFooter
      delay={0.2}
      className="fixed bottom-0 w-full z-50 border-t bg-muted py-4 text-center text-sm text-muted-foreground">
      <div className="mx-auto max-w-3xl px-4">
        <p>&copy; 2025 Academia de San Martin. All rights reserved.</p>
      </div>
    </MotionFooter>
  ) : null;
}
