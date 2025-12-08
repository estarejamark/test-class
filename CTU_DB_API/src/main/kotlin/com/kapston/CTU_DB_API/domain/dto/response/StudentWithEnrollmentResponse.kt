package com.kapston.CTU_DB_API.domain.dto.response

import com.kapston.CTU_DB_API.domain.Enums.Quarter
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import java.util.UUID

data class StudentWithEnrollmentResponse(
    val studentId: UUID,
    val studentName: String,
    val email: String,
    val gradeLevel: String,
    val currentSectionId: UUID?,
    val currentSectionName: String?,
    val parentName: String?,
    val parentContact: String?,
    val enrolledAt: String?,
    val schoolYear: String?,
    val quarter: Quarter?
) {
    companion object {
        private val dateFormatter: DateTimeFormatter = DateTimeFormatter.ofPattern("MMM dd, yyyy")

        fun fromEntity(
            studentId: UUID,
            studentName: String,
            email: String,
            gradeLevel: String,
            currentSectionId: UUID?,
            currentSectionName: String?,
            parentName: String?,
            parentContact: String?,
            enrolledAt: LocalDateTime?,
            schoolYear: String?,
            quarter: Quarter?
        ): StudentWithEnrollmentResponse {
            return StudentWithEnrollmentResponse(
                studentId = studentId,
                studentName = studentName,
                email = email,
                gradeLevel = gradeLevel,
                currentSectionId = currentSectionId,
                currentSectionName = currentSectionName,
                parentName = parentName,
                parentContact = parentContact,
                enrolledAt = enrolledAt?.format(dateFormatter),
                schoolYear = schoolYear,
                quarter = quarter
            )
        }
    }
}
