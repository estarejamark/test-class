package com.kapston.CTU_DB_API.service.implementation

import com.kapston.CTU_DB_API.domain.Enums.Quarter
import com.kapston.CTU_DB_API.domain.dto.request.BulkAttendanceRequest
import com.kapston.CTU_DB_API.domain.dto.response.AttendanceResponse
import com.kapston.CTU_DB_API.domain.entity.AttendanceEntity
import com.kapston.CTU_DB_API.repository.AttendanceRepository
import com.kapston.CTU_DB_API.repository.ProfileRepository
import com.kapston.CTU_DB_API.repository.SectionRepository
import com.kapston.CTU_DB_API.service.abstraction.AttendanceService
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.Month
import java.util.*

@Service
class AttendanceServiceImplementation(
    private val attendanceRepository: AttendanceRepository,
    private val profileRepository: ProfileRepository,
    private val sectionRepository: SectionRepository,
    private val userRepository: com.kapston.CTU_DB_API.repository.UserRepository
) : AttendanceService {

    private fun getCurrentQuarter(date: LocalDate): Quarter {
        return when (date.month) {
            Month.JANUARY, Month.FEBRUARY, Month.MARCH -> Quarter.Q1
            Month.APRIL, Month.MAY, Month.JUNE -> Quarter.Q2
            Month.JULY, Month.AUGUST, Month.SEPTEMBER -> Quarter.Q3
            Month.OCTOBER, Month.NOVEMBER, Month.DECEMBER -> Quarter.Q4
        }
    }

    @Transactional
    override fun recordAttendance(
        studentId: UUID,
        sectionId: UUID,
        quarter: String,
        attendanceDate: LocalDate,
        status: String
    ): AttendanceResponse {
        val student = profileRepository.findById(studentId)
            .orElseThrow { IllegalArgumentException("Student not found") }

        val section = sectionRepository.findById(sectionId)
            .orElseThrow { IllegalArgumentException("Section not found") }

        // Check for existing attendance record
        val existingAttendance = attendanceRepository.findByStudent_IdAndSection_IdAndAttendanceDateAndQuarter(
            studentId, sectionId, attendanceDate, Quarter.fromString(quarter.toString())
        )

        if (existingAttendance != null) {
            // Update existing record
            existingAttendance.status = com.kapston.CTU_DB_API.domain.Enums.AttendanceStatus.valueOf(status.toString().uppercase())
            existingAttendance.updatedAt = java.time.LocalDateTime.now()
            val saved = attendanceRepository.save(existingAttendance)
            return saved.toResponse()
        }

        // Create new record
        val attendance = AttendanceEntity(
            student = student,
            section = section,
            quarter = Quarter.fromString(quarter.toString()),
            attendanceDate = attendanceDate,
            status = com.kapston.CTU_DB_API.domain.Enums.AttendanceStatus.valueOf(status.toString().uppercase())
        )

        val saved = attendanceRepository.save(attendance)
        return saved.toResponse()
    }

    @Transactional
    override fun recordBulkAttendance(request: BulkAttendanceRequest): List<AttendanceResponse> {
        val section = sectionRepository.findById(request.sectionId)
            .orElseThrow { IllegalArgumentException("Section not found") }

        val quarterEnum = Quarter.fromString(request.quarter.toString())
        val responses = mutableListOf<AttendanceResponse>()

        for (record in request.attendanceRecords) {
            val user = userRepository.findById(record.studentId)
                .orElseThrow { IllegalArgumentException("Student not found: ${record.studentId}") }
            val student = user.profile ?: throw IllegalArgumentException("Student profile not found: ${record.studentId}")

            // Check for existing attendance record
            val existingAttendance = attendanceRepository.findByStudent_IdAndSection_IdAndAttendanceDateAndQuarter(
                student.id!!, request.sectionId, request.attendanceDate, quarterEnum
            )

            if (existingAttendance != null) {
                // Update existing record
            existingAttendance.status = com.kapston.CTU_DB_API.domain.Enums.AttendanceStatus.valueOf(record.status.toString().uppercase())
                existingAttendance.updatedAt = java.time.LocalDateTime.now()
                val saved = attendanceRepository.save(existingAttendance)
                responses.add(saved.toResponse())
            } else {
                // Create new record
                val attendance = AttendanceEntity(
                    student = student,
                    section = section,
                    quarter = quarterEnum,
                    attendanceDate = request.attendanceDate,
                    status = com.kapston.CTU_DB_API.domain.Enums.AttendanceStatus.valueOf(record.status.toString().uppercase())
                )
                val saved = attendanceRepository.save(attendance)
                responses.add(saved.toResponse())
            }
        }

        return responses
    }

    @Transactional(readOnly = true)
    override fun getAttendanceForSection(
        sectionId: UUID,
        quarter: String,
        startDate: LocalDate?,
        endDate: LocalDate?
    ): List<AttendanceResponse> {
        val quarterEnum = Quarter.fromString(quarter.toString())
        return if (startDate != null && endDate != null) {
            attendanceRepository.findBySection_IdAndQuarterAndAttendanceDateBetween(sectionId, quarterEnum, startDate, endDate)
        } else {
            attendanceRepository.findBySection_IdAndQuarter(sectionId, quarterEnum)
        }.map { it.toResponse() }
    }

    @Transactional(readOnly = true)
    override fun getSectionAttendanceByDate(
        sectionId: UUID,
        attendanceDate: LocalDate,
        quarter: String
    ): List<AttendanceResponse> {
        val quarterEnum = Quarter.fromString(quarter.toString())
        return attendanceRepository.findBySection_IdAndAttendanceDateAndQuarter(sectionId, attendanceDate, quarterEnum)
            .map { it.toResponse() }
    }

    @Transactional(readOnly = true)
    override fun getStudentAttendance(
        studentId: UUID,
        sectionId: UUID,
        quarter: String
    ): List<AttendanceResponse> {
        val quarterEnum = Quarter.fromString(quarter.toString())
        return attendanceRepository.findByStudent_IdAndSection_IdAndQuarter(studentId, sectionId, quarterEnum)
            .map { it.toResponse() }
    }

    @Transactional
    override fun updateAttendance(attendanceId: UUID, status: String): AttendanceResponse {
        val attendance = attendanceRepository.findById(attendanceId)
            .orElseThrow { IllegalArgumentException("Attendance record not found") }

        attendance.status = com.kapston.CTU_DB_API.domain.Enums.AttendanceStatus.valueOf(status.toString().uppercase())
        attendance.updatedAt = java.time.LocalDateTime.now()

        val saved = attendanceRepository.save(attendance)
        return saved.toResponse()
    }

    @Transactional
    override fun deleteAttendance(attendanceId: UUID) {
        if (!attendanceRepository.existsById(attendanceId)) {
            throw IllegalArgumentException("Attendance record not found")
        }
        attendanceRepository.deleteById(attendanceId)
    }

    private fun AttendanceEntity.toResponse(): AttendanceResponse = AttendanceResponse(
        id = id!!,
        studentId = student.id!!,
        studentName = "${student.firstName} ${student.lastName}",
        sectionId = section.id!!,
        sectionName = section.name,
        quarter = quarter,
        attendanceDate = attendanceDate,
        status = status,
        createdAt = createdAt!!,
        updatedAt = updatedAt
    )
}
