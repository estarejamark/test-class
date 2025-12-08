package com.kapston.CTU_DB_API.domain.dto.response

data class SectionOverviewResponse(
    val id: String,
    val section: String,
    val grade: String,
    val adviser: AdviserSummaryResponse,
    val students: Int,
    val status: String
)
