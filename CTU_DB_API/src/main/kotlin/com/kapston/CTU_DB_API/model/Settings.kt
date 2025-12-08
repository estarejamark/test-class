package com.kapston.CTU_DB_API.model

import com.fasterxml.jackson.annotation.JsonIgnore
import com.kapston.CTU_DB_API.domain.Enums.Quarter
import com.kapston.CTU_DB_API.domain.entity.SchoolYearEntity
import jakarta.persistence.*
import jakarta.validation.constraints.*
import java.time.LocalDate
import java.time.LocalDateTime



@Entity
@Table(name = "security_settings")
data class SecuritySettings(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @field:Min(value = 6, message = "Password minimum length must be at least 6 characters")
    @field:Max(value = 128, message = "Password minimum length cannot exceed 128 characters")
    @Column(nullable = false)
    val passwordMinLength: Int = 8,

    @Column(nullable = false)
    val requireNumbers: Boolean = true,

    @Column(nullable = false)
    val requireSpecialChars: Boolean = true,

    @field:Min(value = 30, message = "Password expiration must be at least 30 days")
    @field:Max(value = 365, message = "Password expiration cannot exceed 365 days")
    @Column(nullable = false)
    val passwordExpirationDays: Int = 90,

    @Column(nullable = false)
    val twoFactorEnabled: Boolean = false,

    @Column(nullable = false)
    val twoFactorRequiredForAdmins: Boolean = true,

    @Column(nullable = false)
    val updatedAt: LocalDateTime = LocalDateTime.now()
)

@Entity
@Table(name = "notification_templates")
data class NotificationTemplate(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @field:NotBlank(message = "Template name is required")
    @field:Size(min = 2, max = 100, message = "Template name must be between 2 and 100 characters")
    @Column(nullable = false)
    val name: String,

    @field:NotBlank(message = "Category is required")
    @field:Size(max = 50, message = "Category must not exceed 50 characters")
    @Column(nullable = false)
    val category: String,

    @field:NotBlank(message = "Content is required")
    @field:Size(max = 2000, message = "Content must not exceed 2000 characters")
    @Column(nullable = false, length = 2000)
    val content: String,

    @field:NotNull(message = "Notification type is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    val type: NotificationType,

    @ElementCollection
    @CollectionTable(name = "template_variables")
    val variables: Set<String> = setOf(),

    @Column(nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(nullable = false)
    val updatedAt: LocalDateTime = LocalDateTime.now()
)

@Entity
@Table(name = "backup_points")
data class BackupPoint(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @field:NotNull(message = "Backup date is required")
    @Column(nullable = false)
    val date: LocalDateTime,

    @field:Min(value = 0, message = "Backup size must be positive")
    @Column(nullable = false)
    val size: Long,

    @field:NotNull(message = "Backup status is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    val status: BackupStatus,

    @field:Size(max = 500, message = "File path must not exceed 500 characters")
    @Column(nullable = true)
    val filePath: String?,

    @Column(nullable = true)
    val restoredAt: LocalDateTime? = null
)

enum class TermType {
    QUARTER
}

enum class QuarterStatus {
    UPCOMING, ACTIVE, CLOSED
}

@Entity
@Table(name = "school_year_quarters")
class SchoolYearQuarter(

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_year_id", nullable = false)
    @JsonIgnore
    var schoolYear: SchoolYearEntity? = null,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var quarter: Quarter? = null,

    @field:NotNull(message = "Start date is required")
    @Column(nullable = false)
    var startDate: LocalDate? = null,

    @field:NotNull(message = "End date is required")
    @Column(nullable = false)
    var endDate: LocalDate? = null,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var status: QuarterStatus = QuarterStatus.UPCOMING,

    @Column(nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(nullable = true)
    var updatedAt: LocalDateTime? = null,

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null
) {
    // Custom validation: end date must be after start date
    @AssertTrue(message = "End date must be after start date")
    fun isEndDateAfterStartDate(): Boolean {
        return endDate?.isAfter(startDate) ?: false
    }

    fun toDto() = SchoolYearQuarterDto(
        id ?: throw IllegalStateException("Quarter ID cannot be null"),
        quarter ?: throw IllegalStateException("Quarter type cannot be null"),
        startDate ?: throw IllegalStateException("Start date cannot be null"),
        endDate ?: throw IllegalStateException("End date cannot be null"),
        status ?: throw IllegalStateException("Status cannot be null"),
        createdAt ?: throw IllegalStateException("Created date cannot be null"),
        updatedAt
    )

    fun copy(
        schoolYear: SchoolYearEntity? = this.schoolYear,
        quarter: Quarter? = this.quarter,
        startDate: LocalDate? = this.startDate,
        endDate: LocalDate? = this.endDate,
        status: QuarterStatus = this.status,
        createdAt: LocalDateTime = this.createdAt,
        updatedAt: LocalDateTime? = this.updatedAt,
        id: Long? = this.id
    ) = SchoolYearQuarter(schoolYear, quarter, startDate, endDate, status, createdAt, updatedAt, id)
}



enum class NotificationType {
    SMS, EMAIL
}

enum class BackupStatus {
    COMPLETED, IN_PROGRESS, FAILED, RESTORED
}
