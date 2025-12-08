package com.kapston.CTU_DB_API.controller

import com.kapston.CTU_DB_API.domain.Enums.Quarter
import com.kapston.CTU_DB_API.domain.dto.request.ScheduleCreateRequest
import com.kapston.CTU_DB_API.domain.dto.request.ScheduleUpdateRequest
import com.kapston.CTU_DB_API.domain.dto.response.*
import com.kapston.CTU_DB_API.service.abstraction.ScheduleService
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import java.util.*

@RestController
@RequestMapping("/api/schedules")
@PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
class ScheduleController(
    private val scheduleService: ScheduleService
) {

    @GetMapping
    fun getAllSchedules(): ResponseEntity<List<ScheduleResponse>> {
        val schedules = scheduleService.getAllSchedules()
        return ResponseEntity.ok(schedules)
    }

    @GetMapping("/{id}")
    fun getScheduleById(@PathVariable id: UUID): ResponseEntity<ScheduleResponse> {
        val schedule = scheduleService.getScheduleById(id)
        return if (schedule != null) {
            ResponseEntity.ok(schedule)
        } else {
            ResponseEntity.notFound().build()
        }
    }

    @GetMapping("/section/{sectionId}")
    fun getSchedulesBySectionId(@PathVariable sectionId: UUID): ResponseEntity<List<ScheduleResponse>> {
        val schedules = scheduleService.getSchedulesBySectionId(sectionId)
        return ResponseEntity.ok(schedules)
    }

    @GetMapping("/teacher/{teacherId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'ADVISER')")
    fun getSchedulesByTeacherId(
        @PathVariable teacherId: UUID
    ): ResponseEntity<List<ScheduleResponse>> {
        val schedules = scheduleService.getSchedulesByTeacherId(teacherId)
        return ResponseEntity.ok(schedules)
    }

    @GetMapping("/teacher/{teacherId}/quarter")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'ADVISER')")
    fun getTeacherSchedulesByQuarter(
        @PathVariable teacherId: UUID,
        @RequestParam(required = false) quarter: Quarter?
    ): ResponseEntity<List<ScheduleResponse>> {
        val schedules = scheduleService.getTeacherSchedulesByQuarter(teacherId, quarter)
        return ResponseEntity.ok(schedules)
    }

    @GetMapping("/subject/{subjectId}")
    fun getSchedulesBySubjectId(@PathVariable subjectId: UUID): ResponseEntity<List<ScheduleResponse>> {
        val schedules = scheduleService.getSchedulesBySubjectId(subjectId)
        return ResponseEntity.ok(schedules)
    }

    @GetMapping("/day/{day}")
    fun getSchedulesByDay(@PathVariable day: String): ResponseEntity<List<ScheduleResponse>> {
        val schedules = scheduleService.getSchedulesByDay(day)
        return ResponseEntity.ok(schedules)
    }

    @GetMapping("/quarter/{quarter}")
    @PreAuthorize("hasRole('ADMIN')")
    fun getAllSchedulesByQuarter(@PathVariable quarter: Quarter): ResponseEntity<List<ScheduleResponse>> {
        val schedules = scheduleService.getAllSchedulesByQuarter(quarter.name) // Convert enum to String
        return ResponseEntity.ok(schedules)
    }

    @PostMapping
    fun createSchedule(@RequestBody scheduleRequest: ScheduleCreateRequest): ResponseEntity<ScheduleResponse> {
        val schedule = scheduleService.createSchedule(scheduleRequest)
        return ResponseEntity.ok(schedule)
    }

    @PutMapping("/{id}")
    fun updateSchedule(@PathVariable id: UUID, @RequestBody scheduleRequest: ScheduleUpdateRequest): ResponseEntity<ScheduleResponse> {
        val schedule = scheduleService.updateSchedule(id, scheduleRequest)
        return ResponseEntity.ok(schedule)
    }

    @DeleteMapping("/{id}")
    fun deleteSchedule(@PathVariable id: UUID): ResponseEntity<Void> {
        scheduleService.deleteSchedule(id)
        return ResponseEntity.noContent().build()
    }

    @GetMapping("/conflicts")
    fun checkScheduleConflicts(
        @RequestParam sectionId: UUID,
        @RequestParam day: String,
        @RequestParam startTime: String,
        @RequestParam endTime: String,
        @RequestParam(required = false) excludeScheduleId: UUID?
    ): ResponseEntity<List<ScheduleConflictResponse>> {
        val conflicts = scheduleService.checkScheduleConflicts(sectionId, day, startTime, endTime, excludeScheduleId)
        return ResponseEntity.ok(conflicts)
    }

    @GetMapping("/teacher-conflicts")
    fun checkTeacherScheduleConflicts(
        @RequestParam teacherId: UUID,
        @RequestParam day: String,
        @RequestParam startTime: String,
        @RequestParam endTime: String,
        @RequestParam(required = false) excludeScheduleId: UUID?
    ): ResponseEntity<List<ScheduleConflictResponse>> {
        val conflicts = scheduleService.checkTeacherScheduleConflicts(teacherId, day, startTime, endTime, excludeScheduleId)
        return ResponseEntity.ok(conflicts)
    }

    @GetMapping("/room-conflicts")
    fun checkRoomScheduleConflicts(
        @RequestParam roomId: UUID,
        @RequestParam day: String,
        @RequestParam startTime: String,
        @RequestParam endTime: String,
        @RequestParam(required = false) excludeScheduleId: UUID?
    ): ResponseEntity<List<ScheduleConflictResponse>> {
        val conflicts = scheduleService.checkRoomScheduleConflicts(roomId, day, startTime, endTime, excludeScheduleId)
        return ResponseEntity.ok(conflicts)
    }
}
