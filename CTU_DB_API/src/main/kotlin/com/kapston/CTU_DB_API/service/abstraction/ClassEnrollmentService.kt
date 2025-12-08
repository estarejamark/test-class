package com.kapston.CTU_DB_API.service.abstraction

import com.kapston.CTU_DB_API.domain.dto.response.EnrolledStudentResponse
import com.kapston.CTU_DB_API.domain.dto.response.UnassignedStudentResponse
import com.kapston.CTU_DB_API.domain.dto.response.StudentWithEnrollmentResponse
import com.kapston.CTU_DB_API.domain.dto.request.EnrollmentRequest
import com.kapston.CTU_DB_API.domain.dto.request.MoveStudentRequest
import java.util.UUID

interface ClassEnrollmentService {

    // Get all enrolled students for a specific section
    fun getEnrolledStudents(sectionId: UUID): List<EnrolledStudentResponse>

    // Get all students not enrolled in any section
    fun getUnassignedStudents(): List<UnassignedStudentResponse>

    // Get all students with their current enrollment status
    fun getAllStudentsWithEnrollmentStatus(): List<StudentWithEnrollmentResponse>

    // Assign a student to a section
    fun assignStudentToSection(request: EnrollmentRequest): String

    // Move a student to another section
    fun moveStudentToSection(request: MoveStudentRequest): String

    // Mark a student as inactive (graduated/transferred)
    fun markStudentInactive(studentId: UUID): String

    // Remove student from section (for transfers or withdrawals)
    fun removeStudentFromSection(studentId: UUID, sectionId: UUID): String

    // Get enrollment count for a section
    fun getEnrollmentCountForSection(sectionId: UUID): Int

    // Remove student from all sections
    fun removeStudentFromAllSections(studentId: UUID)

    // Get all enrollments for a section
    fun getEnrollmentsBySection(sectionId: UUID): List<com.kapston.CTU_DB_API.domain.entity.ClassEnrollmentEntity>
}
