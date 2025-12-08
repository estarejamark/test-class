import { apiClient } from '@/lib/api-client';

import { SchoolYear, SchoolProfile, SecuritySettings, NotificationTemplate, BackupPoint, ActiveQuarterResponse, SchoolYearQuarter } from '@/types/settings';
import { TeacherAdviserSettings } from '@/types/teacher-settings';

class SettingsService {
  // School Year Management
  async getSchoolYears(): Promise<SchoolYear[]> {
    const { data } = await apiClient.get<SchoolYear[]>('/api/school-year');
    return data;
  }

  async getActiveSchoolYear(): Promise<SchoolYear | null> {
    try {
      const { data } = await apiClient.get<SchoolYear>('/api/school-year/active');
      return data;
    } catch (error) {
      console.warn('Failed to fetch active school year, returning null:', error);
      return null;
    }
  }

  async createSchoolYear(schoolYear: Omit<SchoolYear, 'id'>): Promise<SchoolYear> {
    const { data } = await apiClient.post<{ success: boolean; data: SchoolYear; message?: string; error?: string }>(
      '/api/school-year',
      schoolYear
    );

    if (!data.success) {
      throw new Error(data.error || data.message || 'Failed to create school year');
    }

    return data.data;
  }

  async activateSchoolYear(id: number): Promise<SchoolYear> {
    const { data } = await apiClient.patch<{ success: boolean; data: SchoolYear; message?: string; error?: string }>(
      `/api/school-year/${id}/activate`
    );

    if (!data.success) {
      throw new Error(data.error || data.message || 'Failed to activate school year');
    }

    return data.data;
  }

  async archiveSchoolYear(id: number): Promise<SchoolYear> {
    const { data } = await apiClient.patch<SchoolYear>(`/api/school-year/${id}/archive`);
    return data;
  }

  async deleteSchoolYear(id: number): Promise<void> {
    await apiClient.delete(`/api/school-year/${id}`);
  }

  // School Profile Management
  async getSchoolProfile(): Promise<SchoolProfile> {
    const cached = localStorage.getItem('school_profile_cache');
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 3600000) { // 1 hour cache
          console.log('Using cached school profile');
          return data;
        }
      } catch (error) {
        console.warn('Failed to parse cached school profile:', error);
        localStorage.removeItem('school_profile_cache');
      }
    }

    const { data } = await apiClient.get<SchoolProfile>('/api/school-profile');

    try {
      localStorage.setItem('school_profile_cache', JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Failed to cache school profile:', error);
    }

    return data;
  }

  async updateSchoolProfile(profile: Partial<SchoolProfile>): Promise<SchoolProfile> {
    const { data } = await apiClient.patch<SchoolProfile>('/api/school-profile', profile);
    return data;
  }

  async deleteSchoolProfile(id: number): Promise<void> {
    await apiClient.delete(`/api/school-profile/${id}`);
  }

  // Security Settings
  async getSecuritySettings(): Promise<SecuritySettings> {
    try {
      const { data } = await apiClient.get<{ success: boolean; data: SecuritySettings; message?: string; error?: string }>(
        '/api/security/settings'
      );

      if (!data.success) {
        throw new Error(data.error || 'Failed to retrieve security settings');
      }

      return data.data;
    } catch (error) {
      console.error('Error fetching security settings:', error);

      if (error instanceof Error) {
        if (error.message.includes('401')) {
          throw new Error('Unauthorized: Please log in again');
        } else if (error.message.includes('403')) {
          throw new Error('Access Denied: Security settings are restricted to administrators only');
        } else if (error.message.includes('500')) {
          throw new Error('Server error: Please try again later');
        }
      }

      throw error;
    }
  }

  async updateSecuritySettings(settings: Partial<SecuritySettings>): Promise<SecuritySettings> {
    try {
      if (settings.passwordMinLength !== undefined &&
          (settings.passwordMinLength < 8 || settings.passwordMinLength > 128)) {
        throw new Error('Password minimum length must be between 8 and 128 characters');
      }

      if (settings.passwordExpirationDays !== undefined &&
          (settings.passwordExpirationDays < 0 || settings.passwordExpirationDays > 365)) {
        throw new Error('Password expiration days must be between 0 and 365');
      }

      const { data } = await apiClient.patch<{ success: boolean; data: SecuritySettings; message?: string; error?: string }>(
        '/api/security/settings',
        settings
      );

      if (!data.success) {
        throw new Error(data.error || data.message || 'Failed to update security settings');
      }

      return data.data;
    } catch (error) {
      console.error('Error updating security settings:', error);

      if (error instanceof Error) {
        if (error.message.includes('400')) {
          throw new Error('Invalid input: Please check your settings values');
        } else if (error.message.includes('401')) {
          throw new Error('Unauthorized: Please log in again');
        } else if (error.message.includes('403')) {
          throw new Error('Forbidden: You do not have permission to update security settings');
        } else if (error.message.includes('500')) {
          throw new Error('Server error: Please try again later');
        }
      }

      throw error;
    }
  }

  async deleteSecuritySettings(id: number): Promise<void> {
    try {
      const { data } = await apiClient.delete<{ success: boolean; message?: string; error?: string }>(
        `/api/security/settings/${id}`
      );

      if (!data.success) {
        throw new Error(data.error || data.message || 'Failed to delete security settings');
      }
    } catch (error) {
      console.error('Error deleting security settings:', error);

      if (error instanceof Error) {
        if (error.message.includes('401')) {
          throw new Error('Unauthorized: Please log in again');
        } else if (error.message.includes('403')) {
          throw new Error('Forbidden: You do not have permission to delete security settings');
        } else if (error.message.includes('404')) {
          throw new Error('Settings not found');
        } else if (error.message.includes('500')) {
          throw new Error('Server error: Please try again later');
        }
      }

      throw error;
    }
  }

  // Notification Templates
  async getAllTemplates(): Promise<NotificationTemplate[]> {
    const { data } = await apiClient.get<NotificationTemplate[]>('/api/notifications/templates');
    return data;
  }

  async getTemplatesByCategory(category: string): Promise<NotificationTemplate[]> {
    const { data } = await apiClient.get<NotificationTemplate[]>(`/api/notifications/templates/category/${category}`);
    return data;
  }

  async createTemplate(template: Omit<NotificationTemplate, 'id'>): Promise<NotificationTemplate> {
    const { data } = await apiClient.post<NotificationTemplate>('/api/notifications/templates', template);
    return data;
  }

  async updateTemplate(id: number, template: Partial<NotificationTemplate>): Promise<NotificationTemplate> {
    const { data } = await apiClient.patch<NotificationTemplate>(`/api/notifications/templates/${id}`, template);
    return data;
  }

  async deleteTemplate(id: number): Promise<void> {
    await apiClient.delete(`/api/notifications/templates/${id}`);
  }

  // Backup Management
  async getBackups(): Promise<BackupPoint[]> {
    const { data } = await apiClient.get<BackupPoint[]>('/api/system/backup');
    return data;
  }

  async createBackup(): Promise<BackupPoint> {
    const { data } = await apiClient.post<BackupPoint>('/api/system/backup');
    return data;
  }

  async completeBackup(id: number, size: number, filePath: string): Promise<BackupPoint> {
    const { data } = await apiClient.patch<BackupPoint>(`/api/system/backup/${id}/complete`, { size, filePath });
    return data;
  }

  async failBackup(id: number): Promise<BackupPoint> {
    const { data } = await apiClient.patch<BackupPoint>(`/api/system/backup/${id}/fail`);
    return data;
  }

  async restoreBackup(id: number): Promise<BackupPoint> {
    const { data } = await apiClient.post<BackupPoint>(`/api/system/backup/${id}/restore`);
    return data;
  }

  // Active Quarter Management
  async getActiveQuarter(): Promise<ActiveQuarterResponse | null> {
    try {
      const { data } = await apiClient.get<ActiveQuarterResponse>('/api/school-year/active-quarter');
      return data;
    } catch (error) {
      console.warn('Failed to fetch active quarter, returning null:', error);
      return null;
    }
  }

  async getQuartersBySchoolYear(schoolYearId: number): Promise<SchoolYearQuarter[]> {
    console.log('🔍 Making request to quarters endpoint for school year:', schoolYearId);
    const { data } = await apiClient.get<{ success: boolean; data: SchoolYearQuarter[]; message?: string; error?: string }>(`/api/school-year/${schoolYearId}/quarters`);

    if (!data.success) {
      throw new Error(data.error || data.message || 'Failed to fetch quarters');
    }

    return data.data;
  }

  async createQuarter(schoolYearId: number, quarter: { quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4', startDate: string, endDate: string }): Promise<SchoolYearQuarter> {
    const { data } = await apiClient.post<{ success: boolean; data: SchoolYearQuarter; message?: string; error?: string }>(
      `/api/school-year/${schoolYearId}/quarter`,
      quarter
    );

    if (!data.success) {
      throw new Error(data.error || data.message || 'Failed to create quarter');
    }

    return data.data;
  }

  async activateQuarter(id: number): Promise<SchoolYearQuarter> {
    const { data } = await apiClient.patch<{ success: boolean; data: SchoolYearQuarter; message?: string; error?: string }>(
      `/api/school-year/quarter/${id}/activate`
    );

    if (!data.success) {
      throw new Error(data.error || data.message || 'Failed to activate quarter');
    }

    return data.data;
  }

  async closeQuarter(id: number): Promise<SchoolYearQuarter> {
    const { data } = await apiClient.patch<SchoolYearQuarter>(`/api/school-year/quarter/${id}/close`);
    return data;
  }

  async updateQuarterStatus(id: number, status: string): Promise<SchoolYearQuarter> {
    const { data } = await apiClient.patch<SchoolYearQuarter>(`/api/school-year/quarter/${id}/status?status=${status}`);
    return data;
  }

  async updateQuarter(id: number, quarter: Partial<Pick<SchoolYearQuarter, 'quarter' | 'startDate' | 'endDate'>> & { quarter?: 'Q1' | 'Q2' | 'Q3' | 'Q4' }): Promise<SchoolYearQuarter> {
    const { data } = await apiClient.patch<{ success: boolean; data: SchoolYearQuarter; message?: string; error?: string }>(
      `/api/school-year/quarter/${id}`,
      quarter
    );

    if (!data.success) {
      throw new Error(data.error || data.message || 'Failed to update quarter');
    }

    return data.data;
  }

  async deleteQuarter(id: number): Promise<void> {
    const { data } = await apiClient.delete<{ success: boolean; message?: string; error?: string }>(
      `/api/school-year/quarter/${id}`
    );

    if (!data.success) {
      throw new Error(data.error || data.message || 'Failed to delete quarter');
    }
  }

  // Teacher-Adviser Settings
  async getTeacherSettings(): Promise<TeacherAdviserSettings> {
    const { data } = await apiClient.get<{ success: boolean; data: TeacherAdviserSettings; message?: string; error?: string }>(
      '/api/teacher/settings'
    );

    if (!data.success) {
      throw new Error(data.error || data.message || 'Failed to fetch teacher settings');
    }

    return data.data;
  }

  async updateTeacherSettings(settings: TeacherAdviserSettings): Promise<TeacherAdviserSettings> {
    const { data } = await apiClient.put<{ success: boolean; data: TeacherAdviserSettings; message?: string; error?: string }>(
      '/api/teacher/settings',
      settings
    );

    if (!data.success) {
      throw new Error(data.error || data.message || 'Failed to update teacher settings');
    }

    return data.data;
  }
}

export const settingsService = new SettingsService();
