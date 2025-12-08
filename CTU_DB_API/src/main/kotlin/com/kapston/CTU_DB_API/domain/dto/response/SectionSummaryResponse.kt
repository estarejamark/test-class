package com.kapston.CTU_DB_API.domain.dto.response

data class SectionSummaryResponse(
    val sectionId: String,
    val sectionName: String,
    val gradeLevel: String,
    val adviserName: String,
    val adviserId: String
)
