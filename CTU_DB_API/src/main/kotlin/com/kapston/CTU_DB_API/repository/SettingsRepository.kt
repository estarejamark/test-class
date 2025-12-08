package com.kapston.CTU_DB_API.repository

import com.kapston.CTU_DB_API.domain.entity.SchoolProfileEntity
import com.kapston.CTU_DB_API.domain.Enums.Quarter
import com.kapston.CTU_DB_API.model.*
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.time.LocalDate
import java.time.LocalDateTime

@Repository
interface SchoolYearRepository : JpaRepository<com.kapston.CTU_DB_API.domain.entity.SchoolYearEntity, Long> {
    fun findByIsActive(isActive: Boolean): com.kapston.CTU_DB_API.domain.entity.SchoolYearEntity?
    fun findByIsArchived(isArchived: Boolean): List<com.kapston.CTU_DB_API.domain.entity.SchoolYearEntity>
    fun findTop10ByOrderByCreatedAtDesc(): List<com.kapston.CTU_DB_API.domain.entity.SchoolYearEntity>
}



@Repository
interface SchoolProfileRepository : JpaRepository<SchoolProfileEntity, Long> {
    fun findFirstByOrderByUpdatedAtDesc(): SchoolProfileEntity?
}

@Repository
interface SecuritySettingsRepository : JpaRepository<SecuritySettings, Long> {
    fun findFirstByOrderByUpdatedAtDesc(): SecuritySettings?
}

@Repository
interface NotificationTemplateRepository : JpaRepository<NotificationTemplate, Long> {
    fun findByCategory(category: String): List<NotificationTemplate>
    fun findByType(type: NotificationType): List<NotificationTemplate>
}

@Repository
interface BackupPointRepository : JpaRepository<BackupPoint, Long> {
    fun findByStatus(status: BackupStatus): List<BackupPoint>
    fun findByDateAfter(date: LocalDateTime): List<BackupPoint>
    fun findTop10ByOrderByDateDesc(): List<BackupPoint>
}

@Repository
interface SettingsRepository {
    // -------------------------
    // School Year Management
    // -------------------------
    fun findActiveSchoolYear(): com.kapston.CTU_DB_API.domain.entity.SchoolYearEntity?
    fun findAllSchoolYears(): List<com.kapston.CTU_DB_API.domain.entity.SchoolYearEntity>
    fun saveSchoolYear(schoolYear: com.kapston.CTU_DB_API.domain.entity.SchoolYearEntity): com.kapston.CTU_DB_API.domain.entity.SchoolYearEntity
    fun deleteSchoolYear(id: Long)
    fun findOverlappingSchoolYears(startDate: LocalDate, endDate: LocalDate): List<com.kapston.CTU_DB_API.domain.entity.SchoolYearEntity>

    // -------------------------
    // School Year Quarter Management
    // -------------------------
    // Return quarter entity for update/delete/activate
    fun findQuarterById(id: Long): SchoolYearQuarter?

    // Active quarter entity
    fun findActiveQuarter(): SchoolYearQuarter?

    // Entity-saving method
    fun saveQuarter(quarter: SchoolYearQuarter): SchoolYearQuarter

    // Delete quarter
    fun deleteQuarter(id: Long)

    // DTO list for UI
    fun findQuartersBySchoolYear(schoolYearId: Long): List<SchoolYearQuarterDto>

    // New helper methods to match service implementation
    fun findQuarterEntityById(id: Long): SchoolYearQuarter? = findQuarterById(id)
    fun findActiveQuarterEntity(): SchoolYearQuarter? = findActiveQuarter()

    // -------------------------
    // School Profile Management
    // -------------------------
    fun findSchoolProfile(): SchoolProfileEntity
    fun saveSchoolProfile(profile: SchoolProfileEntity): SchoolProfileEntity
    fun deleteSchoolProfile(id: Long)

    // -------------------------
    // Security Settings
    // -------------------------
    fun findSecuritySettings(): SecuritySettings
    fun saveSecuritySettings(settings: SecuritySettings): SecuritySettings
    fun deleteSecuritySettings(id: Long)

    // -------------------------
    // Notification Templates
    // -------------------------
    fun findAllTemplates(): List<NotificationTemplate>
    fun findTemplatesByCategory(category: String): List<NotificationTemplate>
    fun saveTemplate(template: NotificationTemplate): NotificationTemplate
    fun updateTemplate(id: Long, template: NotificationTemplate): NotificationTemplate
    fun deleteTemplate(id: Long)

    // -------------------------
    // Data Backup & Retention
    // -------------------------
    fun findAllBackups(): List<BackupPoint>
    fun findRecentBackups(): List<BackupPoint>
    fun createBackup(): BackupPoint
    fun completeBackup(id: Long, size: Long, filePath: String): BackupPoint
    fun failBackup(id: Long): BackupPoint
    fun restoreBackup(id: Long): BackupPoint
}
