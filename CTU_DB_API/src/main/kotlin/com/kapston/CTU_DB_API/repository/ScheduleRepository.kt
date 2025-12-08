package com.kapston.CTU_DB_API.repository

import com.kapston.CTU_DB_API.domain.entity.ScheduleEntity
import com.kapston.CTU_DB_API.domain.Enums.Quarter
import com.kapston.CTU_DB_API.model.SchoolYearQuarter
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.LocalDateTime
import java.util.UUID

interface ScheduleRepository : JpaRepository<ScheduleEntity, UUID> {

    // Count teacher schedules
    @Query("""
        SELECT COUNT(s) 
        FROM ScheduleEntity s 
        WHERE s.teacher.id = :teacherId
    """)
    fun countTeacherSchedules(@Param("teacherId") teacherId: UUID): Int

    // Teacher schedules by day - removed exact days filter for improved overlap checks
    @Query("""
        SELECT s 
        FROM ScheduleEntity s 
        WHERE s.teacher.id = :teacherId
        ORDER BY s.startTime
    """)
    fun findTeacherSchedulesByDay(
        @Param("teacherId") teacherId: UUID
    ): List<ScheduleEntity>

    // Conflicting schedules (overlaps), ignoring days filter for post-filtering in service layer
    @Query("""
        SELECT s FROM ScheduleEntity s
        WHERE s.teacher.id = :teacherId
        AND (s.startTime < :endTime AND s.endTime > :startTime)
    """)
    fun findConflictingSchedulesIgnoringDays(
        @Param("teacherId") teacherId: UUID,
        @Param("startTime") startTime: LocalDateTime,
        @Param("endTime") endTime: LocalDateTime
    ): List<ScheduleEntity>

    // Conflicting schedules (overlaps), ignoring days, excluding specific schedule for update
    @Query("""
        SELECT s FROM ScheduleEntity s
        WHERE s.teacher.id = :teacherId
        AND (s.startTime < :endTime AND s.endTime > :startTime)
        AND s.id <> :excludeScheduleId
    """)
    fun findConflictingSchedulesIgnoringDaysExcludingSchedule(
        @Param("teacherId") teacherId: UUID,
        @Param("startTime") startTime: LocalDateTime,
        @Param("endTime") endTime: LocalDateTime,
        @Param("excludeScheduleId") excludeScheduleId: UUID
    ): List<ScheduleEntity>

    // Section conflict checker - removed exact days filter for improved overlap checks
    @Query("""
        SELECT s FROM ScheduleEntity s
        WHERE s.section.id = :sectionId
        AND (s.startTime < :endTime AND s.endTime > :startTime)
        AND (:excludeTeacherId IS NULL OR s.teacher.id != :excludeTeacherId)
    """)
    fun findSectionTimeConflictsIgnoringDays(
        @Param("sectionId") sectionId: UUID,
        @Param("startTime") startTime: LocalDateTime,
        @Param("endTime") endTime: LocalDateTime,
        @Param("excludeTeacherId") excludeTeacherId: UUID? = null
    ): List<ScheduleEntity>

    // Exact time conflict (unchanged)
    @Query("""
        SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END
        FROM ScheduleEntity s
        WHERE s.section.id = :sectionId
        AND s.days = :days
        AND s.startTime = :startTime
        AND s.endTime = :endTime
        AND s.teacher.id != :excludeTeacherId
    """)
    fun hasExactTimeConflict(
        @Param("sectionId") sectionId: UUID,
        @Param("days") days: String,
        @Param("startTime") startTime: LocalDateTime,
        @Param("endTime") endTime: LocalDateTime,
        @Param("excludeTeacherId") excludeTeacherId: UUID
    ): Boolean


    // Subject + section conflict
    @Query("""
        SELECT s FROM ScheduleEntity s
        WHERE s.subject.id = :subjectId
        AND s.section.id = :sectionId
        AND s.days = :days
    """)
    fun findSubjectSectionConflicts(
        @Param("subjectId") subjectId: UUID,
        @Param("sectionId") sectionId: UUID,
        @Param("days") days: String
    ): List<ScheduleEntity>


    // Time slot conflicts
    @Query("""
        SELECT s FROM ScheduleEntity s
        WHERE s.days = :days
        AND (s.startTime < :endTime AND s.endTime > :startTime)
    """)
    fun findTimeSlotConflicts(
        @Param("days") days: String,
        @Param("startTime") startTime: LocalDateTime,
        @Param("endTime") endTime: LocalDateTime
    ): List<ScheduleEntity>


    // Fetch all schedules with teacher+subject+section
    @Query("""
        SELECT s FROM ScheduleEntity s
        LEFT JOIN FETCH s.teacher
        LEFT JOIN FETCH s.subject
        LEFT JOIN FETCH s.section
    """)
    fun findAllWithDetails(): List<ScheduleEntity>


    // Fetch one schedule with details
    @Query("""
        SELECT s FROM ScheduleEntity s
        LEFT JOIN FETCH s.teacher
        LEFT JOIN FETCH s.subject
        LEFT JOIN FETCH s.section
        WHERE s.id = :id
    """)
    fun findByIdWithDetails(@Param("id") id: UUID): ScheduleEntity?


    // Prevent duplicate schedule
    @Query("""
        SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END
        FROM ScheduleEntity s
        WHERE s.teacher.id = :teacherId
        AND s.subject.name = :subjectName
        AND s.section.name = :sectionName
        AND s.startTime = :startTime
        AND s.endTime = :endTime
    """)
    fun hasScheduleExists(
        @Param("teacherId") teacherId: UUID,
        @Param("subjectName") subjectName: String,
        @Param("sectionName") sectionName: String,
        @Param("startTime") startTime: LocalDateTime,
        @Param("endTime") endTime: LocalDateTime
    ): Boolean


    // Teacher schedules (all)
    @Query("""
        SELECT s FROM ScheduleEntity s
        LEFT JOIN FETCH s.teacher
        LEFT JOIN FETCH s.subject
        LEFT JOIN FETCH s.section
        WHERE s.teacher.id = :teacherId
        ORDER BY s.days, s.startTime
    """)
    fun findTeacherSchedules(@Param("teacherId") teacherId: UUID): List<ScheduleEntity>


    // Teacher schedules filtered by quarter
    @Query("""
        SELECT s FROM ScheduleEntity s
        LEFT JOIN FETCH s.teacher
        LEFT JOIN FETCH s.subject
        LEFT JOIN FETCH s.section
        WHERE s.teacher.id = :teacherId
        AND (
            :quarter IS NULL OR
            EXISTS (
                SELECT q FROM SchoolYearQuarter q
                WHERE q.schoolYear.isActive = true
                AND q.quarter = :quarter
                AND s.startTime >= q.startDate
                AND s.endTime <= q.endDate
            )
        )
        ORDER BY s.days, s.startTime
    """)
    fun findTeacherSchedulesByQuarter(
        @Param("teacherId") teacherId: UUID,
        @Param("quarter") quarter: Quarter?
    ): List<ScheduleEntity>

    // All schedules filtered by quarter
    @Query("""
        SELECT s FROM ScheduleEntity s
        LEFT JOIN FETCH s.teacher
        LEFT JOIN FETCH s.subject
        LEFT JOIN FETCH s.section
        WHERE (
            :quarter IS NULL OR
            EXISTS (
                SELECT q FROM SchoolYearQuarter q
                WHERE q.schoolYear.isActive = true
                AND q.quarter = :quarter
                AND s.startTime >= q.startDate
                AND s.endTime <= q.endDate
            )
        )
        ORDER BY s.days, s.startTime
    """)
    fun findAllSchedulesByQuarter(@Param("quarter") quarter: String?): List<ScheduleEntity>

    // By section
    @Query("""
        SELECT s FROM ScheduleEntity s
        LEFT JOIN FETCH s.teacher
        LEFT JOIN FETCH s.subject
        LEFT JOIN FETCH s.section
        WHERE s.section.id = :sectionId
    """)
    fun findSchedulesBySectionId(@Param("sectionId") sectionId: UUID): List<ScheduleEntity>


    // By subject
    @Query("""
        SELECT s FROM ScheduleEntity s
        LEFT JOIN FETCH s.teacher
        LEFT JOIN FETCH s.subject
        LEFT JOIN FETCH s.section
        WHERE s.subject.id = :subjectId
    """)
    fun findSchedulesBySubjectId(@Param("subjectId") subjectId: UUID): List<ScheduleEntity>


    // By day
    @Query("""
        SELECT s FROM ScheduleEntity s
        LEFT JOIN FETCH s.teacher
        LEFT JOIN FETCH s.subject
        LEFT JOIN FETCH s.section
        WHERE s.days = :day
    """)
    fun findSchedulesByDay(@Param("day") day: String): List<ScheduleEntity>
}
