"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

// MotionCard: Hover animation for cards
export const MotionCard = ({ children }: { children?: ReactNode }) => (
  <motion.div
    whileHover={{ scale: 1.03, y: -4 }}
    transition={{ type: "spring", stiffness: 300, damping: 20 }}
    className="card bg-white border border-gray-200 shadow-sm">
    {children}
  </motion.div>
);

export const MotionCardDash = ({
  children,
  className,
  ...props
}: {
  children?: ReactNode;
  className?: string;
} & Record<string, unknown>) => (
  <motion.div
    whileHover={{ scale: 1.03, y: -4 }}
    whileFocus={{ scale: 1.02, y: -2 }}
    transition={{ type: "spring", stiffness: 300, damping: 20 }}
    {...props}>
    {children}
  </motion.div>
);

export const MotionHoverText = ({ children }: { children?: ReactNode }) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    transition={{ type: "spring", stiffness: 300, damping: 10 }}
    className="inline-block">
    {children}
  </motion.div>
);

// MotionForText: Entrance animation for text blocks
export const MotionForText = ({
  children,
  delay = 0.3,
  className = "",
}: {
  children?: ReactNode;
  delay?: number;
  className?: string;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay }}
      className={className}>
      {children}
    </motion.div>
  );
};

type Props = {
  text: string;
  className?: string;
  delay?: number;
};

export const TypewriterText = ({ text, className = "", delay = 0 }: Props) => {
  const words = text.split(" ");

  return (
    <motion.span
      className={`block leading-relaxed ${className}`}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.06,
            delayChildren: delay,
          },
        },
      }}>
      {words.map((word, wordIndex) => (
        <motion.span
          key={wordIndex}
          className="inline-block mr-1 whitespace-nowrap"
          variants={{
            hidden: { opacity: 0, y: 6 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ type: "tween", duration: 0.3 }}>
          {word.split("").map((char, charIndex) => (
            <span key={charIndex} className="inline-block">
              {char}
            </span>
          ))}
        </motion.span>
      ))}
    </motion.span>
  );
};

export const MotionCTA = ({
  children,
  delay = 2,
  className = "",
}: {
  children?: ReactNode;
  delay?: number;
  className?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay, ease: "easeOut" }}
    className={className}>
    {children}
  </motion.div>
);

export const MotionFooter = ({
  children,
  delay = 0,
  className = "",
}: {
  children?: ReactNode;
  delay?: number;
  className?: string;
}) => (
  <motion.footer
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay, ease: "easeOut" }}
    className={className}>
    {children}
  </motion.footer>
);
