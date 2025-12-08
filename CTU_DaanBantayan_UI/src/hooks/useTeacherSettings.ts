import { useState, useEffect } from 'react';
import { settingsService } from '@/services/settings.service';
import { TeacherAdviserSettings } from '@/types/teacher-settings';

export const useTeacherSettings = () => {
  const [settings, setSettings] = useState<TeacherAdviserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const teacherSettings = await settingsService.getTeacherSettings();
      setSettings(teacherSettings);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch teacher settings:', err);
      setError('Failed to load teacher settings');
      // Set default settings if fetch fails
      setSettings({
        notificationPreferences: {
          teachingAlerts: {
            scheduleChanges: true,
            attendanceIssues: true,
            gradeSubmissionReminder: true
          },
          advisoryAlerts: {
            newQuarterPackages: true,
            parentCommunication: true,
            weeklyAdvisorySummary: true
          },
          channels: {
            inApp: true,
            email: true,
            sms: false
          }
        },
        appearance: {
          defaultGradingView: 'table',
          displayOptions: {
            showArchivedSubjects: false,
            showUnpublishedSections: false,
            groupClassesByTime: false
          }
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: TeacherAdviserSettings) => {
    try {
      const updatedSettings = await settingsService.updateTeacherSettings(newSettings);
      setSettings(updatedSettings);
      setError(null);
      return updatedSettings;
    } catch (err) {
      console.error('Failed to update teacher settings:', err);
      setError('Failed to update teacher settings');
      throw err;
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    error,
    updateSettings,
    refetch: fetchSettings
  };
};
