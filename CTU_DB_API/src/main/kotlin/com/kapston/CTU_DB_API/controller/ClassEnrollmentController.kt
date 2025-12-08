package com.kapston.CTU_DB_API.controller

import com.kapston.CTU_DB_API.domain.dto.request.EnrollmentRequest
import com.kapston.CTU_DB_API.domain.dto.request.MoveStudentRequest
import com.kapston.CTU_DB_API.domain.dto.response.EnrolledStudentResponse
import com.kapston.CTU_DB_API.domain.dto.response.UnassignedStudentResponse
import com.kapston.CTU_DB_API.domain.dto.response.StudentWithEnrollmentResponse
import com.kapston.CTU_DB_API.service.abstraction.ClassEnrollmentService
import com.kapston.CTU_DB_API.utility.JwtUtils
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.UUID

@RestController
@RequestMapping("/api/enrollments")
class ClassEnrollmentController(
    private val classEnrollmentService: ClassEnrollmentService,
    private val jwtUtils: JwtUtils
) {

    @GetMapping("/sections/{sectionId}/students")
    fun getEnrolledStudents(
        @CookieValue("jwt") jwt: String,
        @PathVariable sectionId: UUID
    ): ResponseEntity<List<EnrolledStudentResponse>> {
        jwtUtils.validateAccessToken(jwt)
        try {
            val students = classEnrollmentService.getEnrolledStudents(sectionId)
            return ResponseEntity.ok(students)
        } catch (e: Exception) {
            // Log the error and return appropriate HTTP status
            when (e) {
                is com.kapston.CTU_DB_API.CustomException.SectionNotFoundException -> {
                    return ResponseEntity.notFound().build()
                }
                else -> {
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build()
                }
            }
        }
    }

    @GetMapping("/students/unassigned")
    fun getUnassignedStudents(
        @CookieValue("jwt") jwt: String
    ): ResponseEntity<List<UnassignedStudentResponse>> {
        jwtUtils.validateAccessToken(jwt)
        val students = classEnrollmentService.getUnassignedStudents()
        return ResponseEntity.ok(students)
    }

    @GetMapping("/students")
    fun getAllStudentsWithEnrollmentStatus(
        @CookieValue("jwt") jwt: String
    ): ResponseEntity<List<StudentWithEnrollmentResponse>> {
        jwtUtils.validateAccessToken(jwt)
        val students = classEnrollmentService.getAllStudentsWithEnrollmentStatus()
        return ResponseEntity.ok(students)
    }

    @PostMapping
    fun assignStudentToSection(
        @CookieValue("jwt") jwt: String,
        @Valid @RequestBody request: EnrollmentRequest
    ): ResponseEntity<String> {
        jwtUtils.validateAccessToken(jwt)
        val result = classEnrollmentService.assignStudentToSection(request)
        return ResponseEntity.status(HttpStatus.CREATED).body(result)
    }

    @PatchMapping("/move")
    fun moveStudentToSection(
        @CookieValue("jwt") jwt: String,
        @Valid @RequestBody request: MoveStudentRequest
    ): ResponseEntity<String> {
        jwtUtils.validateAccessToken(jwt)
        val result = classEnrollmentService.moveStudentToSection(request)
        return ResponseEntity.ok(result)
    }

    @PatchMapping("/students/{studentId}/inactive")
    fun markStudentInactive(
        @CookieValue("jwt") jwt: String,
        @PathVariable studentId: UUID
    ): ResponseEntity<String> {
        jwtUtils.validateAccessToken(jwt)
        val result = classEnrollmentService.markStudentInactive(studentId)
        return ResponseEntity.ok(result)
    }

    @DeleteMapping("/students/{studentId}/sections/{sectionId}")
    fun removeStudentFromSection(
        @CookieValue("jwt") jwt: String,
        @PathVariable studentId: UUID,
        @PathVariable sectionId: UUID
    ): ResponseEntity<String> {
        jwtUtils.validateAccessToken(jwt)
        val result = classEnrollmentService.removeStudentFromSection(studentId, sectionId)
        return ResponseEntity.ok(result)
    }
}
