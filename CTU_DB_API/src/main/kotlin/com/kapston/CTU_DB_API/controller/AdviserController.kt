package com.kapston.CTU_DB_API.controller

import com.kapston.CTU_DB_API.domain.Enums.Role
import com.kapston.CTU_DB_API.service.abstraction.AdviserService
import com.kapston.CTU_DB_API.service.abstraction.UserService
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.bind.annotation.*
import java.util.*

@RestController
@RequestMapping("/api/adviser")
@PreAuthorize("hasAnyRole('ADVISER', 'TEACHER')")
class AdviserController(
    private val adviserService: AdviserService,
    private val userService: UserService
) {

    private fun getCurrentUserId(): UUID {
        val authentication = SecurityContextHolder.getContext().authentication
        return UUID.fromString(authentication.name)
    }

    private fun validateAdviserAccess(userId: UUID) {
        val user = userService.getUserEntity(userId)
        if (user.role == Role.TEACHER) {
            // For TEACHER role, check if they have an assigned section as adviser
            val sectionInfo = adviserService.getAdviserSectionInfo(userId)
            if (sectionInfo == null) {
                throw IllegalAccessException("Teacher does not have adviser privileges")
            }
        }
        // ADVISER role is automatically allowed
    }

    @GetMapping("/quarter-packages")
    fun getQuarterPackagesForAdviser(): ResponseEntity<List<com.kapston.CTU_DB_API.domain.dto.response.QuarterPackageResponse>> {
        val adviserId = getCurrentUserId()
        val packages = adviserService.getQuarterPackagesForAdviser(adviserId)
        return ResponseEntity.ok(packages)
    }

    @PostMapping("/quarter-packages/{id}/return")
    fun returnQuarterPackage(
        @PathVariable id: UUID,
        @RequestBody request: Map<String, String>
    ): ResponseEntity<com.kapston.CTU_DB_API.domain.dto.response.QuarterPackageResponse> {
        val remarks = request["remarks"] ?: ""
        val quarterPackage = adviserService.returnQuarterPackage(id, remarks)
        return ResponseEntity.ok(quarterPackage)
    }

    @PostMapping("/quarter-packages/{id}/forward")
    fun forwardQuarterPackageToAdmin(@PathVariable id: UUID): ResponseEntity<com.kapston.CTU_DB_API.domain.dto.response.QuarterPackageResponse> {
        val quarterPackage = adviserService.forwardQuarterPackageToAdmin(id)
        return ResponseEntity.ok(quarterPackage)
    }

    @GetMapping("/advisory-class")
    fun getAdvisoryClassList(): ResponseEntity<Map<String, Any>> {
        val adviserId = getCurrentUserId()
        validateAdviserAccess(adviserId)
        try {
            val students = adviserService.getAdvisoryClassList(adviserId)
            if (students.isEmpty()) {
                return ResponseEntity.ok(mapOf("message" to "No advisory class found", "data" to emptyList<Any>()))
            } else {
                return ResponseEntity.ok(mapOf("message" to "Advisory class retrieved successfully", "data" to students))
            }
        } catch (e: IllegalArgumentException) {
            return ResponseEntity.badRequest().body(mapOf("message" to e.message!!, "data" to emptyList<Any>()))
        }
    }

    @PostMapping("/advisory-class/{studentId}/suggest-update")
    fun suggestAdvisoryClassUpdate(
        @PathVariable studentId: UUID,
        @RequestBody request: Map<String, String>
    ): ResponseEntity<Map<String, String>> {
        val adviserId = getCurrentUserId()
        validateAdviserAccess(adviserId)
        validateAdviserStudentRelationship(adviserId, studentId)
        val suggestion = request["suggestion"] ?: ""
        adviserService.suggestAdvisoryClassUpdate(adviserId, studentId, suggestion)
        return ResponseEntity.ok(mapOf("message" to "Suggestion submitted successfully"))
    }

    @GetMapping("/advisory-class/{studentId}/pending-suggestions")
    fun getPendingSuggestionsForStudent(@PathVariable studentId: UUID): ResponseEntity<List<String>> {
        val suggestions = adviserService.getPendingSuggestionsForStudent(studentId)
        return ResponseEntity.ok(suggestions)
    }

    @GetMapping("/section-info")
    fun getAdviserSectionInfo(): ResponseEntity<com.kapston.CTU_DB_API.domain.dto.response.SectionResponse> {
        val adviserId = getCurrentUserId()
        val sectionInfo = adviserService.getAdviserSectionInfo(adviserId)
            ?: throw IllegalStateException("No section found for this adviser")
        return ResponseEntity.ok(sectionInfo)
    }

    private fun validateAdviserStudentRelationship(adviserId: UUID, studentId: UUID) {
        adviserService.validateAdviserStudentRelationship(adviserId, studentId)
    }
}
