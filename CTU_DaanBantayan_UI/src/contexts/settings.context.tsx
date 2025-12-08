"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { settingsService } from '@/services/settings.service';
import {
  SchoolYear,
  SchoolProfile,
  SecuritySettings,
  NotificationTemplate,
  BackupPoint
} from '@/types/settings';
import { useQuarterUpdates } from '@/hooks/useQuarterUpdates';
import { ActiveQuarterResponse } from '@/types/settings';
import { useAuth } from '@/contexts/auth.context';

interface SettingsContextType {
  schoolYear: SchoolYear | null;
  schoolYears: SchoolYear[];
  schoolProfile: SchoolProfile | null;
  securitySettings: SecuritySettings | null;
  notificationTemplates: NotificationTemplate[];
  backups: BackupPoint[];
  loading: boolean;
  error: string | null;
  refreshSettings: () => Promise<void>;
  activeQuarter: ActiveQuarterResponse | undefined;
  quarterUpdateMessage: string | null;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { authState } = useAuth();

  const [schoolYear, setSchoolYear] = useState<SchoolYear | null>(null);
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile | null>(null);

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings | null>(null);
  const [notificationTemplates, setNotificationTemplates] = useState<NotificationTemplate[]>([]);
  const [backups, setBackups] = useState<BackupPoint[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quarterUpdateMessage, setQuarterUpdateMessage] = useState<string | null>(null);
  const [activeQuarter, setActiveQuarter] = useState<ActiveQuarterResponse | undefined>(undefined);

  const { quarters, lastUpdate } = useQuarterUpdates();

  const refreshSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      // ============================================================
      // BEFORE AUTHENTICATION IS KNOWN → DO NOT FETCH ANYTHING YET
      // ============================================================
      if (authState.isLoading) {
        return;
      }

      // ============================================================
      // UNAUTHENTICATED USER → FETCH ONLY PUBLIC DATA
      // ============================================================
      if (!authState.isAuthenticated) {
        const [activeYear, allYears, profile, activeQuarterApi] = await Promise.all([
          settingsService.getActiveSchoolYear(),
          settingsService.getSchoolYears(),
          settingsService.getSchoolProfile(),
          settingsService.getActiveQuarter(),
        ]);

        setSchoolYear(activeYear);
        setSchoolYears(allYears);
        setSchoolProfile(profile);
        setActiveQuarter(activeQuarterApi || undefined);

        setSecuritySettings(null);
        setNotificationTemplates([]);
        setBackups([]);

        return;
      }

      // ============================================================
      // AUTHENTICATED USER → FETCH NORMAL USER DATA
      // ============================================================
      const [activeYear, allYears, profile, activeQuarterApi] = await Promise.all([
        settingsService.getActiveSchoolYear(),
        settingsService.getSchoolYears(),
        settingsService.getSchoolProfile(),
        settingsService.getActiveQuarter(),
      ]);

      setSchoolYear(activeYear);
      setSchoolYears(allYears);
      setSchoolProfile(profile);
      setActiveQuarter(activeQuarterApi || undefined);

      // ============================================================
      // ADMIN USER → FETCH ADMIN-ONLY SETTINGS
      // ============================================================

      // Only fetch admin APIs if user is fully loaded AND is ADMIN
      if (authState.user && authState.user.role === "ADMIN") {
        try {
          const [security, templates, backupPoints] = await Promise.all([
            settingsService.getSecuritySettings(),
            settingsService.getAllTemplates(),
            settingsService.getBackups()
          ]);

          setSecuritySettings(security);
          setNotificationTemplates(templates);
          setBackups(backupPoints);
        } catch (adminError) {
          console.error("❌ Admin settings fetch failed:", adminError);
        }
      } else {
        // NON-ADMIN → ALWAYS CLEAR ADMIN DATA
        setSecuritySettings(null);
        setNotificationTemplates([]);
        setBackups([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
    };

  // ============================================================
  // RUN ONLY **AFTER** AUTH STATE IS CONFIRMED
  // ============================================================
  useEffect(() => {
    if (!authState.isLoading) {
      refreshSettings();
    }
  }, [authState.isAuthenticated, authState.isLoading]);

  // ============================================================
  // QUARTER UPDATE MESSAGE EFFECT
  // ============================================================
  useEffect(() => {
    if (lastUpdate) {
      setQuarterUpdateMessage(`Quarter updated at ${lastUpdate.toLocaleTimeString()}`);
      const timer = setTimeout(() => setQuarterUpdateMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [lastUpdate]);

  return (
    <SettingsContext.Provider
      value={{
        schoolYear,
        schoolYears,
        schoolProfile,
        securitySettings,
        notificationTemplates,
        backups,
        loading,
        error,
        refreshSettings,
        activeQuarter,
        quarterUpdateMessage,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
