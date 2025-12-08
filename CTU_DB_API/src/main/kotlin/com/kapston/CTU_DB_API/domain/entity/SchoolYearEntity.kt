package com.kapston.CTU_DB_API.domain.entity

import com.kapston.CTU_DB_API.model.TermType
import jakarta.persistence.*
import jakarta.validation.constraints.*
import java.time.LocalDate
import java.time.LocalDateTime

@Entity(name = "SchoolYear")
@Table(name = "school_years")
data class SchoolYearEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @field:NotNull(message = "Start date is required")
    @field:PastOrPresent(message = "Start date cannot be in the future")
    @Column(nullable = false)
    val startDate: LocalDate?,

    @field:NotNull(message = "End date is required")
    @field:Future(message = "End date must be in the future")
    @Column(nullable = false)
    val endDate: LocalDate?,

    @Column(nullable = false)
    val yearRange: String,

    @field:NotNull(message = "Term type is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    val termType: TermType,

    @Column(nullable = false)
    val isActive: Boolean = false,

    @Column(nullable = false)
    val isArchived: Boolean = false,

    @Column(nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(nullable = true)
    val archivedAt: LocalDateTime? = null
) {

    // ---------------------------------------------------------------------
    // FIXED: Kotlin Null-Safety Validation (no more Category 3 errors)
    // ---------------------------------------------------------------------

    @AssertTrue(message = "End date must be after start date")
    fun isEndDateAfterStartDate(): Boolean {
        val start = startDate
        val end = endDate
        return if (start != null && end != null) {
            end.isAfter(start)
        } else {
            false
        }
    }

    @AssertTrue(message = "School year must span exactly one academic year")
    fun isValidAcademicYear(): Boolean {
        val start = startDate
        val end = endDate
        return if (start != null && end != null) {
            end.year == start.year + 1
        } else {
            false
        }
    }
}
