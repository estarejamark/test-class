package com.kapston.CTU_DB_API.service.implementation

import com.kapston.CTU_DB_API.domain.dto.response.*
import com.kapston.CTU_DB_API.repository.ReportsRepository
import com.kapston.CTU_DB_API.service.abstraction.TeacherAdviserReportsService
import org.springframework.stereotype.Service
import java.time.LocalDate
import java.util.*
import kotlin.math.roundToInt

@Service
class TeacherAdviserReportsServiceImplementation(
    private val reportsRepository: ReportsRepository
) : TeacherAdviserReportsService {

    // Teacher Reports
    override fun getClassGradeSummary(teacherId: UUID, sectionId: UUID, subjectId: UUID, quarter: String): ClassGradeSummaryResponse {
        val grades = reportsRepository.getTeacherClassGradeSummary(sectionId, subjectId, quarter)

        if (grades.isEmpty()) {
            return ClassGradeSummaryResponse(
                subjectName = "Unknown Subject",
                averageGrade = 0.0,
                passingCount = 0,
                totalCount = 0,
                lowestGrade = 0.0,
                highestGrade = 0.0,
                passingRate = 0.0
            )
        }

        val row = grades.first()
        val subjectName = row[0] as String
        val averageGrade = (row[1] as Number).toDouble()
        val passingCount = (row[2] as Number).toInt()
        val totalCount = (row[3] as Number).toInt()
        val lowestGrade = (row[4] as Number).toDouble()
        val highestGrade = (row[5] as Number).toDouble()
        val passingRate = (row[6] as Number).toDouble()

        return ClassGradeSummaryResponse(
            subjectName = subjectName,
            averageGrade = (averageGrade * 100.0).roundToInt() / 100.0,
            passingCount = passingCount,
            totalCount = totalCount,
            lowestGrade = lowestGrade,
            highestGrade = highestGrade,
            passingRate = (passingRate * 100.0).roundToInt() / 100.0
        )
    }

    override fun getClassAttendanceSummary(teacherId: UUID, sectionId: UUID, subjectId: UUID, quarter: String): List<ClassAttendanceSummaryResponse> {
        return reportsRepository.getTeacherClassAttendanceSummary(sectionId, subjectId, quarter)
            .map { row ->
                ClassAttendanceSummaryResponse(
                    studentId = (row[0] as UUID).toString(),
                    studentName = row[1] as String,
                    presentCount = (row[2] as Number).toInt(),
                    absentCount = (row[3] as Number).toInt(),
                    lateCount = (row[4] as Number).toInt(),
                    totalDays = (row[5] as Number).toInt(),
                    attendanceRate = (row[6] as Number).toDouble()
                )
            }
    }

    override fun getIndividualStudentReport(teacherId: UUID, studentId: UUID, subjectId: UUID, quarter: String): IndividualStudentReportResponse {
        val grades = reportsRepository.getStudentSubjectGrades(studentId, subjectId)
        val attendance = reportsRepository.getStudentSubjectAttendance(studentId, subjectId, quarter)

        val subjectGrades = grades.map { row ->
            SubjectGrade(
                subjectName = row[0] as String,
                grade = (row[1] as Number).toDouble(),
                quarter = quarter
            )
        }

        val presentCount = (attendance[0] as Number).toLong()
        val absentCount = (attendance[1] as Number).toLong()
        val lateCount = (attendance[2] as Number).toLong()
        val totalDays = (attendance[3] as Number).toLong()
        val attendanceRate = if (totalDays > 0) (presentCount.toDouble() / totalDays) * 100 else 0.0

        val attendanceSummary = StudentAttendanceSummary(
            presentCount = presentCount.toInt(),
            absentCount = absentCount.toInt(),
            lateCount = lateCount.toInt(),
            totalDays = totalDays.toInt(),
            attendanceRate = (attendanceRate * 100.0).roundToInt() / 100.0
        )

        val overallAverage = if (subjectGrades.isNotEmpty()) subjectGrades.map { it.grade }.average() else 0.0

        return IndividualStudentReportResponse(
            studentId = studentId.toString(),
            studentName = "Unknown Student", // TODO: Implement student info retrieval
            grades = subjectGrades,
            attendance = attendanceSummary,
            overallAverage = (overallAverage * 100.0).roundToInt() / 100.0,
            conductRating = null // TODO: Implement conduct rating retrieval
        )
    }

    // Adviser Reports
    override fun getAdvisoryClassGeneralReport(adviserId: UUID, quarter: String): List<AdvisoryClassGeneralResponse> {
        return reportsRepository.getAdvisoryClassGeneralReport(adviserId, quarter).map { row ->
            AdvisoryClassGeneralResponse(
                sectionName = row[0] as String,
                gradeLevel = (row[1] as Number).toInt(),
                totalStudents = (row[2] as Number).toInt(),
                activeStudents = (row[3] as Number).toInt(),
                averageAttendance = (row[4] as Number).toDouble(),
                averageGrade = (row[5] as Number).toDouble(),
                conductIssues = (row[6] as Number).toInt(),
                parentCommunications = (row[7] as Number).toInt()
            )
        }
    }

    override fun getAdvisoryAttendanceConsolidated(adviserId: UUID, quarter: String, startDate: LocalDate, endDate: LocalDate): List<AdvisoryAttendanceConsolidatedResponse> {
        return reportsRepository.getAdvisoryAttendanceConsolidated(adviserId, quarter, startDate, endDate).map { row ->
            AdvisoryAttendanceConsolidatedResponse(
                sectionName = row[0] as String,
                month = (row[1] as Number).toString(),
                totalDays = (row[2] as Number).toInt(),
                presentCount = (row[3] as Number).toInt(),
                absentCount = (row[4] as Number).toInt(),
                lateCount = (row[5] as Number).toInt(),
                attendanceRate = (row[6] as Number).toDouble(),
                topPerformers = emptyList(), // TODO: Implement top performers calculation
                needsAttention = emptyList() // TODO: Implement needs attention calculation
            )
        }
    }

    override fun getBehaviourConductReport(adviserId: UUID, quarter: String): List<BehaviourConductReportResponse> {
        return reportsRepository.getBehaviourConductReport(adviserId, quarter).map { row ->
            BehaviourConductReportResponse(
                studentId = (row[0] as UUID).toString(),
                studentName = row[1] as String,
                conductRating = row[2] as String,
                incidents = emptyList(), // TODO: Implement incidents retrieval
                positiveNotes = emptyList(), // TODO: Implement positive notes retrieval
                recommendations = row[3] as String?
            )
        }
    }

    override fun getParentCommunicationActivity(adviserId: UUID, startDate: LocalDate, endDate: LocalDate): List<ParentCommunicationActivityResponse> {
        return reportsRepository.getParentCommunicationActivity(adviserId, startDate, endDate).map { row ->
            ParentCommunicationActivityResponse(
                studentId = (row[0] as UUID).toString(),
                studentName = row[1] as String,
                communications = emptyList(), // TODO: Implement communications retrieval
                totalCommunications = (row[2] as Number).toInt(),
                lastCommunication = row[3] as LocalDate?,
                communicationTypes = emptyMap() // TODO: Implement communication types retrieval
            )
        }
    }

    // Helper methods
    override fun getAdviserSections(adviserId: UUID, schoolYear: String?): List<Map<String, Any>> {
        return reportsRepository.getAdviserSections(adviserId, schoolYear).map { array ->
            mapOf(
                "id" to array[0],
                "name" to array[1]
            )
        }
    }

    override fun getTeacherSubjects(teacherId: UUID, startDate: LocalDate, endDate: LocalDate, schoolYear: String?): List<Map<String, Any>> {
        return reportsRepository.getTeacherSubjects(teacherId, startDate, endDate, schoolYear).map { array ->
            mapOf(
                "id" to array[0],
                "name" to array[1]
            )
        }
    }

    override fun getTeacherSections(teacherId: UUID, schoolYear: String?): List<Map<String, Any>> {
        return reportsRepository.getTeacherSections(teacherId, schoolYear).map { array ->
            mapOf(
                "id" to array[0],
                "name" to array[1]
            )
        }
    }

    override fun getAvailableYears(): List<String> {
        return reportsRepository.getAvailableYears().map { it.toString() }
    }

    override fun getAvailableSections(): List<Map<String, Any>> {
        return reportsRepository.getAllSectionsForReports().map { array ->
            mapOf(
                "id" to array[0],
                "name" to array[1],
                "gradeLevel" to array[2],
                "adviserName" to array[3],
                "adviserId" to array[4]
            )
        }
    }
}
