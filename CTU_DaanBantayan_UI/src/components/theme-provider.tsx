"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";

export function CTUThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch
  if (!mounted) {
    return <div suppressHydrationWarning>{children}</div>;
  }

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      themes={["light", "dark"]}
      enableSystem={false}
      disableTransitionOnChange={false}>
      <ThemeSync />
      {children}
    </NextThemesProvider>
  );
}

// Component to sync daisyUI themes with shadcn/ui themes
function ThemeSync() {
  const { theme } = useTheme();

  React.useEffect(() => {
    const html = document.documentElement;
    if (theme === "dark") {
      html.setAttribute("data-theme", "ctu-dark");
      html.classList.remove("light");
      html.classList.add("dark");
    } else {
      html.setAttribute("data-theme", "ctu-light");
      html.classList.remove("dark");
      html.classList.add("light");
    }
  }, [theme]);

  return null;
}

// Legacy wrapper for backward compatibility
export default function ThemeProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CTUThemeProvider>{children}</CTUThemeProvider>;
}
