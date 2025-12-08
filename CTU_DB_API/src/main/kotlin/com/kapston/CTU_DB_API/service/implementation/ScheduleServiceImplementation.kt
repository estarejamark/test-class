package com.kapston.CTU_DB_API.service.implementation

import com.kapston.CTU_DB_API.CustomException.ScheduleConflictError
import com.kapston.CTU_DB_API.CustomException.ScheduleNotFoundError
import com.kapston.CTU_DB_API.CustomException.ScheduleSaveError
import com.kapston.CTU_DB_API.CustomException.TeacherScheduleError
import com.kapston.CTU_DB_API.domain.Enums.Quarter
import com.kapston.CTU_DB_API.domain.dto.request.CreateScheduleByIdRequest
import com.kapston.CTU_DB_API.domain.dto.request.ScheduleCreateRequest
import com.kapston.CTU_DB_API.domain.dto.request.ScheduleRequest
import com.kapston.CTU_DB_API.domain.dto.request.ScheduleUpdateRequest
import com.kapston.CTU_DB_API.domain.dto.request.UpdateScheduleByIdRequest
import com.kapston.CTU_DB_API.domain.dto.response.ScheduleConflictResponse
import com.kapston.CTU_DB_API.domain.dto.response.ScheduleResponse
import com.kapston.CTU_DB_API.domain.entity.ProfileEntity
import com.kapston.CTU_DB_API.domain.entity.ScheduleEntity
import com.kapston.CTU_DB_API.domain.entity.SectionEntity
import com.kapston.CTU_DB_API.domain.entity.SubjectEntity
import com.kapston.CTU_DB_API.repository.ProfileRepository
import com.kapston.CTU_DB_API.repository.ScheduleRepository
import com.kapston.CTU_DB_API.repository.SectionRepository
import com.kapston.CTU_DB_API.repository.SubjectRepository
import com.kapston.CTU_DB_API.service.abstraction.ScheduleService
import com.kapston.CTU_DB_API.service.abstraction.SettingsService
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import java.util.UUID

@Service
class ScheduleServiceImplementation(
    private val scheduleRepository: ScheduleRepository,
    private val profileRepository: ProfileRepository,
    private val subjectRepository: SubjectRepository,
    private val sectionRepository: SectionRepository,
    private val settingsService: SettingsService
) : ScheduleService {

    private fun formatTime(time: LocalDateTime): String {
        return time.format(DateTimeFormatter.ofPattern("HH:mm"))
    }

    private fun validateTimeGaps(
        existingSchedules: List<ScheduleEntity>,
        newStartTime: LocalDateTime,
        newEndTime: LocalDateTime
    ) {
        val minimumGapMinutes = 15L

        for (schedule in existingSchedules) {
            // Check if there's at least 15 minutes gap before and after each existing schedule
            if (
                (schedule.endTime.plusMinutes(minimumGapMinutes).isAfter(newStartTime) &&
                schedule.startTime.minusMinutes(minimumGapMinutes).isBefore(newEndTime))
            ) {
                throw TeacherScheduleError(
                    "Insufficient time gap between classes. There must be at least 15 minutes between classes. " +
                    "Conflicting schedule: ${schedule.subject.name} (${formatTime(schedule.startTime)}-${formatTime(schedule.endTime)})"
                )
            }
        }
    }

    @Transactional
    override fun save(scheduleRequest: ScheduleRequest): String {
        try {
            val teacherId = scheduleRequest.teacher.id
                ?: throw ScheduleSaveError("Teacher ID is required to create a schedule.")

            val conflictExists = scheduleRepository.hasScheduleExists(
                teacherId,
                scheduleRequest.subject.name,
                scheduleRequest.section.name,
                scheduleRequest.startTime,
                scheduleRequest.endTime
            )

            if (conflictExists) {
                throw ScheduleConflictError("The schedule cannot be created because it conflicts with an existing entry.")
            }

            scheduleRepository.save(scheduleRequest.toEntity())
            return "Schedule added successfully."
        } catch (e: Exception) {
            when (e) {
                is ScheduleSaveError, is ScheduleConflictError -> throw e
                else -> throw ScheduleSaveError("Failed to save schedule: ${e.message}")
            }
        }
    }

    @Transactional
    override fun saveByIds(scheduleRequest: CreateScheduleByIdRequest): String {
        try {
            // Fetch and validate teacher
            val teacher = profileRepository.findById(scheduleRequest.teacherId)
                .orElseThrow { ScheduleSaveError("Teacher with ID ${scheduleRequest.teacherId} not found.") }

            // Check teacher's total schedule count
            val teacherScheduleCount = scheduleRepository.countTeacherSchedules(scheduleRequest.teacherId) ?: 0
            if (teacherScheduleCount >= 30) {
                throw TeacherScheduleError(
                    "Cannot add more schedules for ${teacher.firstName} ${teacher.lastName}. " +
                    "Maximum number of schedules (30) has been reached."
                )
            }

            // Check teacher's schedule count for the specific day
            val teacherDaySchedules = scheduleRepository.findTeacherSchedulesByDay(
                scheduleRequest.teacherId
            )
            if (teacherDaySchedules.size >= 8) {
                throw TeacherScheduleError(
                    "Cannot add more schedules for ${teacher.firstName} ${teacher.lastName} on ${scheduleRequest.days}. " +
                    "Maximum number of schedules per day (8) has been reached."
                )
            }

            // Validate time gaps between classes
            validateTimeGaps(teacherDaySchedules, scheduleRequest.startTime, scheduleRequest.endTime)

            // Fetch subject and section
            val subject = subjectRepository.findById(scheduleRequest.subjectId)
                .orElseThrow { ScheduleSaveError("Subject with ID ${scheduleRequest.subjectId} not found.") }

            val section = sectionRepository.findById(scheduleRequest.sectionId)
                .orElseThrow { ScheduleSaveError("Section with ID ${scheduleRequest.sectionId} not found.") }

            // Check for conflicts
            // 1. Check for teacher schedule conflicts
            val teacherConflicts = scheduleRepository.findConflictingSchedulesIgnoringDays(
                scheduleRequest.teacherId,
                scheduleRequest.startTime,
                scheduleRequest.endTime
            )

            if (teacherConflicts.isNotEmpty()) {
                val conflictingClass = teacherConflicts.first()
                throw ScheduleConflictError(
                    "Schedule conflict: Teacher ${teacher.firstName} ${teacher.lastName} already has " +
                    "${conflictingClass.subject.name} class with ${conflictingClass.section.name} on " +
                    "${scheduleRequest.days} at ${formatTime(conflictingClass.startTime)}-${formatTime(conflictingClass.endTime)}"
                )
            }

            // 2. Check for section time conflicts
            val exactTimeConflict = scheduleRepository.hasExactTimeConflict(
                scheduleRequest.sectionId!!,
                scheduleRequest.days,
                scheduleRequest.startTime,
                scheduleRequest.endTime,
                scheduleRequest.teacherId
            )

            if (exactTimeConflict) {
                throw ScheduleConflictError(
                    "Schedule conflict: Section ${section.name} already has a different teacher scheduled " +
                    "on ${scheduleRequest.days} at ${formatTime(scheduleRequest.startTime)}-${formatTime(scheduleRequest.endTime)}. " +
                    "A section cannot have multiple teachers at the same time."
                )
            }

            val sectionTimeConflicts = scheduleRepository.findSectionTimeConflictsIgnoringDays(
                scheduleRequest.sectionId,
                scheduleRequest.startTime,
                scheduleRequest.endTime,
                scheduleRequest.teacherId
            )

            if (sectionTimeConflicts.isNotEmpty()) {
                val conflict = sectionTimeConflicts.first()
                throw ScheduleConflictError(
                    "Schedule conflict: Section ${section.name} is already occupied with " +
                    "${conflict.subject.name} (Teacher: ${conflict.teacher.firstName} ${conflict.teacher.lastName}) on " +
                    "${scheduleRequest.days} at ${formatTime(conflict.startTime)}-${formatTime(conflict.endTime)}. " +
                    "Please choose a different time slot."
                )
            }

            // 3. Check for duplicate subject-section combination on the same day
            val subjectSectionConflicts = scheduleRepository.findSubjectSectionConflicts(
                scheduleRequest.subjectId,
                scheduleRequest.sectionId,
                scheduleRequest.days
            )

            if (subjectSectionConflicts.isNotEmpty()) {
                throw ScheduleConflictError(
                    "Schedule conflict: Subject ${subject.name} is already assigned to " +
                    "section ${section.name} on ${scheduleRequest.days}"
                )
            }

            // 4. Check for general time slot conflicts
            val timeSlotConflicts = scheduleRepository.findTimeSlotConflicts(
                scheduleRequest.days,
                scheduleRequest.startTime,
                scheduleRequest.endTime
            )

            // Time slot conflicts are handled by validation logic above

            // Create the schedule entity
            val scheduleEntity = ScheduleEntity(
                teacher = teacher,
                subject = subject,
                section = section,
                schoolYearQuarter = scheduleRequest.schoolYearQuarter,
                days = scheduleRequest.days,
                startTime = scheduleRequest.startTime,
                endTime = scheduleRequest.endTime
            )

            scheduleRepository.save(scheduleEntity)
            return "Schedule added successfully."
        } catch (e: Exception) {
            when (e) {
                is ScheduleSaveError, is ScheduleConflictError -> throw e
                else -> throw ScheduleSaveError("Failed to save schedule: ${e.message}")
            }
        }
    }

    @Transactional(readOnly = true)
    override fun getAllSchedules(): List<ScheduleResponse> {
        return scheduleRepository.findAllWithDetails()
            .map { ScheduleResponse.fromEntity(it) }
    }

    @Transactional(readOnly = true)
    override fun getScheduleById(id: UUID): ScheduleResponse? {
        return scheduleRepository.findByIdWithDetails(id)
            ?.let { ScheduleResponse.fromEntity(it) }
    }

    @Transactional
    override fun updateSchedule(id: UUID, scheduleRequest: ScheduleRequest): ScheduleResponse {
        try {
            val existingSchedule = scheduleRepository.findById(id)
                .orElseThrow { ScheduleNotFoundError("Schedule with ID $id not found.") }

            val teacherId = scheduleRequest.teacher.id!!

            // Check teacher's schedule count for the specific day
            val teacherDaySchedules = scheduleRepository.findTeacherSchedulesByDay(
                teacherId
            ).filter { it.id != id } // Exclude current schedule

            if (teacherDaySchedules.size >= 8) {
                throw TeacherScheduleError(
                    "Cannot update schedule: Teacher ${scheduleRequest.teacher.firstName} ${scheduleRequest.teacher.lastName} " +
                    "would exceed maximum allowed schedules (8) on ${scheduleRequest.days}"
                )
            }

            // Validate time gaps between classes
            validateTimeGaps(teacherDaySchedules, scheduleRequest.startTime, scheduleRequest.endTime)

            // 1. Check for teacher schedule conflicts
            val teacherConflicts = scheduleRepository.findConflictingSchedulesIgnoringDays(
                teacherId,
                scheduleRequest.startTime,
                scheduleRequest.endTime
            ).filter { it.id != id } // Exclude current schedule

            if (teacherConflicts.isNotEmpty()) {
                val conflict = teacherConflicts.first()
                throw ScheduleConflictError(
                    "Schedule conflict: Teacher would have overlapping class with " +
                    "${conflict.subject.name} (Section: ${conflict.section.name}) on " +
                    "${scheduleRequest.days} at ${formatTime(conflict.startTime)}-${formatTime(conflict.endTime)}"
                )
            }

            // 2. Check for section time conflicts with different teachers
            val exactTimeConflict = scheduleRepository.hasExactTimeConflict(
                scheduleRequest.section.id ?: throw IllegalArgumentException("Section ID cannot be null"),
                scheduleRequest.days,
                scheduleRequest.startTime,
                scheduleRequest.endTime,
                teacherId
            )

            if (exactTimeConflict) {
                throw ScheduleConflictError(
                    "Schedule conflict: Section ${scheduleRequest.section.name} already has " +
                    "a different teacher scheduled at this time on ${scheduleRequest.days}"
                )
            }

            // Create a new ScheduleEntity with updated values instead of modifying the existing one
            val updatedScheduleEntity = scheduleRequest.toEntity(
                id = existingSchedule.id,
                createdAt = existingSchedule.createdAt
            )

            val savedEntity = scheduleRepository.save(updatedScheduleEntity)
            return ScheduleResponse.fromEntity(savedEntity)
        } catch (e: Exception) {
            when (e) {
                is ScheduleNotFoundError, is ScheduleSaveError, is ScheduleConflictError -> throw e
                is IllegalArgumentException -> throw ScheduleSaveError("Failed to update schedule: ${e.message}")
                else -> throw ScheduleSaveError("Failed to update schedule: ${e.message}")
            }
        }
    }

    @Transactional
    override fun updateScheduleByIds(id: UUID, scheduleRequest: UpdateScheduleByIdRequest): ScheduleResponse {
        try {
            val existingSchedule = scheduleRepository.findById(id)
                .orElseThrow { ScheduleNotFoundError("Schedule with ID $id not found.") }

            // Fetch the entities by their IDs
            val teacher = profileRepository.findById(scheduleRequest.teacherId)
                .orElseThrow { ScheduleSaveError("Teacher with ID ${scheduleRequest.teacherId} not found.") }

            val subject = subjectRepository.findById(scheduleRequest.subjectId)
                .orElseThrow { ScheduleSaveError("Subject with ID ${scheduleRequest.subjectId} not found.") }

            val section = sectionRepository.findById(scheduleRequest.sectionId)
                .orElseThrow { ScheduleSaveError("Section with ID ${scheduleRequest.sectionId} not found.") }

            // Check teacher's schedule count for the specific day
            val teacherDaySchedules = scheduleRepository.findTeacherSchedulesByDay(
                scheduleRequest.teacherId
            ).filter { it.id != id } // Exclude current schedule

            if (teacherDaySchedules.size >= 8) {
                throw TeacherScheduleError(
                    "Cannot update schedule: Teacher ${teacher.firstName} ${teacher.lastName} " +
                    "would exceed maximum allowed schedules (8) on ${scheduleRequest.days}"
                )
            }

            // Validate time gaps between classes
            validateTimeGaps(teacherDaySchedules, scheduleRequest.startTime, scheduleRequest.endTime)

            // 1. Check for teacher schedule conflicts
            val teacherConflicts = scheduleRepository.findConflictingSchedulesIgnoringDays(
                scheduleRequest.teacherId,
                scheduleRequest.startTime,
                scheduleRequest.endTime
            ).filter { it.id != id } // Exclude current schedule

            if (teacherConflicts.isNotEmpty()) {
                val conflict = teacherConflicts.first()
                throw ScheduleConflictError(
                    "Schedule conflict: Teacher ${teacher.firstName} ${teacher.lastName} would have overlapping class with " +
                    "${conflict.subject.name} (Section: ${conflict.section.name}) on " +
                    "${scheduleRequest.days} at ${formatTime(conflict.startTime)}-${formatTime(conflict.endTime)}"
                )
            }

            // 2. Check for section time conflicts
            val exactTimeConflict = scheduleRepository.hasExactTimeConflict(
                scheduleRequest.sectionId,
                scheduleRequest.days,
                scheduleRequest.startTime,
                scheduleRequest.endTime,
                scheduleRequest.teacherId
            )

            if (exactTimeConflict) {
                throw ScheduleConflictError(
                    "Schedule conflict: Section ${section.name} already has a different teacher scheduled " +
                    "on ${scheduleRequest.days} at ${formatTime(scheduleRequest.startTime)}-${formatTime(scheduleRequest.endTime)}. " +
                    "A section cannot have multiple teachers at the same time."
                )
            }

            // 3. Check for overlapping section times
            val sectionTimeConflicts = scheduleRepository.findSectionTimeConflictsIgnoringDays(
                scheduleRequest.sectionId,
                scheduleRequest.startTime,
                scheduleRequest.endTime,
                scheduleRequest.teacherId
            ).filter { it.id != id } // Exclude current schedule

            if (sectionTimeConflicts.isNotEmpty()) {
                val conflict = sectionTimeConflicts.first()
                throw ScheduleConflictError(
                    "Schedule conflict: Section ${section.name} is already occupied with " +
                    "${conflict.subject.name} (Teacher: ${conflict.teacher.firstName} ${conflict.teacher.lastName}) on " +
                    "${scheduleRequest.days} at ${formatTime(conflict.startTime)}-${formatTime(conflict.endTime)}. " +
                    "Please choose a different time slot."
                )
            }

            // 4. Check for duplicate subject-section combination
            val subjectSectionConflicts = scheduleRepository.findSubjectSectionConflicts(
                scheduleRequest.subjectId,
                scheduleRequest.sectionId,
                scheduleRequest.days
            ).filter { it.id != id } // Exclude current schedule

            if (subjectSectionConflicts.isNotEmpty()) {
                throw ScheduleConflictError(
                    "Schedule conflict: Subject ${subject.name} is already assigned to " +
                    "section ${section.name} on ${scheduleRequest.days}"
                )
            }

            // Check for conflicts, excluding the current schedule
            val conflictExists = scheduleRepository.hasScheduleExists(
                scheduleRequest.teacherId,
                subject.name,
                section.name,
                scheduleRequest.startTime,
                scheduleRequest.endTime
            )

            if (conflictExists) {
                // Additional check to ensure it's not the same schedule
                val currentSchedule = scheduleRepository.findByIdWithDetails(id)
                    ?: throw ScheduleNotFoundError("Schedule with ID $id not found.")
                val teacherId = currentSchedule.teacher.id ?: throw ScheduleSaveError("Teacher ID is null")
                if (teacherId != scheduleRequest.teacherId ||
                    currentSchedule.subject.name != subject.name ||
                    currentSchedule.section.name != section.name ||
                    currentSchedule.startTime != scheduleRequest.startTime ||
                    currentSchedule.endTime != scheduleRequest.endTime) {
                    throw ScheduleConflictError("The schedule cannot be updated because it conflicts with an existing entry.")
                }
            }

            // Create a new ScheduleEntity with updated values, preserving createdAt
            val updatedScheduleEntity = ScheduleEntity(
                id = existingSchedule.id,
                teacher = teacher,
                subject = subject,
                section = section,
                schoolYearQuarter = scheduleRequest.schoolYearQuarter,
                days = scheduleRequest.days,
                startTime = scheduleRequest.startTime,
                endTime = scheduleRequest.endTime,
                createdAt = existingSchedule.createdAt,
                updatedAt = LocalDateTime.now()
            )

            val savedEntity = scheduleRepository.save(updatedScheduleEntity)
            return ScheduleResponse.fromEntity(savedEntity)
        } catch (e: Exception) {
            when (e) {
                is ScheduleNotFoundError, is ScheduleSaveError, is ScheduleConflictError -> throw e
                is IllegalArgumentException -> throw ScheduleSaveError("Failed to update schedule: ${e.message}")
                else -> throw ScheduleSaveError("Failed to update schedule: ${e.message}")
            }
        }
    }

    @Transactional
    override fun deleteSchedule(id: UUID): String {
        try {
            val existingSchedule = scheduleRepository.findById(id)
                .orElseThrow { ScheduleNotFoundError("Schedule with ID $id not found.") }

            scheduleRepository.delete(existingSchedule)
            return "Schedule deleted successfully."
        } catch (e: Exception) {
            when (e) {
                is ScheduleNotFoundError -> throw e
                else -> throw ScheduleSaveError("Failed to delete schedule: ${e.message}")
            }
        }
    }

    @Transactional(readOnly = true)
    override fun getTeacherSchedules(teacherId: UUID): List<ScheduleResponse> {
        val scheduleEntities = scheduleRepository.findTeacherSchedules(teacherId)
        return scheduleEntities.map { ScheduleResponse.fromEntity(it) }
    }

    @Transactional(readOnly = true)
    override fun getSchedulesByTeacherId(teacherId: UUID): List<ScheduleResponse> {
        val scheduleEntities = scheduleRepository.findTeacherSchedules(teacherId)
        return scheduleEntities.map { ScheduleResponse.fromEntity(it) }
    }

    @Transactional(readOnly = true)
    override fun getTeacherSchedulesByQuarter(teacherId: UUID, quarter: Quarter?): List<ScheduleResponse> {
        val effectiveQuarter = quarter ?: settingsService.getActiveQuarter()?.quarter

        if (effectiveQuarter == null) return emptyList()

        val scheduleEntities = scheduleRepository.findTeacherSchedulesByQuarter(teacherId, effectiveQuarter)
        return scheduleEntities.map { ScheduleResponse.fromEntity(it) }
    }

    @Transactional(readOnly = true)
    override fun getAllSchedulesByQuarter(quarter: String?): List<ScheduleResponse> {
        val effectiveQuarter = quarter ?: settingsService.getActiveQuarter()?.quarter?.name

        if (effectiveQuarter == null) {
            return emptyList()
        }

        val scheduleEntities = scheduleRepository.findAllSchedulesByQuarter(effectiveQuarter)
        return scheduleEntities.map { ScheduleResponse.fromEntity(it) }
    }

    @Transactional(readOnly = true)
    override fun getSchedulesBySectionId(sectionId: UUID): List<ScheduleResponse> {
        val scheduleEntities = scheduleRepository.findSchedulesBySectionId(sectionId)
        return scheduleEntities.map { ScheduleResponse.fromEntity(it) }
    }

    @Transactional(readOnly = true)
    override fun getSchedulesBySubjectId(subjectId: UUID): List<ScheduleResponse> {
        val scheduleEntities = scheduleRepository.findSchedulesBySubjectId(subjectId)
        return scheduleEntities.map { ScheduleResponse.fromEntity(it) }
    }

    @Transactional(readOnly = true)
    override fun getSchedulesByDay(day: String): List<ScheduleResponse> {
        val scheduleEntities = scheduleRepository.findSchedulesByDay(day)
        return scheduleEntities.map { ScheduleResponse.fromEntity(it) }
    }

    @Transactional
    override fun createSchedule(scheduleRequest: ScheduleCreateRequest): ScheduleResponse {
        try {
            // Fetch and validate teacher
            val teacher = profileRepository.findById(scheduleRequest.teacherId)
                .orElseThrow { ScheduleSaveError("Teacher with ID ${scheduleRequest.teacherId} not found.") }

            // Check teacher's total schedule count
            val teacherScheduleCount = scheduleRepository.countTeacherSchedules(scheduleRequest.teacherId) ?: 0
            if (teacherScheduleCount >= 30) {
                throw TeacherScheduleError(
                    "Cannot add more schedules for ${teacher.firstName} ${teacher.lastName}. " +
                    "Maximum number of schedules (30) has been reached."
                )
            }

            // Check teacher's schedule count for the specific day
            val teacherDaySchedules = scheduleRepository.findTeacherSchedulesByDay(
                scheduleRequest.teacherId
            )
            if (teacherDaySchedules.size >= 8) {
                throw TeacherScheduleError(
                    "Cannot add more schedules for ${teacher.firstName} ${teacher.lastName} on ${scheduleRequest.days}. " +
                    "Maximum number of schedules per day (8) has been reached."
                )
            }

            // Validate time gaps between classes
            validateTimeGaps(teacherDaySchedules, scheduleRequest.startTime, scheduleRequest.endTime)

            // Fetch subject and section
            val subject = subjectRepository.findById(scheduleRequest.subjectId)
                .orElseThrow { ScheduleSaveError("Subject with ID ${scheduleRequest.subjectId} not found.") }

            val section = sectionRepository.findById(scheduleRequest.sectionId)
                .orElseThrow { ScheduleSaveError("Section with ID ${scheduleRequest.sectionId} not found.") }

            // Check for conflicts
            // 1. Check for teacher schedule conflicts
            val teacherConflicts = scheduleRepository.findConflictingSchedulesIgnoringDays(
                scheduleRequest.teacherId,
                scheduleRequest.startTime,
                scheduleRequest.endTime
            )

            if (teacherConflicts.isNotEmpty()) {
                val conflictingClass = teacherConflicts.first()
                throw ScheduleConflictError(
                    "Schedule conflict: Teacher ${teacher.firstName} ${teacher.lastName} already has " +
                    "${conflictingClass.subject.name} class with ${conflictingClass.section.name} on " +
                    "${scheduleRequest.days} at ${formatTime(conflictingClass.startTime)}-${formatTime(conflictingClass.endTime)}"
                )
            }

            // 2. Check for section time conflicts
            val exactTimeConflict = scheduleRepository.hasExactTimeConflict(
                scheduleRequest.sectionId,
                scheduleRequest.days,
                scheduleRequest.startTime,
                scheduleRequest.endTime,
                scheduleRequest.teacherId
            )

            if (exactTimeConflict) {
                throw ScheduleConflictError(
                    "Schedule conflict: Section ${section.name} already has a different teacher scheduled " +
                    "on ${scheduleRequest.days} at ${formatTime(scheduleRequest.startTime)}-${formatTime(scheduleRequest.endTime)}. " +
                    "A section cannot have multiple teachers at the same time."
                )
            }

            val sectionTimeConflicts = scheduleRepository.findSectionTimeConflictsIgnoringDays(
                scheduleRequest.sectionId,
                scheduleRequest.startTime,
                scheduleRequest.endTime,
                scheduleRequest.teacherId
            )

            if (sectionTimeConflicts.isNotEmpty()) {
                val conflict = sectionTimeConflicts.first()
                throw ScheduleConflictError(
                    "Schedule conflict: Section ${section.name} is already occupied with " +
                    "${conflict.subject.name} (Teacher: ${conflict.teacher.firstName} ${conflict.teacher.lastName}) on " +
                    "${scheduleRequest.days} at ${formatTime(conflict.startTime)}-${formatTime(conflict.endTime)}. " +
                    "Please choose a different time slot."
                )
            }

            // 3. Check for duplicate subject-section combination on the same day
            val subjectSectionConflicts = scheduleRepository.findSubjectSectionConflicts(
                scheduleRequest.subjectId,
                scheduleRequest.sectionId,
                scheduleRequest.days
            )

            if (subjectSectionConflicts.isNotEmpty()) {
                throw ScheduleConflictError(
                    "Schedule conflict: Subject ${subject.name} is already assigned to " +
                    "section ${section.name} on ${scheduleRequest.days}"
                )
            }

            // Create the schedule entity
            val scheduleEntity = ScheduleEntity(
                teacher = teacher,
                subject = subject,
                section = section,
                schoolYearQuarter = scheduleRequest.schoolYearQuarter,
                days = scheduleRequest.days,
                startTime = scheduleRequest.startTime,
                endTime = scheduleRequest.endTime
            )

            val savedEntity = scheduleRepository.save(scheduleEntity)
            return ScheduleResponse.fromEntity(savedEntity)
        } catch (e: Exception) {
            when (e) {
                is ScheduleSaveError, is ScheduleConflictError -> throw e
                else -> throw ScheduleSaveError("Failed to create schedule: ${e.message}")
            }
        }
    }

    @Transactional
    override fun updateSchedule(id: UUID, scheduleRequest: ScheduleUpdateRequest): ScheduleResponse {
        try {
            val existingSchedule = scheduleRepository.findById(id)
                .orElseThrow { ScheduleNotFoundError("Schedule with ID $id not found.") }

            // Fetch the entities by their IDs
            val teacher = profileRepository.findById(scheduleRequest.teacherId)
                .orElseThrow { ScheduleSaveError("Teacher with ID ${scheduleRequest.teacherId} not found.") }

            val subject = subjectRepository.findById(scheduleRequest.subjectId)
                .orElseThrow { ScheduleSaveError("Subject with ID ${scheduleRequest.subjectId} not found.") }

            val section = sectionRepository.findById(scheduleRequest.sectionId)
                .orElseThrow { ScheduleSaveError("Section with ID ${scheduleRequest.sectionId} not found.") }

            // Check teacher's schedule count for the specific day
            val teacherDaySchedules = scheduleRepository.findTeacherSchedulesByDay(
                scheduleRequest.teacherId
            )

            if (teacherDaySchedules.size >= 8) {
                throw TeacherScheduleError(
                    "Cannot update schedule: Teacher ${teacher.firstName} ${teacher.lastName} " +
                    "would exceed maximum allowed schedules (8) on ${scheduleRequest.days}"
                )
            }

            // Validate time gaps between classes
            validateTimeGaps(teacherDaySchedules, scheduleRequest.startTime, scheduleRequest.endTime)

            // 1. Check for teacher schedule conflicts
            val teacherConflicts = scheduleRepository.findConflictingSchedulesIgnoringDays(
                scheduleRequest.teacherId,
                scheduleRequest.startTime,
                scheduleRequest.endTime
            ).filter { it.id != id } // Exclude current schedule

            if (teacherConflicts.isNotEmpty()) {
                val conflict = teacherConflicts.first()
                throw ScheduleConflictError(
                    "Schedule conflict: Teacher ${teacher.firstName} ${teacher.lastName} would have overlapping class with " +
                    "${conflict.subject.name} (Section: ${conflict.section.name}) on " +
                    "${scheduleRequest.days} at ${formatTime(conflict.startTime)}-${formatTime(conflict.endTime)}"
                )
            }

            // 2. Check for section time conflicts
            val exactTimeConflict = scheduleRepository.hasExactTimeConflict(
                scheduleRequest.sectionId,
                scheduleRequest.days,
                scheduleRequest.startTime,
                scheduleRequest.endTime,
                scheduleRequest.teacherId
            )

            if (exactTimeConflict) {
                throw ScheduleConflictError(
                    "Schedule conflict: Section ${section.name} already has a different teacher scheduled " +
                    "on ${scheduleRequest.days} at ${formatTime(scheduleRequest.startTime)}-${formatTime(scheduleRequest.endTime)}. " +
                    "A section cannot have multiple teachers at the same time."
                )
            }

            // 3. Check for overlapping section times
            val sectionTimeConflicts = scheduleRepository.findSectionTimeConflictsIgnoringDays(
                scheduleRequest.sectionId,
                scheduleRequest.startTime,
                scheduleRequest.endTime,
                scheduleRequest.teacherId
            ).filter { it.id != id } // Exclude current schedule

            if (sectionTimeConflicts.isNotEmpty()) {
                val conflict = sectionTimeConflicts.first()
                throw ScheduleConflictError(
                    "Schedule conflict: Section ${section.name} is already occupied with " +
                    "${conflict.subject.name} (Teacher: ${conflict.teacher.firstName} ${conflict.teacher.lastName}) on " +
                    "${scheduleRequest.days} at ${formatTime(conflict.startTime)}-${formatTime(conflict.endTime)}. " +
                    "Please choose a different time slot."
                )
            }

            // 4. Check for duplicate subject-section combination
            val subjectSectionConflicts = scheduleRepository.findSubjectSectionConflicts(
                scheduleRequest.subjectId,
                scheduleRequest.sectionId,
                scheduleRequest.days
            ).filter { it.id != id } // Exclude current schedule

            if (subjectSectionConflicts.isNotEmpty()) {
                throw ScheduleConflictError(
                    "Schedule conflict: Subject ${subject.name} is already assigned to " +
                    "section ${section.name} on ${scheduleRequest.days}"
                )
            }

            // Create a new ScheduleEntity with updated values, preserving createdAt
            val updatedScheduleEntity = ScheduleEntity(
                id = existingSchedule.id,
                teacher = teacher,
                subject = subject,
                section = section,
                schoolYearQuarter = scheduleRequest.schoolYearQuarter,
                days = scheduleRequest.days,
                startTime = scheduleRequest.startTime,
                endTime = scheduleRequest.endTime,
                createdAt = existingSchedule.createdAt,
                updatedAt = LocalDateTime.now()
            )

            val savedEntity = scheduleRepository.save(updatedScheduleEntity)
            return ScheduleResponse.fromEntity(savedEntity)
        } catch (e: Exception) {
            when (e) {
                is ScheduleNotFoundError, is ScheduleSaveError, is ScheduleConflictError -> throw e
                is IllegalArgumentException -> throw ScheduleSaveError("Failed to update schedule: ${e.message}")
                else -> throw ScheduleSaveError("Failed to update schedule: ${e.message}")
            }
        }
    }

    @Transactional(readOnly = true)
    override fun checkScheduleConflicts(sectionId: UUID, day: String, startTime: String, endTime: String, excludeScheduleId: UUID?): List<ScheduleConflictResponse> {
        val start = LocalDateTime.parse(startTime)
        val end = LocalDateTime.parse(endTime)
        val conflicts = scheduleRepository.findSectionTimeConflictsIgnoringDays(sectionId, start, end, null)
            .filter { excludeScheduleId == null || it.id != excludeScheduleId }
            .map {
                ScheduleConflictResponse(
                    conflictingScheduleId = it.id!!,
                    teacherName = "${it.teacher.firstName} ${it.teacher.lastName}",
                    subjectName = it.subject.name,
                    sectionName = it.section.name,
                    days = it.days,
                    startTime = formatTime(it.startTime),
                    endTime = formatTime(it.endTime),
                    conflictReason = "Section time conflict"
                )
            }
        return conflicts
    }

    @Transactional(readOnly = true)
    override fun checkTeacherScheduleConflicts(teacherId: UUID, day: String, startTime: String, endTime: String, excludeScheduleId: UUID?): List<ScheduleConflictResponse> {
        val start = LocalDateTime.parse(startTime)
        val end = LocalDateTime.parse(endTime)
        val conflicts = scheduleRepository.findConflictingSchedulesIgnoringDays(teacherId, start, end)
            .filter { excludeScheduleId == null || it.id != excludeScheduleId }
            .map {
                ScheduleConflictResponse(
                    conflictingScheduleId = it.id!!,
                    teacherName = "${it.teacher.firstName} ${it.teacher.lastName}",
                    subjectName = it.subject.name,
                    sectionName = it.section.name,
                    days = it.days,
                    startTime = formatTime(it.startTime),
                    endTime = formatTime(it.endTime),
                    conflictReason = "Teacher schedule conflict"
                )
            }
        return conflicts
    }

    @Transactional(readOnly = true)
    override fun checkRoomScheduleConflicts(roomId: UUID, day: String, startTime: String, endTime: String, excludeScheduleId: UUID?): List<ScheduleConflictResponse> {
        // Assuming room conflicts are similar to section conflicts, as sections might imply rooms
        // If there's a separate room entity, this needs adjustment
        val start = LocalDateTime.parse(startTime)
        val end = LocalDateTime.parse(endTime)
        val conflicts = scheduleRepository.findSectionTimeConflictsIgnoringDays(roomId, start, end, null)
            .filter { excludeScheduleId == null || it.id != excludeScheduleId }
            .map {
                ScheduleConflictResponse(
                    conflictingScheduleId = it.id!!,
                    teacherName = "${it.teacher.firstName} ${it.teacher.lastName}",
                    subjectName = it.subject.name,
                    sectionName = it.section.name,
                    days = it.days,
                    startTime = formatTime(it.startTime),
                    endTime = formatTime(it.endTime),
                    conflictReason = "Room schedule conflict"
                )
            }
        return conflicts
    }

    @Transactional(readOnly = true)
    override fun getSchedulesByTeacher(teacherId: UUID): List<ScheduleResponse> {
        return getTeacherSchedules(teacherId)
    }

    @Transactional(readOnly = true)
    override fun getSchedulesByAdviser(adviserId: UUID): List<ScheduleResponse> {
        val adviserSections = sectionRepository.findByAdviserId(adviserId)
        val sectionIds = adviserSections.mapNotNull { it.id }
        return sectionIds.flatMap { scheduleRepository.findSchedulesBySectionId(it) }
            .map { ScheduleResponse.fromEntity(it) }
    }
}
