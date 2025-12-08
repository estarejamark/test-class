package com.kapston.CTU_DB_API.controller

import com.kapston.CTU_DB_API.domain.entity.SchoolProfileEntity
import com.kapston.CTU_DB_API.domain.entity.SchoolYearEntity
import com.kapston.CTU_DB_API.model.*
import com.kapston.CTU_DB_API.service.abstraction.SettingsService
import com.kapston.CTU_DB_API.utility.JwtUtils
import com.kapston.CTU_DB_API.exception.QuarterActivationException
import com.kapston.CTU_DB_API.exception.QuarterNotFoundException
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = ["http://localhost:3000"], allowCredentials = "true")
class SettingsController(private val settingsService: SettingsService, private val jwtUtils: JwtUtils) {

    companion object {
        private val logger: Logger = LoggerFactory.getLogger(SettingsController::class.java)
    }

    // Welcome Endpoint
    @GetMapping("/welcome")
    @PreAuthorize("permitAll()")
    fun welcome(request: HttpServletRequest): ResponseEntity<Map<String, String>> {
        logger.info("Request received: ${request.method} ${request.requestURI}")
        return ResponseEntity.ok(mapOf("message" to "Welcome to the Spring Boot API Service!"))
    }

    // School Year Endpoints
    @GetMapping("/school-year")
    @PreAuthorize("permitAll()")
    fun getSchoolYears(): ResponseEntity<List<SchoolYearEntity>> =
        ResponseEntity.ok(settingsService.getAllSchoolYears())

    @GetMapping("/school-year/active")
    @PreAuthorize("permitAll()")
    fun getActiveSchoolYear(): ResponseEntity<SchoolYearEntity?> =
        ResponseEntity.ok(settingsService.getActiveSchoolYear())

    @GetMapping("/school-year/active-quarter")
    @PreAuthorize("permitAll()")
    fun getActiveQuarter(): ResponseEntity<Map<String, Any?>?> {
    val activeQuarter = settingsService.getActiveQuarter()
    val activeSchoolYear = settingsService.getActiveSchoolYear()

    if (activeQuarter == null || activeSchoolYear == null) {
        return ResponseEntity.ok(null)
    }

    // Safely extract values
    val schoolYearStart = activeSchoolYear!!.startDate?.year ?: 0
    val schoolYearEnd = activeSchoolYear!!.endDate?.year ?: 0
    val quarterName = activeQuarter.quarter?.name
    val quarterStatus = activeQuarter.status?.name
    val quarterId = activeQuarter.id
    val startDate = activeQuarter.startDate
    val endDate = activeQuarter.endDate

    val response = mapOf(
        "schoolYear" to "$schoolYearStart-$schoolYearEnd",
        "activeQuarter" to quarterName,
        "quarterDetails" to mapOf(
            "id" to (quarterId ?: 0), // fallback to avoid null
            "startDate" to startDate,
            "endDate" to endDate,
            "status" to (quarterStatus ?: "UNKNOWN")
        )
    )

    return ResponseEntity.ok(response)

    }

    // Quarter Management Endpoints
    @GetMapping("/school-year/{schoolYearId}/quarters")
    @PreAuthorize("permitAll()")
    fun getQuartersBySchoolYear(@PathVariable schoolYearId: Long): ResponseEntity<Map<String, Any>> {
        logger.info("Accessing quarters for school year: $schoolYearId")
        return try {
            val quarters = settingsService.getQuartersBySchoolYear(schoolYearId)
            logger.info("Successfully retrieved ${quarters.size} quarters for school year $schoolYearId")
            ResponseEntity.ok(mapOf<String, Any>(
                "success" to true,
                "data" to quarters,
                "message" to "Quarters retrieved successfully"
            ))
        } catch (e: RuntimeException) {
            logger.warn("School year not found: $schoolYearId - ${e.message}")
            ResponseEntity.status(404).body(mapOf<String, Any>(
                "success" to false,
                "error" to "Not found",
                "message" to (e.message ?: "School year not found")
            ))
        } catch (e: Exception) {
            logger.error("Failed to retrieve quarters for school year $schoolYearId", e)
            ResponseEntity.status(500).body(mapOf<String, Any>(
                "success" to false,
                "error" to "Internal server error",
                "message" to (e.message ?: "Unknown error occurred")
            ))
        }
    }

    @PostMapping("/school-year/{schoolYearId}/quarter")
    @PreAuthorize("hasRole('ADMIN')")
    fun createQuarter(@PathVariable schoolYearId: Long, @Valid @RequestBody quarter: SchoolYearQuarter): ResponseEntity<Map<String, Any>> {
        logger.info("Creating quarter: ${quarter.quarter} for school year: $schoolYearId")
        return try {
            // Fetch the school year and set it on the quarter
            val schoolYear = settingsService.getAllSchoolYears().find { it.id == schoolYearId }
                ?: throw QuarterNotFoundException("School year with id $schoolYearId not found")
            quarter.schoolYear = schoolYear

            val created = settingsService.createQuarter(quarter)
            logger.info("Quarter created successfully: ${created.id}")
            ResponseEntity.ok(mapOf<String, Any>(
                "success" to true,
                "data" to created,
                "message" to "Quarter created successfully"
            ))
        } catch (e: QuarterActivationException) {
            logger.warn("Quarter creation validation failed: ${e.message}")
            ResponseEntity.badRequest().body(mapOf<String, Any>(
                "success" to false,
                "error" to "Validation failed",
                "message" to (e.message ?: "Validation failed")
            ))
        } catch (e: QuarterNotFoundException) {
            logger.error("Quarter creation failed - school year not found: ${e.message}", e)
            ResponseEntity.status(404).body(mapOf<String, Any>(
                "success" to false,
                "error" to "Not found",
                "message" to (e.message ?: "School year not found")
            ))
        } catch (e: Exception) {
            logger.error("Unexpected error during quarter creation", e)
            ResponseEntity.status(500).body(mapOf<String, Any>(
                "success" to false,
                "error" to "Internal server error",
                "message" to (e.message ?: "Failed to create quarter")
            ))
        }
    }
    
    @PatchMapping("/school-year/quarter/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    fun activateQuarter(
        @PathVariable id: Long
    ): ResponseEntity<Map<String, Any>> {
        logger.info("🔐 Activate quarter endpoint accessed for quarter ID: $id")

        // Log authenticated user's role for debugging
        val auth = SecurityContextHolder.getContext().authentication
        logger.info("Authenticated user: ${auth?.name}, Authorities: ${auth?.authorities}")

    return try {
        val activatedQuarter = settingsService.activateQuarter(id)
        logger.info("✅ Quarter $id activated successfully")
        ResponseEntity.ok(
            mapOf<String, Any>(
                "success" to true,
                "data" to activatedQuarter,
                "message" to "Quarter activated successfully"
            )
        )
    } catch (e: IllegalArgumentException) {
        logger.warn("❌ Quarter activation failed - invalid quarter ID: $id - ${e.message}")
        ResponseEntity.badRequest().body(
            mapOf<String, Any>(
                "success" to false,
                "error" to "Invalid quarter",
                "message" to (e.message ?: "Quarter not found or invalid")
            )
        )
    } catch (e: RuntimeException) {
        logger.error("❌ Quarter activation failed for ID: $id", e)
        ResponseEntity.status(404).body(
            mapOf<String, Any>(
                "success" to false,
                "error" to "Not found",
                "message" to (e.message ?: "Quarter not found")
            )
        )
    } catch (e: Exception) {
        logger.error("❌ Unexpected error during quarter activation for ID: $id", e)
        ResponseEntity.status(500).body(
            mapOf<String, Any>(
                "success" to false,
                "error" to "Internal server error",
                "message" to (e.message ?: "Failed to activate quarter")
            )
        )
    }
}

    @PatchMapping("/school-year/quarter/{id}/close")
    @PreAuthorize("hasRole('ADMIN')")
    fun closeQuarter(@PathVariable id: Long): ResponseEntity<SchoolYearQuarter> =
        ResponseEntity.ok(settingsService.closeQuarter(id))

    @PatchMapping("/school-year/quarter/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    fun updateQuarterStatus(
        @PathVariable id: Long,
        @RequestParam status: QuarterStatus
    ): ResponseEntity<SchoolYearQuarter> =
        ResponseEntity.ok(settingsService.updateQuarterStatus(id, status))


    @DeleteMapping("/school-year/quarter/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    fun deleteQuarter(@PathVariable id: Long): ResponseEntity<Map<String, Any>> {
        return try {
            settingsService.deleteQuarter(id)
            ResponseEntity.ok(mapOf<String, Any>(
                "success" to true,
                "message" to "Quarter deleted successfully"
            ))
        } catch (e: IllegalArgumentException) {
            ResponseEntity.badRequest().body(mapOf<String, Any>(
                "success" to false,
                "error" to "Validation failed",
                "message" to (e.message ?: "Validation failed")
            ))
        } catch (e: RuntimeException) {
            ResponseEntity.badRequest().body(mapOf<String, Any>(
                "success" to false,
                "error" to "Not found",
                "message" to (e.message ?: "Not found")
            ))
        } catch (e: Exception) {
            logger.error("Failed to delete quarter", e)
            ResponseEntity.status(500).body(mapOf<String, Any>(
                "success" to false,
                "error" to "Internal server error",
                "message" to (e.message ?: "Unknown error occurred")
            ))
        }
    }

    @PostMapping("/school-year")
    @PreAuthorize("hasRole('ADMIN')")
    fun createSchoolYear(@Valid @RequestBody schoolYear: SchoolYearEntity): ResponseEntity<Map<String, Any>> {
        return try {
            val created = settingsService.createSchoolYear(schoolYear)
            ResponseEntity.ok(mapOf<String, Any>(
                "success" to true,
                "data" to created,
                "message" to "School year created successfully"
            ))
        } catch (e: IllegalArgumentException) {
            ResponseEntity.badRequest().body(mapOf<String, Any>(
                "success" to false,
                "error" to "Validation failed",
                "message" to (e.message ?: "Validation failed")
            ))
        } catch (e: Exception) {
            logger.error("Failed to create school year", e)
            ResponseEntity.status(500).body(mapOf<String, Any>(
                "success" to false,
                "error" to "Internal server error",
                "message" to (e.message ?: "Unknown error occurred")
            ))
        }
    }

    @PatchMapping("/school-year/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    fun activateSchoolYear(@PathVariable id: Long): ResponseEntity<Map<String, Any>> {
        return try {
            val activated = settingsService.activateSchoolYear(id)
            ResponseEntity.ok(mapOf<String, Any>(
                "success" to true,
                "data" to activated,
                "message" to "School year activated successfully"
            ))
        } catch (e: IllegalArgumentException) {
            ResponseEntity.badRequest().body(mapOf<String, Any>(
                "success" to false,
                "error" to "Validation failed",
                "message" to (e.message ?: "Validation failed")
            ))
        } catch (e: RuntimeException) {
            ResponseEntity.badRequest().body(mapOf<String, Any>(
                "success" to false,
                "error" to "Not found",
                "message" to (e.message ?: "Not found")
            ))
        } catch (e: Exception) {
            logger.error("Failed to activate school year", e)
            ResponseEntity.status(500).body(mapOf<String, Any>(
                "success" to false,
                "error" to "Internal server error",
                "message" to (e.message ?: "Unknown error occurred")
            ))
        }
    }

    @PatchMapping("/school-year/{id}/archive")
    @PreAuthorize("hasRole('ADMIN')")
    fun archiveSchoolYear(@PathVariable id: Long): ResponseEntity<SchoolYearEntity> =
        ResponseEntity.ok(settingsService.archiveSchoolYear(id))

    @DeleteMapping("/school-year/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    fun deleteSchoolYear(@PathVariable id: Long): ResponseEntity<Unit> =
        ResponseEntity.ok(settingsService.deleteSchoolYear(id))

    // School Profile Endpoints
    @GetMapping("/school-profile")
    @PreAuthorize("permitAll")
    fun getSchoolProfile(): ResponseEntity<SchoolProfileEntity> {
        return try {
            val profile = settingsService.getSchoolProfile()
            ResponseEntity.ok(profile)
        } catch (e: Exception) {
            logger.error("Failed to retrieve school profile", e)
            ResponseEntity.status(500).body(null)
        }
    }

    @PatchMapping("/school-profile")
    @PreAuthorize("hasRole('ADMIN')")
    fun updateSchoolProfile(@Valid @RequestBody profile: SchoolProfileEntity): ResponseEntity<SchoolProfileEntity> =
        ResponseEntity.ok(settingsService.updateSchoolProfile(profile))

    @DeleteMapping("/school-profile/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    fun deleteSchoolProfile(@PathVariable id: Long): ResponseEntity<Unit> =
        ResponseEntity.ok(settingsService.deleteSchoolProfile(id))

    // Security Settings Endpoints
    @GetMapping("/security/settings")
    @PreAuthorize("hasRole('ADMIN')")
    fun getSecuritySettings(): ResponseEntity<Map<String, Any>> {
        logger.info("🔐 Security settings endpoint accessed")
        val auth = SecurityContextHolder.getContext().authentication
        logger.info("🔐 Authentication: ${auth?.name}, Authorities: ${auth?.authorities}")
        return try {
            val settings = settingsService.getSecuritySettings()
            ResponseEntity.ok(mapOf<String, Any>(
                "success" to true,
                "data" to settings,
                "message" to "Security settings retrieved successfully"
            ))
        } catch (e: Exception) {
            logger.error("Failed to retrieve security settings", e)
            ResponseEntity.status(500).body(mapOf<String, Any>(
                "success" to false,
                "error" to "Failed to retrieve security settings",
                "message" to (e.message ?: "Unknown error")
            ))
        }
    }

    @PatchMapping("/security/settings")
    @PreAuthorize("hasRole('ADMIN')")
    fun updateSecuritySettings(@Valid @RequestBody settings: SecuritySettings): ResponseEntity<Map<String, Any>> {
        // Validate input ranges
        if (settings.passwordMinLength < 8 || settings.passwordMinLength > 128) {
            return ResponseEntity.badRequest().body(mapOf<String, Any>(
                "success" to false,
                "error" to "Invalid password minimum length",
                "message" to "Password minimum length must be between 8 and 128 characters"
            ))
        }

        if (settings.passwordExpirationDays < 0 || settings.passwordExpirationDays > 365) {
            return ResponseEntity.badRequest().body(mapOf<String, Any>(
                "success" to false,
                "error" to "Invalid password expiration days",
                "message" to "Password expiration days must be between 0 and 365"
            ))
        }

        return try {
            val updatedSettings = settingsService.updateSecuritySettings(settings)
            logger.info("Security settings updated successfully")
            ResponseEntity.ok(mapOf<String, Any>(
                "success" to true,
                "data" to updatedSettings,
                "message" to "Security settings updated successfully"
            ))
        } catch (e: Exception) {
            logger.error("Failed to update security settings", e)
            ResponseEntity.status(500).body(mapOf<String, Any>(
                "success" to false,
                "error" to "Failed to update security settings",
                "message" to (e.message ?: "Unknown error")
            ))
        }
    }

    @DeleteMapping("/security/settings/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    fun deleteSecuritySettings(@PathVariable id: Long): ResponseEntity<Map<String, Any>> {
        return try {
            settingsService.deleteSecuritySettings(id)
            logger.info("Security settings deleted successfully: id=$id")
            ResponseEntity.ok(mapOf<String, Any>(
                "success" to true,
                "message" to "Security settings deleted successfully"
            ))
        } catch (e: Exception) {
            logger.error("Failed to delete security settings: id=$id", e)
            ResponseEntity.status(500).body(mapOf<String, Any>(
                "success" to false,
                "error" to "Failed to delete security settings",
                "message" to (e.message ?: "Unknown error")
            ))
        }
    }

    // Notification Templates Endpoints
    @GetMapping("/notifications/templates")
    @PreAuthorize("hasRole('ADMIN')")
    fun getAllTemplates(): ResponseEntity<List<NotificationTemplate>> =
        ResponseEntity.ok(settingsService.getAllTemplates())

    @GetMapping("/notifications/templates/category/{category}")
    @PreAuthorize("hasRole('ADMIN')")
    fun getTemplatesByCategory(@PathVariable category: String): ResponseEntity<List<NotificationTemplate>> =
        ResponseEntity.ok(settingsService.getTemplatesByCategory(category))

    @PostMapping("/notifications/templates")
    @PreAuthorize("hasRole('ADMIN')")
    fun createTemplate(@Valid @RequestBody template: NotificationTemplate): ResponseEntity<NotificationTemplate> =
        ResponseEntity.ok(settingsService.createTemplate(template))

    @PatchMapping("/notifications/templates/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    fun updateTemplate(
        @PathVariable id: Long,
        @RequestBody template: NotificationTemplate
    ): ResponseEntity<NotificationTemplate> =
        ResponseEntity.ok(settingsService.updateTemplate(id, template))

    @DeleteMapping("/notifications/templates/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    fun deleteTemplate(@PathVariable id: Long): ResponseEntity<Unit> =
        ResponseEntity.ok(settingsService.deleteTemplate(id))

    // Backup & Retention Endpoints
    @GetMapping("/system/backup")
    @PreAuthorize("hasRole('ADMIN')")
    fun getBackups(): ResponseEntity<List<BackupPoint>> =
        ResponseEntity.ok(settingsService.getRecentBackups())

    @PostMapping("/system/backup")
    @PreAuthorize("hasRole('ADMIN')")
    fun createBackup(): ResponseEntity<BackupPoint> =
        ResponseEntity.ok(settingsService.createBackup())

    @PatchMapping("/system/backup/{id}/complete")
    @PreAuthorize("hasRole('ADMIN')")
    fun completeBackup(
        @PathVariable id: Long,
        @RequestParam size: Long,
        @RequestParam filePath: String
    ): ResponseEntity<BackupPoint> =
        ResponseEntity.ok(settingsService.completeBackup(id, size, filePath))

    @PatchMapping("/system/backup/{id}/fail")
    @PreAuthorize("hasRole('ADMIN')")
    fun failBackup(@PathVariable id: Long): ResponseEntity<BackupPoint> =
        ResponseEntity.ok(settingsService.failBackup(id))

    @PostMapping("/system/backup/{id}/restore")
    @PreAuthorize("hasRole('ADMIN')")
    fun restoreBackup(@PathVariable id: Long): ResponseEntity<BackupPoint> =
        ResponseEntity.ok(settingsService.restoreBackup(id))
}
