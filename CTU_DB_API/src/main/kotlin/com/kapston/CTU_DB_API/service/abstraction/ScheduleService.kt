package com.kapston.CTU_DB_API.service.abstraction

import com.kapston.CTU_DB_API.domain.Enums.Quarter
import com.kapston.CTU_DB_API.domain.dto.request.CreateScheduleByIdRequest
import com.kapston.CTU_DB_API.domain.dto.request.ScheduleCreateRequest
import com.kapston.CTU_DB_API.domain.dto.request.ScheduleRequest
import com.kapston.CTU_DB_API.domain.dto.request.ScheduleUpdateRequest
import com.kapston.CTU_DB_API.domain.dto.request.UpdateScheduleByIdRequest
import com.kapston.CTU_DB_API.domain.dto.response.ScheduleConflictResponse
import com.kapston.CTU_DB_API.domain.dto.response.ScheduleResponse
import java.util.UUID

interface ScheduleService {
    fun save(scheduleRequest: ScheduleRequest): String
    fun saveByIds(scheduleRequest: CreateScheduleByIdRequest): String
    fun getAllSchedules(): List<ScheduleResponse>
    fun getScheduleById(id: UUID): ScheduleResponse?
    fun updateSchedule(id: UUID, scheduleRequest: ScheduleRequest): ScheduleResponse
    fun updateScheduleByIds(id: UUID, scheduleRequest: UpdateScheduleByIdRequest): ScheduleResponse
    fun deleteSchedule(id: UUID): String
    fun getTeacherSchedules(teacherId: UUID): List<ScheduleResponse>
    fun getTeacherSchedulesByQuarter(teacherId: UUID, quarter: Quarter?): List<ScheduleResponse>
    fun getAllSchedulesByQuarter(quarter: String?): List<ScheduleResponse>
    fun getSchedulesBySectionId(sectionId: UUID): List<ScheduleResponse>

    fun getSchedulesBySubjectId(subjectId: UUID): List<ScheduleResponse>
    fun getSchedulesByDay(day: String): List<ScheduleResponse>
    fun getSchedulesByTeacherId(teacherId: UUID): List<ScheduleResponse>
    fun createSchedule(scheduleRequest: ScheduleCreateRequest): ScheduleResponse
    fun updateSchedule(id: UUID, scheduleRequest: ScheduleUpdateRequest): ScheduleResponse
    fun checkScheduleConflicts(sectionId: UUID, day: String, startTime: String, endTime: String, excludeScheduleId: UUID?): List<ScheduleConflictResponse>
    fun checkTeacherScheduleConflicts(teacherId: UUID, day: String, startTime: String, endTime: String, excludeScheduleId: UUID?): List<ScheduleConflictResponse>
    fun checkRoomScheduleConflicts(roomId: UUID, day: String, startTime: String, endTime: String, excludeScheduleId: UUID?): List<ScheduleConflictResponse>
    fun getSchedulesByTeacher(teacherId: UUID): List<ScheduleResponse>
    fun getSchedulesByAdviser(adviserId: UUID): List<ScheduleResponse>
}
