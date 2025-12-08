package com.kapston.CTU_DB_API.domain.dto.response

import com.kapston.CTU_DB_API.domain.Enums.PackageStatus
import com.kapston.CTU_DB_API.domain.Enums.Quarter
import java.time.LocalDateTime
import java.util.*

data class QuarterPackageResponse(
    val id: UUID,
    val section: SectionResponse,
    val quarter: Quarter,
    val status: PackageStatus,
    val submittedAt: LocalDateTime?,
    val adviser: AdviserResponse?,
    val createdAt: LocalDateTime?,
    val updatedAt: LocalDateTime?
)
