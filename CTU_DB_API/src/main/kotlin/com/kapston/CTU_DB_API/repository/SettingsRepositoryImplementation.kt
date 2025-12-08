package com.kapston.CTU_DB_API.repository

import com.kapston.CTU_DB_API.model.*
import com.kapston.CTU_DB_API.model.SchoolYearQuarterDto
import com.kapston.CTU_DB_API.domain.entity.SchoolProfileEntity
import com.kapston.CTU_DB_API.domain.entity.SchoolYearEntity
import org.springframework.stereotype.Repository
import java.time.LocalDate
import java.time.LocalDateTime

@Repository
class SettingsRepositoryImplementation(
    private val schoolYearRepo: SchoolYearRepository,
    private val schoolYearQuarterRepo: SchoolYearQuarterRepository,
    private val schoolProfileRepo: SchoolProfileRepository,
    private val securitySettingsRepo: SecuritySettingsRepository,
    private val notificationTemplateRepo: NotificationTemplateRepository,
    private val backupPointRepo: BackupPointRepository
) : SettingsRepository {

    // --------------- SCHOOL YEAR ---------------
    override fun findActiveSchoolYear(): SchoolYearEntity? =
        schoolYearRepo.findByIsActive(true)

    override fun findAllSchoolYears(): List<SchoolYearEntity> =
        schoolYearRepo.findAll()

    override fun saveSchoolYear(schoolYear: SchoolYearEntity): SchoolYearEntity =
        schoolYearRepo.save(schoolYear)

    override fun deleteSchoolYear(id: Long) =
        schoolYearRepo.deleteById(id)

    // --------------- QUARTERS ---------------
    override fun findActiveQuarter(): SchoolYearQuarter? =
        schoolYearQuarterRepo.findFirstByStatusOrderByCreatedAtDesc(QuarterStatus.ACTIVE)

    override fun findQuartersBySchoolYear(schoolYearId: Long): List<SchoolYearQuarterDto> =
        schoolYearQuarterRepo.findQuartersAsDtoBySchoolYearId(schoolYearId)

    override fun saveQuarter(quarter: SchoolYearQuarter): SchoolYearQuarter =
        schoolYearQuarterRepo.save(quarter)

    override fun findQuarterById(id: Long): SchoolYearQuarter? =
        schoolYearQuarterRepo.findById(id).orElse(null)

    override fun deleteQuarter(id: Long) =
        schoolYearQuarterRepo.deleteById(id)

    override fun findOverlappingSchoolYears(startDate: LocalDate, endDate: LocalDate): List<SchoolYearEntity> =
        schoolYearRepo.findAll().filter {
            val itStart = it.startDate
            val itEnd = it.endDate
            (itStart != null && itStart <= endDate) && (itEnd != null && itEnd >= startDate)
        }

    // ------------- PROFILE ---------------
    override fun findSchoolProfile(): SchoolProfileEntity =
        schoolProfileRepo.findFirstByOrderByUpdatedAtDesc() ?: SchoolProfileEntity(
            name = "Academia de San Martin",
            address = "Daanbantayan, Cebu",
            contactInfo = "info@adsm.com",
            email = null,
            officeHours = null,
            logoUrl = null,
            themeColors = mapOf(),
            updatedAt = LocalDateTime.now()
        )

    override fun saveSchoolProfile(profile: SchoolProfileEntity): SchoolProfileEntity =
        schoolProfileRepo.save(profile)

    override fun deleteSchoolProfile(id: Long) =
        schoolProfileRepo.deleteById(id)

    // ------------- SECURITY SETTINGS ---------------
    override fun findSecuritySettings(): SecuritySettings =
        securitySettingsRepo.findFirstByOrderByUpdatedAtDesc() ?: SecuritySettings()

    override fun saveSecuritySettings(settings: SecuritySettings): SecuritySettings =
        securitySettingsRepo.save(settings)

    override fun deleteSecuritySettings(id: Long) =
        securitySettingsRepo.deleteById(id)

    // ------------- NOTIFICATION TEMPLATES ---------------
    override fun findAllTemplates(): List<NotificationTemplate> =
        notificationTemplateRepo.findAll()

    override fun findTemplatesByCategory(category: String): List<NotificationTemplate> =
        notificationTemplateRepo.findByCategory(category)

    override fun saveTemplate(template: NotificationTemplate): NotificationTemplate =
        notificationTemplateRepo.save(template)

    override fun updateTemplate(id: Long, template: NotificationTemplate): NotificationTemplate {
        val existing = notificationTemplateRepo.findById(id).orElseThrow()
        val updated = existing.copy(
            name = template.name,
            content = template.content,
            type = template.type,
            category = template.category
        )
        return notificationTemplateRepo.save(updated)
    }

    override fun deleteTemplate(id: Long) =
        notificationTemplateRepo.deleteById(id)

    // ------------- BACKUPS ---------------
    override fun findAllBackups(): List<BackupPoint> =
        backupPointRepo.findAll()

    override fun findRecentBackups(): List<BackupPoint> =
        backupPointRepo.findTop10ByOrderByDateDesc()

    override fun createBackup(): BackupPoint =
        backupPointRepo.save(
            BackupPoint(
                date = LocalDateTime.now(),
                size = 0L,
                status = BackupStatus.IN_PROGRESS,
                filePath = null
            )
        )

    override fun completeBackup(id: Long, size: Long, filePath: String): BackupPoint {
        val point = backupPointRepo.findById(id).orElseThrow()
        val updated = point.copy(
            status = BackupStatus.COMPLETED,
            size = size,
            filePath = filePath,
            date = LocalDateTime.now()
        )
        return backupPointRepo.save(updated)
    }

    override fun failBackup(id: Long): BackupPoint {
        val point = backupPointRepo.findById(id).orElseThrow()
        val updated = point.copy(status = BackupStatus.FAILED)
        return backupPointRepo.save(updated)
    }

    override fun restoreBackup(id: Long): BackupPoint {
        val point = backupPointRepo.findById(id).orElseThrow()
        val updated = point.copy(
            status = BackupStatus.RESTORED,
            restoredAt = LocalDateTime.now()
        )
        return backupPointRepo.save(updated)
    }
}
