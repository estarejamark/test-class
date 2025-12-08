package com.kapston.CTU_DB_API.repository

import com.kapston.CTU_DB_API.domain.entity.AttendanceEntity
import com.kapston.CTU_DB_API.domain.entity.FeedbackEntity
import com.kapston.CTU_DB_API.domain.entity.GradeEntity
import com.kapston.CTU_DB_API.domain.entity.ScheduleEntity
import com.kapston.CTU_DB_API.model.SchoolYearQuarter
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.LocalDate
import java.util.*

@Repository
interface ReportsRepository : JpaRepository<GradeEntity, UUID> {

    // Grade Reports
    @Query("""
        SELECT g.subject.name as subjectName,
               AVG(g.score) as averageGrade,
               COUNT(CASE WHEN g.score >= 75 THEN 1 END) as passingCount,
               COUNT(g) as totalCount,
               MIN(g.score) as lowestGrade,
               MAX(g.score) as highestGrade
        FROM GradeEntity g
        WHERE g.section = :sectionId
        AND g.quarter = :quarter
        GROUP BY g.subject.id, g.subject.name
        ORDER BY g.subject.name
    """)
    fun getGradeSummaryBySectionAndQuarter(
        @Param("sectionId") sectionId: UUID,
        @Param("quarter") quarter: String
    ): List<Array<Any>>

    @Query("""
        SELECT g.quarter as quarter,
               AVG(g.score) as averageGrade,
               COUNT(CASE WHEN g.score >= 75 THEN 1 END) as passingCount,
               COUNT(g) as totalCount
        FROM GradeEntity g
        WHERE g.section = :sectionId
        GROUP BY g.quarter
        ORDER BY g.quarter
    """)
    fun getGradeTrendsBySection(
        @Param("sectionId") sectionId: UUID
    ): List<Array<Any>>

    // Attendance Reports
    @Query("""
        SELECT a.student.id as studentId,
               CONCAT(a.student.firstName, ' ', a.student.lastName) as studentName,
               COUNT(CASE WHEN a.status = 'PRESENT' THEN 1 END) as presentCount,
               COUNT(CASE WHEN a.status = 'ABSENT' THEN 1 END) as absentCount,
               COUNT(CASE WHEN a.status = 'LATE' THEN 1 END) as lateCount,
               COUNT(a) as totalDays,
               ROUND((COUNT(CASE WHEN a.status = 'PRESENT' THEN 1 END) * 100.0) / COUNT(a), 2) as attendanceRate
        FROM AttendanceEntity a
        WHERE a.section = :sectionId
        AND a.quarter = :quarter
        GROUP BY a.student.id, a.student.firstName, a.student.lastName
        ORDER BY studentName
    """)
    fun getAttendanceBySectionAndQuarter(
        @Param("sectionId") sectionId: UUID,
        @Param("quarter") quarter: String
    ): List<Array<Any>>

    @Query("""
        SELECT a.attendanceDate as date,
               COUNT(CASE WHEN a.status = 'PRESENT' THEN 1 END) as presentCount,
               COUNT(CASE WHEN a.status = 'ABSENT' THEN 1 END) as absentCount,
               COUNT(CASE WHEN a.status = 'LATE' THEN 1 END) as lateCount,
               COUNT(a) as totalStudents
        FROM AttendanceEntity a
        WHERE a.section = :sectionId
        AND a.quarter = :quarter
        GROUP BY a.attendanceDate
        ORDER BY a.attendanceDate
    """)
    fun getDailyAttendanceBySectionAndQuarter(
        @Param("sectionId") sectionId: UUID,
        @Param("quarter") quarter: String
    ): List<Array<Any>>

    // Feedback Reports
    @Query("""
        SELECT f FROM FeedbackEntity f
        LEFT JOIN FETCH f.student
        LEFT JOIN FETCH f.section
        WHERE (:sectionId IS NULL OR f.section = :sectionId)
        AND (:quarter IS NULL OR f.quarter = :quarter)
        ORDER BY f.createdAt DESC
    """)
    fun getFeedbackReports(
        @Param("sectionId") sectionId: UUID?,
        @Param("quarter") quarter: String?
    ): List<FeedbackEntity>

    // Teacher Load Reports
    @Query("""
        SELECT s.teacher.id as teacherId,
               CONCAT(s.teacher.firstName, ' ', s.teacher.lastName) as teacherName,
               COUNT(s) as subjectCount,
               STRING_AGG(DISTINCT s.subject.name, ', ') as subjects,
               STRING_AGG(DISTINCT s.section.name, ', ') as sections
        FROM ScheduleEntity s
        INNER JOIN SchoolYearQuarter q ON q.schoolYear.id = (
            SELECT sy.id FROM SchoolYear sy WHERE sy.isActive = true
        )
        WHERE (:teacherId IS NULL OR s.teacher.id = :teacherId)
        AND q.quarter = :quarter
        AND s.startTime >= q.startDate
        AND s.endTime <= q.endDate
        GROUP BY s.teacher.id, s.teacher.firstName, s.teacher.lastName
        ORDER BY teacherName
    """)
    fun getTeacherLoadSummary(
        @Param("teacherId") teacherId: UUID?,
        @Param("quarter") quarter: String
    ): List<Array<Any>>


    @Query("""
        SELECT s.teacher.id as teacherId,
               CONCAT(s.teacher.firstName, ' ', s.teacher.lastName) as teacherName,
               COUNT(s) as subjectCount,
               STRING_AGG(DISTINCT s.subject.name, ', ') as subjects,
               STRING_AGG(DISTINCT s.section.name, ', ') as sections
        FROM ScheduleEntity s
        INNER JOIN SchoolYearQuarter q ON q.schoolYear.id = (
            SELECT sy.id FROM SchoolYear sy WHERE sy.isActive = true
        )
        WHERE (:teacherId IS NULL OR s.teacher.id = :teacherId)
        AND q.quarter = :quarter
        AND CAST(s.startTime AS LocalDate) >= q.startDate
        AND CAST(s.endTime AS LocalDate) <= q.endDate
        GROUP BY s.teacher.id, s.teacher.firstName, s.teacher.lastName
        ORDER BY teacherName
    """)
    fun getTeacherLoadSummaryByQuarter(
        @Param("teacherId") teacherId: UUID?,
        @Param("quarter") quarter: String
    ): List<Array<Any>>


    // Usage Statistics (simplified - would need audit logs for full implementation)
    @Query("""
        SELECT COUNT(DISTINCT g.student.id) as activeStudents,
               COUNT(DISTINCT g.section.id) as activeSections,
               COUNT(g) as totalGrades
        FROM GradeEntity g
        WHERE g.updatedAt >= :startDate
    """)
    fun getBasicUsageStats(
        @Param("startDate") startDate: LocalDate
    ): Array<Long>

    // Additional helper queries
    @Query("SELECT DISTINCT g.quarter FROM GradeEntity g ORDER BY g.quarter")
    fun getAvailableQuarters(): List<String>

    @Query("SELECT DISTINCT EXTRACT(YEAR FROM g.createdAt) FROM GradeEntity g WHERE g.createdAt IS NOT NULL ORDER BY EXTRACT(YEAR FROM g.createdAt) DESC")
    fun getAvailableYears(): List<Int>

    // Sections list for reports
    @Query("""
        SELECT s.id as sectionId,
               s.name as sectionName,
               s.gradeLevel as gradeLevel,
               s.adviserName as adviserName,
               s.adviserId as adviserId
        FROM SectionEntity s
        ORDER BY s.gradeLevel, s.name
    """)
    fun getAllSectionsForReports(): List<Array<Any>>

    // Teacher Reports - Class Grade Summary
    @Query("""
        SELECT g.subject.name as subjectName,
               AVG(g.score) as averageGrade,
               COUNT(CASE WHEN g.score >= 75 THEN 1 END) as passingCount,
               COUNT(g) as totalCount,
               MIN(g.score) as lowestGrade,
               MAX(g.score) as highestGrade,
               ROUND((COUNT(CASE WHEN g.score >= 75 THEN 1 END) * 100.0) / COUNT(g), 2) as passingRate
        FROM GradeEntity g
        WHERE g.section.id = :sectionId
        AND g.subject.id = :subjectId
        AND g.quarter = :quarter
        GROUP BY g.subject.id, g.subject.name
    """)
    fun getTeacherClassGradeSummary(
        @Param("sectionId") sectionId: UUID,
        @Param("subjectId") subjectId: UUID,
        @Param("quarter") quarter: String
    ): List<Array<Any>>

    // Teacher Reports - Class Attendance Summary
    @Query("""
        SELECT g.student.id as studentId,
               CONCAT(g.student.firstName, ' ', g.student.lastName) as studentName,
               COUNT(CASE WHEN a.status = 'PRESENT' THEN 1 END) as presentCount,
               COUNT(CASE WHEN a.status = 'ABSENT' THEN 1 END) as absentCount,
               COUNT(CASE WHEN a.status = 'LATE' THEN 1 END) as lateCount,
               COUNT(a) as totalDays,
               ROUND((COUNT(CASE WHEN a.status = 'PRESENT' THEN 1 END) * 100.0) / NULLIF(COUNT(a), 0), 2) as attendanceRate
        FROM GradeEntity g
        LEFT JOIN AttendanceEntity a ON a.student.id = g.student.id
            AND a.section.id = g.section.id
            AND a.quarter = g.quarter
        WHERE g.section.id = :sectionId
        AND g.subject.id = :subjectId
        AND g.quarter = :quarter
        GROUP BY g.student.id, g.student.firstName, g.student.lastName
        ORDER BY studentName
    """)
    fun getTeacherClassAttendanceSummary(
        @Param("sectionId") sectionId: UUID,
        @Param("subjectId") subjectId: UUID,
        @Param("quarter") quarter: String
    ): List<Array<Any>>

    // Teacher Reports - Student Subject Grades
    @Query("""
        SELECT g.subject.name as subjectName,
               g.score as grade,
               g.quarter as quarter
        FROM GradeEntity g
        WHERE g.student.id = :studentId
        AND g.subject.id = :subjectId
        ORDER BY g.quarter
    """)
    fun getStudentSubjectGrades(
        @Param("studentId") studentId: UUID,
        @Param("subjectId") subjectId: UUID
    ): List<Array<Any>>

    // Teacher Reports - Student Subject Attendance
    @Query("""
        SELECT COUNT(CASE WHEN a.status = 'PRESENT' THEN 1 END) as presentCount,
               COUNT(CASE WHEN a.status = 'ABSENT' THEN 1 END) as absentCount,
               COUNT(CASE WHEN a.status = 'LATE' THEN 1 END) as lateCount,
               COUNT(a) as totalDays
        FROM AttendanceEntity a
        WHERE a.student.id = :studentId
        AND a.section.id = :sectionId
        AND a.quarter = :quarter
    """)
    fun getStudentSubjectAttendance(
        @Param("studentId") studentId: UUID,
        @Param("sectionId") sectionId: UUID,
        @Param("quarter") quarter: String
    ): Array<Long>

    // Adviser Reports - Advisory Class General Report
    @Query("""
        SELECT s.name as sectionName,
               s.gradeLevel as gradeLevel,
               COUNT(DISTINCT ce.student.id) as totalStudents,
               COUNT(DISTINCT CASE WHEN ce.isActive = true THEN ce.student.id END) as activeStudents,
               AVG(CASE WHEN a.status = 'PRESENT' THEN 1.0 ELSE 0.0 END) * 100 as averageAttendance,
               AVG(g.score) as averageGrade,
               COUNT(DISTINCT f.id) as totalFeedback
        FROM SectionEntity s
        LEFT JOIN ClassEnrollmentEntity ce ON ce.section.id = s.id
        LEFT JOIN AttendanceEntity a ON a.section.id = s.id AND a.quarter = :quarter
        LEFT JOIN GradeEntity g ON g.section.id = s.id AND g.quarter = :quarter
        LEFT JOIN FeedbackEntity f ON f.section.id = s.id AND f.quarter = :quarter
        WHERE s.adviserId = :adviserId
        GROUP BY s.id, s.name, s.gradeLevel
        ORDER BY s.gradeLevel, s.name
    """)
    fun getAdvisoryClassGeneralReport(
        @Param("adviserId") adviserId: UUID,
        @Param("quarter") quarter: String
    ): List<Array<Any>>

    // Adviser Reports - Advisory Attendance Consolidated
    @Query("""
        SELECT s.name as sectionName,
               EXTRACT(MONTH FROM a.attendanceDate) as month,
               COUNT(a) as totalDays,
               COUNT(CASE WHEN a.status = 'PRESENT' THEN 1 END) as presentCount,
               COUNT(CASE WHEN a.status = 'ABSENT' THEN 1 END) as absentCount,
               COUNT(CASE WHEN a.status = 'LATE' THEN 1 END) as lateCount,
               ROUND((COUNT(CASE WHEN a.status = 'PRESENT' THEN 1 END) * 100.0) / NULLIF(COUNT(a), 0), 2) as attendanceRate
        FROM SectionEntity s
        LEFT JOIN AttendanceEntity a ON a.section.id = s.id
            AND a.attendanceDate BETWEEN :startDate AND :endDate
        WHERE s.adviserId = :adviserId
        AND a.quarter = :quarter
        GROUP BY s.id, s.name, EXTRACT(MONTH FROM a.attendanceDate)
        ORDER BY s.name, EXTRACT(MONTH FROM a.attendanceDate)
    """)
    fun getAdvisoryAttendanceConsolidated(
        @Param("adviserId") adviserId: UUID,
        @Param("quarter") quarter: String,
        @Param("startDate") startDate: LocalDate,
        @Param("endDate") endDate: LocalDate
    ): List<Array<Any>>

    // Adviser Reports - Behaviour Conduct Report
    @Query("""
        SELECT f.student.id as studentId,
               CONCAT(f.student.firstName, ' ', f.student.lastName) as studentName,
               f.feedback as feedbackText,
               f.createdAt as date
        FROM FeedbackEntity f
        INNER JOIN f.section s
        WHERE s.adviserId = :adviserId
        AND f.quarter = :quarter
        ORDER BY f.student.id, f.createdAt DESC
    """)
    fun getBehaviourConductReport(
        @Param("adviserId") adviserId: UUID,
        @Param("quarter") quarter: String
    ): List<Array<Any>>

    // Adviser Reports - Parent Communication Activity
    @Query("""
        SELECT f.student.id as studentId,
               CONCAT(f.student.firstName, ' ', f.student.lastName) as studentName,
               f.feedback as feedbackText,
               f.createdAt as date
        FROM FeedbackEntity f
        WHERE f.section.adviserId = :adviserId
        AND f.createdAt BETWEEN :startDate AND :endDate
        ORDER BY f.student.id, f.createdAt DESC
    """)
    fun getParentCommunicationActivity(
        @Param("adviserId") adviserId: UUID,
        @Param("startDate") startDate: LocalDate,
        @Param("endDate") endDate: LocalDate
    ): List<Array<Any>>

    // Helper methods for teacher/adviser reports
    @Query("""
        SELECT DISTINCT s.id, s.name
        FROM SectionEntity s
        WHERE s.adviserId = :adviserId
        ORDER BY s.name
    """)
    fun getAdviserSections(@Param("adviserId") adviserId: UUID): List<Array<Any>>

    @Query("""
        SELECT DISTINCT s.id, s.name
        FROM SectionEntity s
        LEFT JOIN ClassEnrollmentEntity ce ON ce.section.id = s.id
        WHERE s.adviserId = :adviserId
        AND (:schoolYear IS NULL OR ce.schoolYear = :schoolYear)
        ORDER BY s.name
    """)
    fun getAdviserSections(@Param("adviserId") adviserId: UUID, @Param("schoolYear") schoolYear: String?): List<Array<Any>>

    @Query("""
        SELECT DISTINCT sub.id, sub.name
        FROM SubjectEntity sub
        INNER JOIN ScheduleEntity sch ON sch.subject.id = sub.id
        LEFT JOIN SchoolYearQuarter sq ON sq.id = sch.schoolYearQuarter.id
        WHERE sch.teacher.id = :teacherId
        AND sch.startTime >= :startDate
        AND sch.endTime <= :endDate
        AND (:schoolYear IS NULL OR sq.schoolYear.yearRange = :schoolYear)
        ORDER BY sub.name
    """)
    fun getTeacherSubjects(
        @Param("teacherId") teacherId: UUID,
        @Param("startDate") startDate: LocalDate,
        @Param("endDate") endDate: LocalDate,
        @Param("schoolYear") schoolYear: String? = null
    ): List<Array<Any>>

    @Query("""
        SELECT DISTINCT s.id, s.name
        FROM SectionEntity s
        INNER JOIN ScheduleEntity sch ON sch.section.id = s.id
        LEFT JOIN SchoolYearQuarter sq ON sq.id = sch.schoolYearQuarter.id
        WHERE sch.teacher.id = :teacherId
        AND (:schoolYear IS NULL OR sq.schoolYear.yearRange = :schoolYear)
        ORDER BY s.name
    """)
    fun getTeacherSections(@Param("teacherId") teacherId: UUID, @Param("schoolYear") schoolYear: String?): List<Array<Any>>
}
