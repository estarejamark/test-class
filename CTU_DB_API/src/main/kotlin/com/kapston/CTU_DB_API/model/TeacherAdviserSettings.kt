package com.kapston.CTU_DB_API.model

data class NotificationPreferences(
    val teachingAlerts: TeachingAlerts,
    val advisoryAlerts: AdvisoryAlerts? = null,
    val channels: Channels
)

data class TeachingAlerts(
    val scheduleChanges: Boolean,
    val attendanceIssues: Boolean,
    val gradeSubmissionReminder: Boolean
)

data class AdvisoryAlerts(
    val newQuarterPackages: Boolean,
    val parentCommunication: Boolean,
    val weeklyAdvisorySummary: Boolean
)

data class Channels(
    val inApp: Boolean,
    val email: Boolean,
    val sms: Boolean
)

data class Appearance(
    val defaultGradingView: String, // "table", "card", "compact"
    val displayOptions: DisplayOptions
)

data class DisplayOptions(
    val showArchivedSubjects: Boolean,
    val showUnpublishedSections: Boolean,
    val groupClassesByTime: Boolean
)

data class TeacherAdviserSettings(
    val notificationPreferences: NotificationPreferences,
    val appearance: Appearance
)
