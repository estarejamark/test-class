import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ThemeProviderWrapper from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/auth.context";
import { SettingsProvider } from "@/contexts/settings.context";
import ProfileGuard from "@/components/profile/profile-guard";
import { Toaster } from "@/components/ui/sonner";
import "@/intercept-console-error"; // Import to activate console error interception

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Multifunctional Classroom Management Tool",
  description:
    "Academia de San Martin - Multifunctional Classroom Management Tool",
  icons: {
    icon: "/logoadsm.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProviderWrapper>
          <AuthProvider>
            <SettingsProvider>
              <ProfileGuard>
                {children}
              </ProfileGuard>
              <Toaster />
            </SettingsProvider>
          </AuthProvider>
        </ThemeProviderWrapper>
      </body>
    </html>
  );
}
