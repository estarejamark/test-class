package com.kapston.CTU_DB_API.service.abstraction

import com.kapston.CTU_DB_API.domain.dto.response.*
import org.springframework.security.core.Authentication
import java.util.UUID

interface DashboardService {
    fun getTeacherLoadStatus(auth: Authentication): List<TeacherLoadStatusResponse>
    fun getDashboardStats(auth: Authentication): DashboardStatsResponse
    fun getSubjectsOverview(auth: Authentication): List<SubjectOverviewResponse>
    fun getTeacherLoadsOverview(auth: Authentication): List<TeacherLoadOverviewResponse>
    fun getSectionsOverview(auth: Authentication): List<SectionOverviewResponse>
    fun getSubjectsByGrade(auth: Authentication): List<SubjectsByGradeResponse>
    fun getStudentsPerSection(auth: Authentication): List<StudentsPerSectionResponse>

    fun getStudentDashboardData(studentId: UUID): StudentDashboardResponse
}
