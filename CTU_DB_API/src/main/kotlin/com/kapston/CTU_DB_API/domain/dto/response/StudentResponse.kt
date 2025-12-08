package com.kapston.CTU_DB_API.domain.dto.response

import com.kapston.CTU_DB_API.domain.Enums.Quarter
import java.time.LocalDateTime
import java.util.UUID

data class StudentResponse(
    val studentId: UUID,
    val userId: UUID,
    val profileId: UUID? = null,
    val email: String,
    val firstName: String,
    val lastName: String,
    val middleName: String? = null,
    val gradeLevel: String? = null,
    val sectionId: UUID? = null,
    val sectionName: String? = null,
    val schoolYear: String? = null,
    val quarter: Quarter? = null,
    val enrolledAt: LocalDateTime? = null,
    val isActive: Boolean = true,
    val hasCompleteProfile: Boolean = false
)
