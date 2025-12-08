"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { IconSettings } from "@tabler/icons-react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";

export function StudentSettings() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="@container/main flex flex-1 flex-col gap-4">
      <div className="flex flex-col gap-6 py-4 md:py-6 max-w-4xl mx-auto px-4">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconSettings className="h-5 w-5" />
              Student Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Theme Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Theme</Label>
                <p className="text-sm text-muted-foreground">
                  Choose your preferred theme for the application
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                className="flex items-center gap-2"
              >
                {theme === "light" ? (
                  <>
                    <Moon className="h-4 w-4" />
                    Dark Mode
                  </>
                ) : (
                  <>
                    <Sun className="h-4 w-4" />
                    Light Mode
                  </>
                )}
              </Button>
            </div>

            <div className="border-t pt-6">
              <p className="text-muted-foreground">
                Additional student settings will be available here. This includes profile preferences, notification settings, and other personal configurations.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
