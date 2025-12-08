package com.kapston.CTU_DB_API.domain.dto.response

import com.kapston.CTU_DB_API.domain.Enums.Quarter
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import java.util.UUID

data class EnrolledStudentResponse(
    val enrollmentId: UUID,
    val studentId: UUID,
    val studentName: String,
    val email: String,
    val gradeLevel: String,
    val sectionName: String,
    val parentName: String?,
    val parentContact: String?,
    val enrolledAt: String,
    val schoolYear: String?,
    val quarter: Quarter?
) {
    companion object {
        private val dateFormatter: DateTimeFormatter = DateTimeFormatter.ofPattern("MMM dd, yyyy")

        fun fromEntity(
            enrollmentId: UUID,
            studentId: UUID,
            studentName: String,
            email: String,
            gradeLevel: String,
            sectionName: String,
            parentName: String?,
            parentContact: String?,
            enrolledAt: LocalDateTime,
            schoolYear: String?,
            quarter: Quarter?
        ): EnrolledStudentResponse {
            return EnrolledStudentResponse(
                enrollmentId = enrollmentId,
                studentId = studentId,
                studentName = studentName,
                email = email,
                gradeLevel = gradeLevel,
                sectionName = sectionName,
                parentName = parentName,
                parentContact = parentContact,
                enrolledAt = enrolledAt.format(dateFormatter),
                schoolYear = schoolYear,
                quarter = quarter
            )
        }
    }
}
