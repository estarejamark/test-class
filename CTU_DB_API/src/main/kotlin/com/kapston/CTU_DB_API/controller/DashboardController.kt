package com.kapston.CTU_DB_API.controller

import com.kapston.CTU_DB_API.domain.dto.response.*
import com.kapston.CTU_DB_API.service.abstraction.DashboardService
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.*
import java.util.UUID

@RestController
@RequestMapping("/api/dashboard")
@PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'ADVISER', 'STUDENT')")
class DashboardController(
    private val dashboardService: DashboardService
) {

    @GetMapping("/teacher-load-status")
    fun getTeacherLoadStatus(auth: Authentication): ResponseEntity<List<TeacherLoadStatusResponse>> {
        val loadStatus = dashboardService.getTeacherLoadStatus(auth)
        return ResponseEntity.ok(loadStatus)
    }

    @GetMapping("/stats")
    fun getDashboardStats(auth: Authentication): ResponseEntity<DashboardStatsResponse> {
        val stats = dashboardService.getDashboardStats(auth)
        return ResponseEntity.ok(stats)
    }

    @GetMapping("/subjects-overview")
    fun getSubjectsOverview(auth: Authentication): ResponseEntity<List<SubjectOverviewResponse>> {
        val overview = dashboardService.getSubjectsOverview(auth)
        return ResponseEntity.ok(overview)
    }

    @GetMapping("/teacher-loads-overview")
    fun getTeacherLoadsOverview(auth: Authentication): ResponseEntity<List<TeacherLoadOverviewResponse>> {
        val overview = dashboardService.getTeacherLoadsOverview(auth)
        return ResponseEntity.ok(overview)
    }

    @GetMapping("/sections-overview")
    fun getSectionsOverview(auth: Authentication): ResponseEntity<List<SectionOverviewResponse>> {
        val overview = dashboardService.getSectionsOverview(auth)
        return ResponseEntity.ok(overview)
    }

    @GetMapping("/subjects-by-grade")
    fun getSubjectsByGrade(auth: Authentication): ResponseEntity<List<SubjectsByGradeResponse>> {
        val data = dashboardService.getSubjectsByGrade(auth)
        return ResponseEntity.ok(data)
    }

    @GetMapping("/students-per-section")
    fun getStudentsPerSection(auth: Authentication): ResponseEntity<List<StudentsPerSectionResponse>> {
        val data = dashboardService.getStudentsPerSection(auth)
        return ResponseEntity.ok(data)
    }
}
