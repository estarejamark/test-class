package com.kapston.CTU_DB_API.service.implementation

import com.kapston.CTU_DB_API.domain.Enums.Quarter
import com.kapston.CTU_DB_API.domain.dto.response.FeedbackResponse
import com.kapston.CTU_DB_API.domain.entity.FeedbackEntity
import com.kapston.CTU_DB_API.repository.FeedbackRepository
import com.kapston.CTU_DB_API.repository.ProfileRepository
import com.kapston.CTU_DB_API.repository.SectionRepository
import com.kapston.CTU_DB_API.service.abstraction.FeedbackService
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.*

@Service
class FeedbackServiceImplementation(
    private val feedbackRepository: FeedbackRepository,
    private val profileRepository: ProfileRepository,
    private val sectionRepository: SectionRepository
) : FeedbackService {

    @Transactional
    override fun recordFeedback(
        studentId: UUID,
        sectionId: UUID,
        quarter: String,
        feedback: String
    ): FeedbackResponse {
        val student = profileRepository.findById(studentId)
            .orElseThrow { IllegalArgumentException("Student not found") }

        val section = sectionRepository.findById(sectionId)
            .orElseThrow { IllegalArgumentException("Section not found") }

        // Check for existing feedback record
        val existingFeedback = feedbackRepository.findByStudentAndSectionAndQuarter(
            studentId, sectionId, Quarter.fromString(quarter)
        )

        if (existingFeedback != null) {
            // Update existing record
            existingFeedback.feedback = feedback
            existingFeedback.updatedAt = java.time.LocalDateTime.now()
            val saved = feedbackRepository.save(existingFeedback)
            return saved.toResponse()
        }

        // Create new record
        val feedbackEntity = FeedbackEntity(
            student = student,
            section = section,
            quarter = Quarter.fromString(quarter),
            feedback = feedback
        )

        val saved = feedbackRepository.save(feedbackEntity)
        return saved.toResponse()
    }

    @Transactional(readOnly = true)
    override fun getFeedbackForStudent(
        studentId: UUID,
        sectionId: UUID,
        quarter: String
    ): FeedbackResponse? {
        val quarterEnum = Quarter.fromString(quarter)
        val feedback = feedbackRepository.findByStudentAndSectionAndQuarter(studentId, sectionId, quarterEnum)
        return feedback?.toResponse()
    }

    @Transactional(readOnly = true)
    override fun getFeedbackForSection(
        sectionId: UUID,
        quarter: String
    ): List<FeedbackResponse> {
        val quarterEnum = Quarter.fromString(quarter)
        return feedbackRepository.findBySectionAndQuarter(sectionId, quarterEnum)
            .map { it.toResponse() }
    }

    @Transactional
    override fun updateFeedback(
        feedbackId: UUID,
        feedback: String
    ): FeedbackResponse {
        val feedbackEntity = feedbackRepository.findById(feedbackId)
            .orElseThrow { IllegalArgumentException("Feedback record not found") }

        feedbackEntity.feedback = feedback
        feedbackEntity.updatedAt = java.time.LocalDateTime.now()

        val saved = feedbackRepository.save(feedbackEntity)
        return saved.toResponse()
    }

    @Transactional
    override fun deleteFeedback(feedbackId: UUID) {
        if (!feedbackRepository.existsById(feedbackId)) {
            throw IllegalArgumentException("Feedback record not found")
        }
        feedbackRepository.deleteById(feedbackId)
    }

    @Transactional
    override fun addStudentResponse(
        feedbackId: UUID,
        response: String
    ): FeedbackResponse {
        val feedbackEntity = feedbackRepository.findById(feedbackId)
            .orElseThrow { IllegalArgumentException("Feedback record not found") }

        feedbackEntity.studentResponse = response
        feedbackEntity.responseReviewed = false
        feedbackEntity.updatedAt = java.time.LocalDateTime.now()

        val saved = feedbackRepository.save(feedbackEntity)
        return saved.toResponse()
    }

    @Transactional
    override fun markResponseReviewed(feedbackId: UUID): FeedbackResponse {
        val feedbackEntity = feedbackRepository.findById(feedbackId)
            .orElseThrow { IllegalArgumentException("Feedback record not found") }

        feedbackEntity.responseReviewed = true
        feedbackEntity.updatedAt = java.time.LocalDateTime.now()

        val saved = feedbackRepository.save(feedbackEntity)
        return saved.toResponse()
    }

    @Transactional(readOnly = true)
    override fun getFeedbackWithResponsesForTeacher(): List<FeedbackResponse> {
        return feedbackRepository.findAll()
            .filter { it.studentResponse != null }
            .map { it.toResponse() }
    }

    @Transactional(readOnly = true)
    override fun getFeedbackWithResponsesForAdviser(): List<FeedbackResponse> {
        return feedbackRepository.findAll()
            .filter { it.studentResponse != null && !it.responseReviewed }
            .map { it.toResponse() }
    }

    private fun FeedbackEntity.toResponse(): FeedbackResponse = FeedbackResponse(
        id = id!!,
        studentId = student.id!!,
        studentName = "${student.firstName} ${student.lastName}",
        sectionId = section.id!!,
        sectionName = section.name,
        quarter = quarter,
        feedback = feedback,
        studentResponse = studentResponse,
        responseReviewed = responseReviewed,
        createdAt = createdAt!!,
        updatedAt = updatedAt
    )
}
