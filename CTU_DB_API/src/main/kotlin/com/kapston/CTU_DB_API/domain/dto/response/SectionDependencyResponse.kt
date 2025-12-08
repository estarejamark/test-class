package com.kapston.CTU_DB_API.domain.dto.response

import java.util.UUID

data class SectionDependencyResponse(
    val sectionId: UUID,
    val sectionName: String,
    val gradeLevel: String,
    val adviser: AdviserResponse?,
    val dependencies: DependencyDetails
)

data class DependencyDetails(
    val hasClassEnrollments: Boolean,
    val classEnrollmentsCount: Int,
    val enrolledStudents: List<StudentInfo>? = null,
    val hasScheduleEntries: Boolean,
    val scheduleEntriesCount: Int,
    val scheduleEntries: List<ScheduleInfo>? = null,
    val canDelete: Boolean,
    val deleteOptions: List<String>
)

data class StudentInfo(
    val id: UUID,
    val firstName: String,
    val lastName: String,
    val fullName: String
)

data class ScheduleInfo(
    val id: UUID,
    val subjectName: String,
    val teacherName: String,
    val startTime: String,
    val endTime: String
)
