package com.kapston.CTU_DB_API.repository

import com.kapston.CTU_DB_API.domain.entity.AttendanceEntity
import com.kapston.CTU_DB_API.domain.entity.ProfileEntity
import com.kapston.CTU_DB_API.domain.entity.SectionEntity
import com.kapston.CTU_DB_API.domain.entity.SubjectEntity
import com.kapston.CTU_DB_API.domain.Enums.Quarter
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.LocalDate
import java.util.*

@Repository
interface AttendanceRepository : JpaRepository<AttendanceEntity, UUID> {
    @Query("SELECT a FROM AttendanceEntity a WHERE a.student.id = :studentId AND a.section.id = :sectionId AND a.attendanceDate = :attendanceDate AND a.quarter = :quarter")
    fun findByStudent_IdAndSection_IdAndAttendanceDateAndQuarter(
        @Param("studentId") studentId: UUID,
        @Param("sectionId") sectionId: UUID,
        @Param("attendanceDate") attendanceDate: LocalDate,
        @Param("quarter") quarter: Quarter
    ): AttendanceEntity?

    @Query("SELECT a FROM AttendanceEntity a WHERE a.section.id = :sectionId AND a.quarter = :quarter AND a.attendanceDate BETWEEN :startDate AND :endDate")
    fun findBySection_IdAndQuarterAndAttendanceDateBetween(
        @Param("sectionId") sectionId: UUID,
        @Param("quarter") quarter: Quarter,
        @Param("startDate") startDate: LocalDate,
        @Param("endDate") endDate: LocalDate
    ): List<AttendanceEntity>

    @Query("SELECT a FROM AttendanceEntity a WHERE a.section.id = :sectionId AND a.quarter = :quarter")
    fun findBySection_IdAndQuarter(
        @Param("sectionId") sectionId: UUID,
        @Param("quarter") quarter: Quarter
    ): List<AttendanceEntity>

    @Query("SELECT a FROM AttendanceEntity a WHERE a.student.id = :studentId AND a.section.id = :sectionId AND a.quarter = :quarter")
    fun findByStudent_IdAndSection_IdAndQuarter(
        @Param("studentId") studentId: UUID,
        @Param("sectionId") sectionId: UUID,
        @Param("quarter") quarter: Quarter
    ): List<AttendanceEntity>

    @Query("SELECT a FROM AttendanceEntity a WHERE a.section.id = :sectionId AND a.attendanceDate = :attendanceDate AND a.quarter = :quarter")
    fun findBySection_IdAndAttendanceDateAndQuarter(
        @Param("sectionId") sectionId: UUID,
        @Param("attendanceDate") attendanceDate: LocalDate,
        @Param("quarter") quarter: Quarter
    ): List<AttendanceEntity>
}
