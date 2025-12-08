package com.kapston.CTU_DB_API.service.implementation

import com.kapston.CTU_DB_API.model.SchoolYearQuarterDto
import com.kapston.CTU_DB_API.model.toDto
import com.kapston.CTU_DB_API.domain.entity.SchoolProfileEntity
import com.kapston.CTU_DB_API.domain.entity.SchoolYearEntity
import com.kapston.CTU_DB_API.controller.WebSocketController
import com.kapston.CTU_DB_API.exception.QuarterActivationException
import com.kapston.CTU_DB_API.exception.QuarterNotFoundException
import com.kapston.CTU_DB_API.model.*
import com.kapston.CTU_DB_API.repository.*
import com.kapston.CTU_DB_API.service.abstraction.SettingsService
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
class SettingsServiceImplementation(
    private val schoolYearRepo: SchoolYearRepository,
    private val settingsRepository: SettingsRepository,
    private val schoolProfileRepo: SchoolProfileRepository,
    private val securitySettingsRepo: SecuritySettingsRepository,
    private val notificationTemplateRepo: NotificationTemplateRepository,
    private val backupPointRepo: BackupPointRepository,
    private val webSocketController: WebSocketController? = null // Optional for backward compatibility
) : SettingsService {

    companion object {
        private val logger: Logger = LoggerFactory.getLogger(SettingsServiceImplementation::class.java)
    }

    // -------------------------
    // School Year Management
    // -------------------------
    override fun getActiveSchoolYear(): SchoolYearEntity? = schoolYearRepo.findByIsActive(true)

    override fun getAllSchoolYears(): List<SchoolYearEntity> = schoolYearRepo.findAll()


    @Transactional
    override fun createSchoolYear(schoolYear: SchoolYearEntity): SchoolYearEntity {
        val start = schoolYear.startDate ?: throw IllegalArgumentException("Start date cannot be null")
        val end = schoolYear.endDate ?: throw IllegalArgumentException("End date cannot be null")

        // Validate school year dates
        if (end.isBefore(start)) {
            throw IllegalArgumentException("End date must be after start date")
        }
        if (end.year != start.year + 1) {
            throw IllegalArgumentException("School year must span exactly one academic year (e.g., 2024-2025)")
        }

        // Check for overlapping school years with more precise validation
        val overlappingYears = schoolYearRepo.findAll().filter { existing ->
            val existingStart = existing.startDate
            val existingEnd = existing.endDate
            !existing.isArchived && existingStart != null && existingEnd != null &&
            ((start.isBefore(existingEnd) && end.isAfter(existingStart)) ||
             (existingStart.isBefore(end) && existingEnd.isAfter(start)))
        }
        if (overlappingYears.isNotEmpty()) {
            throw IllegalArgumentException("School year dates overlap with existing school year(s): ${overlappingYears.joinToString { "${it.startDate?.year?.toString() ?: "N/A"}-${it.endDate?.year?.toString() ?: "N/A"}" }}. Please choose different dates.")
        }

        // Ensure only one active school year at a time
        if (schoolYear.isActive) {
            val currentActive = schoolYearRepo.findByIsActive(true)
            if (currentActive != null) {
                schoolYearRepo.save(currentActive.copy(isActive = false))
                logger.info("Deactivated previous active school year: ${currentActive.startDate?.year?.toString() ?: "N/A"}-${currentActive.endDate?.year?.toString() ?: "N/A"}")
            }

            // Deactivate any active quarter (settingsRepository supports findActiveQuarter)
            settingsRepository.findActiveQuarter()?.let { activeQuarter ->
                settingsRepository.saveQuarter(activeQuarter.copy(
                    status = QuarterStatus.CLOSED,
                    updatedAt = LocalDateTime.now()
                ))
                logger.info("Closed active quarter (id=${activeQuarter.id}) due to school year activation")
            }
        }

        val schoolYearWithYearRange = schoolYear.copy(
            yearRange = "${start.year}-${end.year}"
        )

        val savedSchoolYear = schoolYearRepo.save(schoolYearWithYearRange)
        logger.info("Created school year: ${savedSchoolYear.yearRange}, active: ${savedSchoolYear.isActive}")
        return savedSchoolYear
    }

    @Transactional
    override fun activateSchoolYear(id: Long): SchoolYearEntity {
        val schoolYear = schoolYearRepo.findById(id).orElseThrow { RuntimeException("School year not found with id: $id") }
        if (schoolYear.isArchived) {
            throw IllegalArgumentException("Cannot activate an archived school year")
        }

        // Deactivate current active year if any
        schoolYearRepo.findByIsActive(true)?.let {
            schoolYearRepo.save(it.copy(isActive = false))
        }

        // Close any currently active quarter via settingsRepository
        settingsRepository.findActiveQuarter()?.let { activeQuarter ->
            settingsRepository.saveQuarter(activeQuarter.copy(status = QuarterStatus.CLOSED, updatedAt = LocalDateTime.now()))
        }

        return schoolYearRepo.save(schoolYear.copy(isActive = true))
    }

    @Transactional
    override fun archiveSchoolYear(id: Long): SchoolYearEntity {
        val schoolYear = schoolYearRepo.findById(id).orElseThrow { RuntimeException("School year not found with id: $id") }
        return schoolYearRepo.save(schoolYear.copy(
            isArchived = !schoolYear.isArchived,
            archivedAt = if (!schoolYear.isArchived) LocalDateTime.now() else null
        ))
    }

    override fun deleteSchoolYear(id: Long) = schoolYearRepo.deleteById(id)

    // -------------------------
    // School Year Quarter Management (use settingsRepository)
    // -------------------------
    override fun getActiveQuarter(): SchoolYearQuarter? =
        settingsRepository.findActiveQuarter()

    override fun getQuartersBySchoolYear(schoolYearId: Long): List<SchoolYearQuarterDto> {
        val schoolYear = schoolYearRepo.findById(schoolYearId)
            .orElseThrow { RuntimeException("School year not found with id: $schoolYearId") }

        // settingsRepository returns DTOs for this method (per your interface)
        return settingsRepository.findQuartersBySchoolYear(schoolYearId)
    }

    @Transactional
    override fun createQuarter(quarter: SchoolYearQuarter): SchoolYearQuarter {
        val schoolYearId = quarter.schoolYear?.id ?: throw QuarterActivationException("School year is required")
        val schoolYear = schoolYearRepo.findById(schoolYearId)
            .orElseThrow { QuarterNotFoundException("School year with id $schoolYearId not found") }

        // Ensure start and end dates are non-null
        val start = quarter.startDate ?: throw QuarterActivationException("Start date cannot be null")
        val end = quarter.endDate ?: throw QuarterActivationException("End date cannot be null")
        require(end.isAfter(start)) { throw QuarterActivationException("End date must be after start date") }

        // Ensure no duplicate quarter for the same school year
        val exists = settingsRepository.findQuartersBySchoolYear(schoolYear.id)
            .any { it.quarter == quarter.quarter }
        require(!exists) { throw QuarterActivationException("Quarter ${quarter.quarter} already exists for this school year") }

        val quarterToCreate = quarter.copy(schoolYear = schoolYear)
        return settingsRepository.saveQuarter(quarterToCreate)
    }

    @Transactional
    override fun activateQuarter(id: Long): SchoolYearQuarter {
        logger.info("🔎 Activating quarter with ID: $id")

        val quarterEntity = settingsRepository.findQuarterEntityById(id)
            ?: throw QuarterNotFoundException("Quarter not found with id: $id")

        // Close the previously active quarter safely
        settingsRepository.findActiveQuarterEntity()?.let { active ->
            logger.info("🛑 Closing active quarter: ${active.id}")
            settingsRepository.saveQuarter(
                active.copy(
                    status = QuarterStatus.CLOSED,
                    updatedAt = LocalDateTime.now()
                )
            )
        }

        logger.info("✅ Setting quarter $id to ACTIVE")

        val updated = settingsRepository.saveQuarter(
            quarterEntity.copy(
                status = QuarterStatus.ACTIVE,
                updatedAt = LocalDateTime.now()
            )
        )

        // Broadcast safely
        webSocketController?.broadcastQuarterUpdate(updated)

        return updated
    }

    @Transactional
    override fun closeQuarter(id: Long): SchoolYearQuarter {
        val quarter = settingsRepository.findQuarterById(id)
            ?: throw QuarterNotFoundException("Quarter not found with id: $id")

        val closedQuarter = settingsRepository.saveQuarter(
            quarter.copy(status = QuarterStatus.CLOSED, updatedAt = LocalDateTime.now())
        )

        // Broadcast if it was active
        if (quarter.status == QuarterStatus.ACTIVE) {
            webSocketController?.broadcastQuarterUpdate(closedQuarter)
        }

        return closedQuarter
    }

    @Transactional
    override fun updateQuarter(id: Long, quarter: SchoolYearQuarter): SchoolYearQuarter {
        val existingQuarter = settingsRepository.findQuarterById(id)
            ?: throw QuarterNotFoundException("Quarter not found with id: $id")

        val start = quarter.startDate ?: throw QuarterActivationException("Start date cannot be null")
        val end = quarter.endDate ?: throw QuarterActivationException("End date cannot be null")
        require(start < end) { throw QuarterActivationException("Start date must be before end date") }

        val schoolYearId = quarter.schoolYear?.id ?: throw QuarterActivationException("School year is required")
        val otherQuarters = settingsRepository.findQuartersBySchoolYear(schoolYearId)
            .filter { it.id != id }

        if (otherQuarters.any { it.quarter == quarter.quarter }) {
            throw QuarterActivationException("Quarter ${quarter.quarter} already exists for this school year")
        }

        if (otherQuarters.any { start <= it.endDate && end >= it.startDate }) {
            throw QuarterActivationException("Quarter dates overlap with existing quarters in this school year")
        }

        return settingsRepository.saveQuarter(existingQuarter.copy(
            quarter = quarter.quarter,
            startDate = start,
            endDate = end,
            status = quarter.status,
            updatedAt = LocalDateTime.now()
        ))
    }

    @Transactional
    override fun deleteQuarter(id: Long) {
        val quarter = settingsRepository.findQuarterById(id)
            ?: throw QuarterNotFoundException("Quarter not found with id: $id")

        if (quarter.status != QuarterStatus.UPCOMING) {
            throw QuarterActivationException("Only UPCOMING quarters can be deleted")
        }

        settingsRepository.deleteQuarter(id)
    }

    @Transactional
    override fun updateQuarterStatus(id: Long, status: QuarterStatus): SchoolYearQuarter {
        val quarter = settingsRepository.findQuarterById(id)
            ?: throw RuntimeException("Quarter not found with id: $id")

        if (status == QuarterStatus.ACTIVE) {
            settingsRepository.findActiveQuarter()?.let { active ->
                settingsRepository.saveQuarter(active.copy(status = QuarterStatus.CLOSED, updatedAt = LocalDateTime.now()))
            }
        }

        val updatedQuarter = settingsRepository.saveQuarter(
            quarter.copy(status = status, updatedAt = LocalDateTime.now())
        )

        if (updatedQuarter.status == QuarterStatus.ACTIVE) {
            webSocketController?.broadcastQuarterUpdate(updatedQuarter)
        }

        return updatedQuarter
    }

    // -------------------------
    // School Profile Management
    // -------------------------
    override fun getSchoolProfile(): SchoolProfileEntity =
        schoolProfileRepo.findFirstByOrderByUpdatedAtDesc()
            ?: schoolProfileRepo.save(
                SchoolProfileEntity(
                    name = "Academia de San Martin",
                    address = "Daanbantayan, Cebu",
                    contactInfo = "info@adsm.com",
                    email = null,
                    officeHours = null,
                    logoUrl = null,
                    themeColors = mapOf()
                )
            )

    override fun updateSchoolProfile(profile: SchoolProfileEntity): SchoolProfileEntity {
        val existing = getSchoolProfile()
        return schoolProfileRepo.save(
            existing.copy(
                name = profile.name,
                address = profile.address,
                contactInfo = profile.contactInfo,
                email = profile.email,
                officeHours = profile.officeHours,
                logoUrl = profile.logoUrl,
                themeColors = profile.themeColors,
                updatedAt = LocalDateTime.now()
            )
        )
    }

    override fun deleteSchoolProfile(id: Long) = schoolProfileRepo.deleteById(id)

    // -------------------------
    // Security Settings
    // -------------------------
    override fun getSecuritySettings(): SecuritySettings =
        securitySettingsRepo.findFirstByOrderByUpdatedAtDesc()
            ?: securitySettingsRepo.save(SecuritySettings())

    override fun updateSecuritySettings(settings: SecuritySettings): SecuritySettings {
        // Validate security settings
        if (settings.passwordMinLength < 6 || settings.passwordMinLength > 128) {
            throw IllegalArgumentException("Password minimum length must be between 6 and 128 characters")
        }
        if (settings.passwordExpirationDays < 30 || settings.passwordExpirationDays > 365) {
            throw IllegalArgumentException("Password expiration must be between 30 and 365 days")
        }
        return securitySettingsRepo.save(settings)
    }

    override fun deleteSecuritySettings(id: Long) = securitySettingsRepo.deleteById(id)

    // -------------------------
    // Notification Templates
    // -------------------------
    override fun getAllTemplates(): List<NotificationTemplate> =
        notificationTemplateRepo.findAll()

    override fun getTemplatesByCategory(category: String): List<NotificationTemplate> =
        notificationTemplateRepo.findByCategory(category)

    override fun createTemplate(template: NotificationTemplate): NotificationTemplate =
        notificationTemplateRepo.save(template)

    override fun updateTemplate(id: Long, template: NotificationTemplate): NotificationTemplate {
        val existing = notificationTemplateRepo.findById(id).orElseThrow { RuntimeException("Notification template not found with id: $id") }
        return notificationTemplateRepo.save(template.copy(
            id = existing.id,
            createdAt = existing.createdAt,
            updatedAt = LocalDateTime.now()
        ))
    }

    override fun deleteTemplate(id: Long) = notificationTemplateRepo.deleteById(id)

    // -------------------------
    // Data Backup & Retention
    // -------------------------
    override fun getAllBackups(): List<BackupPoint> =
        backupPointRepo.findAll()

    override fun getRecentBackups(): List<BackupPoint> =
        backupPointRepo.findTop10ByOrderByDateDesc()

    @Transactional
    override fun createBackup(): BackupPoint {
        // Create pending backup entry
        val backup = backupPointRepo.save(BackupPoint(
            date = LocalDateTime.now(),
            size = 0,
            status = BackupStatus.IN_PROGRESS,
            filePath = null
        ))

        // TODO: Implement actual backup logic here
        return backup
    }

    override fun completeBackup(id: Long, size: Long, filePath: String): BackupPoint {
        val backup = backupPointRepo.findById(id).orElseThrow { RuntimeException("Backup point not found with id: $id") }
        if (size <= 0) {
            throw IllegalArgumentException("Backup size must be positive")
        }
        if (filePath.isBlank()) {
            throw IllegalArgumentException("File path cannot be blank")
        }
        return backupPointRepo.save(backup.copy(
            size = size,
            status = BackupStatus.COMPLETED,
            filePath = filePath
        ))
    }

    override fun failBackup(id: Long): BackupPoint {
        val backup = backupPointRepo.findById(id).orElseThrow { RuntimeException("Backup point not found with id: $id") }
        return backupPointRepo.save(backup.copy(
            status = BackupStatus.FAILED
        ))
    }

    override fun restoreBackup(id: Long): BackupPoint {
        val backup = backupPointRepo.findById(id).orElseThrow { RuntimeException("Backup point not found with id: $id") }

        return backupPointRepo.save(backup.copy(
            status = BackupStatus.RESTORED,
            restoredAt = LocalDateTime.now()
        ))
    }
}
