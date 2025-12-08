package com.kapston.CTU_DB_API.service.abstraction

import com.kapston.CTU_DB_API.domain.dto.request.CreateStudentRequest
import com.kapston.CTU_DB_API.domain.dto.request.UpdateStudentRequest
import com.kapston.CTU_DB_API.domain.dto.response.BulkCreateResult
import com.kapston.CTU_DB_API.domain.dto.response.StudentResponse
import java.util.UUID

interface StudentService {
    /**
     * Creates a new student with immediate enrollment in a section
     * This operation is transactional - if enrollment fails, user creation is rolled back
     */
    fun createStudentWithEnrollment(request: CreateStudentRequest): StudentResponse

    /**
     * Updates student information and handles enrollment changes
     * This operation is transactional to ensure data consistency
     */
    fun updateStudentWithEnrollment(studentId: UUID, request: UpdateStudentRequest): StudentResponse

    /**
     * Gets student details including enrollment information
     */
    fun getStudentDetails(studentId: UUID): StudentResponse

    /**
     * Gets all students with their enrollment status
     */
    fun getAllStudentsWithEnrollmentStatus(page: Int, size: Int): Pair<List<StudentResponse>, Long>

    /**
     * Validates if a section can accept more students (capacity check)
     */
    fun validateSectionCapacity(sectionId: UUID): Boolean

    /**
     * Checks for adviser conflicts when changing user roles
     */
    fun checkAdviserConflicts(userId: UUID): List<String>

    /**
     * Soft deletes a student by deactivating their account
     */
    fun deleteStudent(studentId: UUID)

    /**
     * Searches students by query string with pagination
     */
    fun searchStudents(query: String, page: Int, size: Int): Pair<List<StudentResponse>, Long>

    /**
     * Bulk creates multiple students
     */
    fun bulkCreateStudents(requests: List<CreateStudentRequest>): BulkCreateResult

    /**
     * Gets students enrolled in a specific section with pagination
     */
    fun getStudentsBySection(sectionId: UUID, page: Int, size: Int): Pair<List<StudentResponse>, Long>
}
