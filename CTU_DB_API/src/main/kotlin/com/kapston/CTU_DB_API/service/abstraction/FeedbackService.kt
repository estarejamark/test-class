package com.kapston.CTU_DB_API.service.abstraction

import com.kapston.CTU_DB_API.domain.dto.response.FeedbackResponse
import java.util.*

interface FeedbackService {

    fun recordFeedback(
        studentId: UUID,
        sectionId: UUID,
        quarter: String,
        feedback: String
    ): FeedbackResponse

    fun getFeedbackForStudent(
        studentId: UUID,
        sectionId: UUID,
        quarter: String
    ): FeedbackResponse?

    fun getFeedbackForSection(
        sectionId: UUID,
        quarter: String
    ): List<FeedbackResponse>

    fun updateFeedback(
        feedbackId: UUID,
        feedback: String
    ): FeedbackResponse

    fun deleteFeedback(feedbackId: UUID)

    fun addStudentResponse(
        feedbackId: UUID,
        response: String
    ): FeedbackResponse

    fun markResponseReviewed(feedbackId: UUID): FeedbackResponse

    fun getFeedbackWithResponsesForTeacher(): List<FeedbackResponse>

    fun getFeedbackWithResponsesForAdviser(): List<FeedbackResponse>
}
