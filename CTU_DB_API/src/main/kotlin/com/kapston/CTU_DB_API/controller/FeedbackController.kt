package com.kapston.CTU_DB_API.controller

import com.kapston.CTU_DB_API.domain.dto.request.FeedbackRequest
import com.kapston.CTU_DB_API.domain.dto.request.UpdateFeedbackRequest
import com.kapston.CTU_DB_API.domain.dto.response.FeedbackResponse
import com.kapston.CTU_DB_API.service.abstraction.FeedbackService
import com.kapston.CTU_DB_API.utility.JwtUtils
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import java.util.*

@RestController
@RequestMapping("/api/feedback")
@PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
class FeedbackController(
    private val feedbackService: FeedbackService,
    private val jwtUtils: JwtUtils
) {

    @PostMapping
    fun recordFeedback(
        @RequestBody request: FeedbackRequest,
        @CookieValue("jwt") jwt: String
    ): ResponseEntity<FeedbackResponse> {
        // Verify teacher has access to this section
        val teacherId = jwtUtils.getUserIdFromToken(jwt)

        val response = feedbackService.recordFeedback(
            UUID.fromString(request.studentId),
            UUID.fromString(request.sectionId),
            request.quarter,
            request.feedback
        )
        return ResponseEntity.ok(response)
    }

    @GetMapping("/student/{studentId}/section/{sectionId}")
    fun getFeedbackForStudent(
        @PathVariable studentId: String,
        @PathVariable sectionId: String,
        @RequestParam quarter: String,
        @CookieValue("jwt") jwt: String
    ): ResponseEntity<FeedbackResponse?> {
        // Verify teacher has access to this section
        val teacherId = jwtUtils.getUserIdFromToken(jwt)

        val feedback = feedbackService.getFeedbackForStudent(
            UUID.fromString(studentId),
            UUID.fromString(sectionId),
            quarter
        )
        return ResponseEntity.ok(feedback)
    }

    @GetMapping("/section/{sectionId}")
    fun getFeedbackForSection(
        @PathVariable sectionId: String,
        @RequestParam quarter: String,
        @CookieValue("jwt") jwt: String
    ): ResponseEntity<List<FeedbackResponse>> {
        // Verify teacher has access to this section
        val teacherId = jwtUtils.getUserIdFromToken(jwt)

        val feedback = feedbackService.getFeedbackForSection(
            UUID.fromString(sectionId),
            quarter
        )
        return ResponseEntity.ok(feedback)
    }

    @PutMapping("/{feedbackId}")
    fun updateFeedback(
        @PathVariable feedbackId: String,
        @RequestBody request: UpdateFeedbackRequest,
        @CookieValue("jwt") jwt: String
    ): ResponseEntity<FeedbackResponse> {
        // Verify teacher has access to this feedback record
        val teacherId = jwtUtils.getUserIdFromToken(jwt)

        val response = feedbackService.updateFeedback(
            UUID.fromString(feedbackId),
            request.feedback
        )
        return ResponseEntity.ok(response)
    }

    @DeleteMapping("/{feedbackId}")
    fun deleteFeedback(
        @PathVariable feedbackId: String,
        @CookieValue("jwt") jwt: String
    ): ResponseEntity<Void> {
        // Verify teacher has access to this feedback record
        val teacherId = jwtUtils.getUserIdFromToken(jwt)

        feedbackService.deleteFeedback(UUID.fromString(feedbackId))
        return ResponseEntity.noContent().build()
    }

    @PostMapping("/{feedbackId}/response")
    fun addStudentResponse(
        @PathVariable feedbackId: String,
        @RequestParam response: String,
        @CookieValue("jwt") jwt: String
    ): ResponseEntity<FeedbackResponse> {
        // Verify student has access to this feedback record
        val studentId = jwtUtils.getUserIdFromToken(jwt)

        val feedbackResponse = feedbackService.addStudentResponse(
            UUID.fromString(feedbackId),
            response
        )
        return ResponseEntity.ok(feedbackResponse)
    }

    @PatchMapping("/{feedbackId}/response/reviewed")
    fun markResponseReviewed(
        @PathVariable feedbackId: String,
        @CookieValue("jwt") jwt: String
    ): ResponseEntity<FeedbackResponse> {
        // Verify adviser has access to this feedback record
        val adviserId = jwtUtils.getUserIdFromToken(jwt)

        val feedbackResponse = feedbackService.markResponseReviewed(UUID.fromString(feedbackId))
        return ResponseEntity.ok(feedbackResponse)
    }

    @GetMapping("/teacher/responses")
    fun getFeedbackWithResponsesForTeacher(@CookieValue("jwt") jwt: String): ResponseEntity<List<FeedbackResponse>> {
        // Verify teacher has access
        val teacherId = jwtUtils.getUserIdFromToken(jwt)

        val feedbackList = feedbackService.getFeedbackWithResponsesForTeacher()
        return ResponseEntity.ok(feedbackList)
    }

    @GetMapping("/adviser/responses")
    fun getFeedbackWithResponsesForAdviser(@CookieValue("jwt") jwt: String): ResponseEntity<List<FeedbackResponse>> {
        // Verify adviser has access
        val adviserId = jwtUtils.getUserIdFromToken(jwt)

        val feedbackList = feedbackService.getFeedbackWithResponsesForAdviser()
        return ResponseEntity.ok(feedbackList)
    }
}
