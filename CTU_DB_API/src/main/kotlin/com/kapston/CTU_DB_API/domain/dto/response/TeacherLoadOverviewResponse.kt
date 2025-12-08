package com.kapston.CTU_DB_API.domain.dto.response

data class TeacherLoadOverviewResponse(
    val id: String,
    val teacher: AdviserSummaryResponse,
    val subject: String,
    val section: String,
    val schedule: String,
    val status: String
)
