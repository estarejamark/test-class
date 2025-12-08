package com.kapston.CTU_DB_API.domain.dto.response

data class UsageStatsResponse(
    val activeStudents: Long,
    val activeSections: Long,
    val totalGrades: Long,
    val period: String // e.g., "last_30_days", "last_90_days"
)
