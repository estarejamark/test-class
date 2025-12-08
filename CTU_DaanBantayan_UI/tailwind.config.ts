import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      colors: {
        // CTU Brand Colors
        ctu: {
          primary: "oklch(45% 0.15 247)", // CTU Blue
          secondary: "oklch(92% 0.01 247)", // Light Blue
          accent: "oklch(55% 0.12 145)", // Academic Green
        },
        // Shadcn/UI Color System
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          from: { transform: "translateY(10px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 5px hsl(var(--primary))" },
          "50%": { boxShadow: "0 0 20px hsl(var(--primary))" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-up": "slide-up 0.2s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("daisyui"), require("tailwindcss-animate")],
} satisfies Config;

// Define the daisyUI configuration separately to avoid TypeScript issues
const daisyuiConfig = {
  themes: [
    {
      "ctu-light": {
        primary: "#2563eb", // CTU Blue
        "primary-content": "#ffffff",
        secondary: "#64748b", // Slate
        "secondary-content": "#ffffff",
        accent: "#10b981", // Academic Green
        "accent-content": "#ffffff",
        neutral: "#374151", // Gray
        "neutral-content": "#ffffff",
        "base-100": "#ffffff", // Background
        "base-200": "#f8fafc", // Light Gray
        "base-300": "#e2e8f0", // Border
        "base-content": "#1e293b", // Text
        info: "#0ea5e9", // Sky Blue
        "info-content": "#ffffff",
        success: "#10b981", // Emerald
        "success-content": "#ffffff",
        warning: "#f59e0b", // Amber
        "warning-content": "#ffffff",
        error: "#ef4444", // Red
        "error-content": "#ffffff",
      },
      "ctu-dark": {
        primary: "#3b82f6", // Brighter CTU Blue for dark mode
        "primary-content": "#1e293b",
        secondary: "#475569", // Darker Slate
        "secondary-content": "#f1f5f9",
        accent: "#34d399", // Brighter Green
        "accent-content": "#1e293b",
        neutral: "#64748b",
        "neutral-content": "#f1f5f9",
        "base-100": "#1e293b", // Dark Background
        "base-200": "#334155", // Darker
        "base-300": "#475569", // Border
        "base-content": "#f1f5f9", // Light Text
        info: "#38bdf8",
        "info-content": "#1e293b",
        success: "#34d399",
        "success-content": "#1e293b",
        warning: "#fbbf24",
        "warning-content": "#1e293b",
        error: "#f87171",
        "error-content": "#1e293b",
      },
    },
    "light",
    "dark",
    "corporate",
    "business",
  ],
  darkTheme: "ctu-dark", // Default dark theme
  base: true,
  styled: true,
  utils: true,
  logs: false, // Reduce console noise
  rtl: false,
};
