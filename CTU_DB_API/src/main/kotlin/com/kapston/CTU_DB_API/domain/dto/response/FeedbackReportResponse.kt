package com.kapston.CTU_DB_API.domain.dto.response

data class FeedbackReportResponse(
    val id: String,
    val studentId: String,
    val studentName: String,
    val sectionId: String,
    val sectionName: String,
    val quarter: String,
    val feedback: String,
    val createdAt: String
)
