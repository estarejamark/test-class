package com.kapston.CTU_DB_API.service.abstraction

import com.kapston.CTU_DB_API.domain.entity.SchoolProfileEntity
import com.kapston.CTU_DB_API.domain.entity.SchoolYearEntity
import com.kapston.CTU_DB_API.model.*

interface SettingsService {

    // School Year Management
    fun getActiveSchoolYear(): SchoolYearEntity?
    fun getAllSchoolYears(): List<SchoolYearEntity>
    fun createSchoolYear(schoolYear: SchoolYearEntity): SchoolYearEntity
    fun activateSchoolYear(id: Long): SchoolYearEntity
    fun archiveSchoolYear(id: Long): SchoolYearEntity
    fun deleteSchoolYear(id: Long)

    // School Year Quarter Management
    fun getActiveQuarter(): SchoolYearQuarter?
    fun getQuartersBySchoolYear(schoolYearId: Long): List<SchoolYearQuarterDto>
    fun createQuarter(quarter: SchoolYearQuarter): SchoolYearQuarter
    fun updateQuarter(id: Long, quarter: SchoolYearQuarter): SchoolYearQuarter
    fun deleteQuarter(id: Long)
    fun activateQuarter(id: Long): SchoolYearQuarter
    fun closeQuarter(id: Long): SchoolYearQuarter
    fun updateQuarterStatus(id: Long, status: QuarterStatus): SchoolYearQuarter

    // School Profile Management
    fun getSchoolProfile(): SchoolProfileEntity
    fun updateSchoolProfile(profile: SchoolProfileEntity): SchoolProfileEntity
    fun deleteSchoolProfile(id: Long)

    // Security Settings
    fun getSecuritySettings(): SecuritySettings
    fun updateSecuritySettings(settings: SecuritySettings): SecuritySettings
    fun deleteSecuritySettings(id: Long)

    // Notification Templates
    fun getAllTemplates(): List<NotificationTemplate>
    fun getTemplatesByCategory(category: String): List<NotificationTemplate>
    fun createTemplate(template: NotificationTemplate): NotificationTemplate
    fun updateTemplate(id: Long, template: NotificationTemplate): NotificationTemplate
    fun deleteTemplate(id: Long)

    // Data Backup & Retention
    fun getAllBackups(): List<BackupPoint>
    fun getRecentBackups(): List<BackupPoint>
    fun createBackup(): BackupPoint
    fun completeBackup(id: Long, size: Long, filePath: String): BackupPoint
    fun failBackup(id: Long): BackupPoint
    fun restoreBackup(id: Long): BackupPoint
}
