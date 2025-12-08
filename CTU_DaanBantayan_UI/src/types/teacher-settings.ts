// Teacher-Adviser Settings Types
export interface NotificationPreferences {
  teachingAlerts: {
    scheduleChanges: boolean;
    attendanceIssues: boolean;
    gradeSubmissionReminder: boolean;
  };
  advisoryAlerts?: {
    newQuarterPackages: boolean;
    parentCommunication: boolean;
    weeklyAdvisorySummary: boolean;
  };
  channels: {
    inApp: boolean;
    email: boolean;
    sms: boolean;
  };
}

export interface Appearance {
  defaultGradingView: 'table' | 'card' | 'compact';
  displayOptions: {
    showArchivedSubjects: boolean;
    showUnpublishedSections: boolean;
    groupClassesByTime: boolean;
  };
}

export interface TeacherAdviserSettings {
  notificationPreferences: NotificationPreferences;
  appearance: Appearance;
}
