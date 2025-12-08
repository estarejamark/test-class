package com.kapston.CTU_DB_API.domain.dto.response

data class SubjectOverviewResponse(
    val id: String,
    val subject: String,
    val grade: String,
    val teacher: AdviserSummaryResponse,
    val sections: Int,
    val students: Int
)
