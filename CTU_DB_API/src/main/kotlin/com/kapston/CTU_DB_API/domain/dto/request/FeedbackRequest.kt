package com.kapston.CTU_DB_API.domain.dto.request

data class FeedbackRequest(
    val studentId: String,
    val sectionId: String,
    val quarter: String,
    val feedback: String
)

data class UpdateFeedbackRequest(
    val feedback: String
)
