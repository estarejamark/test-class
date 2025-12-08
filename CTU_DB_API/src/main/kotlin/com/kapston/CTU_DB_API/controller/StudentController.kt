package com.kapston.CTU_DB_API.controller

import com.kapston.CTU_DB_API.domain.dto.request.CreateStudentRequest
import com.kapston.CTU_DB_API.domain.dto.request.UpdateStudentRequest
import com.kapston.CTU_DB_API.domain.dto.response.StudentResponse
import com.kapston.CTU_DB_API.service.abstraction.StudentService
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import java.util.UUID

@RestController
@RequestMapping("/api/students")
@PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
class StudentController(
    private val studentService: StudentService
) {

    @PostMapping
    fun createStudent(@RequestBody request: CreateStudentRequest): ResponseEntity<StudentResponse> {
        val student = studentService.createStudentWithEnrollment(request)
        return ResponseEntity.ok(student)
    }

    @PutMapping("/{studentId}")
    fun updateStudent(
        @PathVariable studentId: UUID,
        @RequestBody request: UpdateStudentRequest
    ): ResponseEntity<StudentResponse> {
        val student = studentService.updateStudentWithEnrollment(studentId, request)
        return ResponseEntity.ok(student)
    }

    @GetMapping("/{studentId}")
    fun getStudent(@PathVariable studentId: UUID): ResponseEntity<StudentResponse> {
        val student = studentService.getStudentDetails(studentId)
        return ResponseEntity.ok(student)
    }

    @GetMapping
    fun getAllStudents(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "10") size: Int
    ): ResponseEntity<Map<String, Any>> {
        val (students, total) = studentService.getAllStudentsWithEnrollmentStatus(page, size)
        return ResponseEntity.ok(mapOf(
            "students" to students,
            "total" to total,
            "page" to page,
            "size" to size
        ))
    }

    @GetMapping("/validate-section/{sectionId}")
    fun validateSectionCapacity(@PathVariable sectionId: UUID): ResponseEntity<Map<String, Boolean>> {
        val isValid = studentService.validateSectionCapacity(sectionId)
        return ResponseEntity.ok(mapOf("valid" to isValid))
    }

    @GetMapping("/check-adviser-conflicts/{userId}")
    fun checkAdviserConflicts(@PathVariable userId: UUID): ResponseEntity<Map<String, List<String>>> {
        val conflicts = studentService.checkAdviserConflicts(userId)
        return ResponseEntity.ok(mapOf("conflicts" to conflicts))
    }

    @DeleteMapping("/{studentId}")
    fun deleteStudent(@PathVariable studentId: UUID): ResponseEntity<Map<String, String>> {
        studentService.deleteStudent(studentId)
        return ResponseEntity.ok(mapOf("message" to "Student deleted successfully"))
    }

    @GetMapping("/search")
    fun searchStudents(
        @RequestParam query: String,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "10") size: Int
    ): ResponseEntity<Map<String, Any>> {
        val (students, total) = studentService.searchStudents(query, page, size)
        return ResponseEntity.ok(mapOf(
            "students" to students,
            "total" to total,
            "page" to page,
            "size" to size
        ))
    }

    @PostMapping("/bulk")
    fun bulkCreateStudents(@RequestBody requests: List<CreateStudentRequest>): ResponseEntity<Map<String, Any>> {
        val results = studentService.bulkCreateStudents(requests)
        return ResponseEntity.ok(mapOf(
            "successful" to results.successful.size,
            "failed" to results.failed.size,
            "results" to results
        ))
    }

    @GetMapping("/section/{sectionId}")
    fun getStudentsBySection(
        @PathVariable sectionId: UUID,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "10") size: Int
    ): ResponseEntity<Map<String, Any>> {
        val (students, total) = studentService.getStudentsBySection(sectionId, page, size)
        return ResponseEntity.ok(mapOf(
            "students" to students,
            "total" to total,
            "page" to page,
            "size" to size
        ))
    }
}
