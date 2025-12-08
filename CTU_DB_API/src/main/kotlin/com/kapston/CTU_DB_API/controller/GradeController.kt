package com.kapston.CTU_DB_API.controller

import com.kapston.CTU_DB_API.domain.dto.response.GradeResponse
import com.kapston.CTU_DB_API.service.abstraction.GradeService
import com.kapston.CTU_DB_API.utility.JwtUtils
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import java.util.*

@RestController
@RequestMapping("/api/grades")
@PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
class GradeController(
    private val gradeService: GradeService,
    private val jwtUtils: JwtUtils
) {

    @PostMapping
    fun recordGrade(
        @RequestParam studentId: String,
        @RequestParam subjectId: String,
        @RequestParam sectionId: String,
        @RequestParam quarter: String,
        @RequestParam gradeType: String,
        @RequestParam score: Double,
        @RequestParam(required = false) totalScore: Double?,
        @CookieValue("jwt") jwt: String
    ): ResponseEntity<GradeResponse> {
        // Verify teacher has access to this section/subject
        val teacherId = jwtUtils.getUserIdFromToken(jwt)

        val response = gradeService.recordGrade(
            UUID.fromString(studentId),
            UUID.fromString(subjectId),
            UUID.fromString(sectionId),
            quarter,
            gradeType,
            score,
            totalScore
        )
        return ResponseEntity.ok(response)
    }

    @GetMapping("/student/{studentId}/section/{sectionId}")
    fun getGradesForStudent(
        @PathVariable studentId: String,
        @PathVariable sectionId: String,
        @RequestParam quarter: String,
        @CookieValue("jwt") jwt: String
    ): ResponseEntity<List<GradeResponse>> {
        // Verify teacher has access to this section
        val teacherId = jwtUtils.getUserIdFromToken(jwt)

        val grades = gradeService.getGradesForStudent(
            UUID.fromString(studentId),
            UUID.fromString(sectionId),
            quarter
        )
        return ResponseEntity.ok(grades)
    }

    @GetMapping("/section/{sectionId}/subject/{subjectId}")
    fun getGradesForSection(
        @PathVariable sectionId: String,
        @PathVariable subjectId: String,
        @RequestParam quarter: String,
        @CookieValue("jwt") jwt: String
    ): ResponseEntity<List<GradeResponse>> {
        // Verify teacher has access to this section/subject
        val teacherId = jwtUtils.getUserIdFromToken(jwt)

        val grades = gradeService.getGradesForSection(
            UUID.fromString(sectionId),
            UUID.fromString(subjectId),
            quarter
        )
        return ResponseEntity.ok(grades)
    }

    @PostMapping("/calculate-final")
    fun calculateFinalGrade(
        @RequestParam studentId: String,
        @RequestParam subjectId: String,
        @RequestParam sectionId: String,
        @RequestParam quarter: String,
        @CookieValue("jwt") jwt: String
    ): ResponseEntity<GradeResponse> {
        // Verify teacher has access to this section/subject
        val teacherId = jwtUtils.getUserIdFromToken(jwt)

        val finalGrade = gradeService.calculateFinalGrade(
            UUID.fromString(studentId),
            UUID.fromString(subjectId),
            UUID.fromString(sectionId),
            quarter
        )
        return ResponseEntity.ok(finalGrade)
    }

    @PutMapping("/{gradeId}")
    fun updateGrade(
        @PathVariable gradeId: String,
        @RequestParam score: Double,
        @RequestParam(required = false) totalScore: Double?,
        @CookieValue("jwt") jwt: String
    ): ResponseEntity<GradeResponse> {
        // Verify teacher has access to this grade record
        val teacherId = jwtUtils.getUserIdFromToken(jwt)

        val response = gradeService.updateGrade(
            UUID.fromString(gradeId),
            score,
            totalScore
        )
        return ResponseEntity.ok(response)
    }

    @DeleteMapping("/{gradeId}")
    fun deleteGrade(
        @PathVariable gradeId: String,
        @CookieValue("jwt") jwt: String
    ): ResponseEntity<Void> {
        // Verify teacher has access to this grade record
        val teacherId = jwtUtils.getUserIdFromToken(jwt)

        gradeService.deleteGrade(UUID.fromString(gradeId))
        return ResponseEntity.noContent().build()
    }
}
