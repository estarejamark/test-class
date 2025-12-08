package com.kapston.CTU_DB_API.domain.dto.request

import com.kapston.CTU_DB_API.domain.Enums.Quarter
import java.util.UUID

data class EnrollmentRequest(
    val studentId: UUID,
    val sectionId: UUID,
    val schoolYear: String? = null,
    val quarter: Quarter? = null
)
