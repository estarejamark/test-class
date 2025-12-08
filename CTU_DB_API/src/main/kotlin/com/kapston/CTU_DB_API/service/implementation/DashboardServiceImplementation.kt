package com.kapston.CTU_DB_API.service.implementation

import com.kapston.CTU_DB_API.domain.dto.response.*
import com.kapston.CTU_DB_API.domain.dto.response.AdviserSummaryResponse
import com.kapston.CTU_DB_API.service.abstraction.DashboardService
import com.kapston.CTU_DB_API.service.abstraction.SubjectService
import com.kapston.CTU_DB_API.service.abstraction.SectionService
import com.kapston.CTU_DB_API.service.abstraction.ProfileService
import com.kapston.CTU_DB_API.service.abstraction.ScheduleService
import com.kapston.CTU_DB_API.service.abstraction.StudentService
import com.kapston.CTU_DB_API.service.abstraction.AttendanceService
import com.kapston.CTU_DB_API.service.abstraction.SettingsService
import com.kapston.CTU_DB_API.service.abstraction.FeedbackService
import com.kapston.CTU_DB_API.domain.Enums.Quarter
import com.kapston.CTU_DB_API.domain.Enums.AttendanceStatus
import org.springframework.security.core.Authentication
import org.springframework.stereotype.Service
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import java.util.UUID

@Service
class DashboardServiceImplementation(
    private val subjectService: SubjectService,
    private val sectionService: SectionService,
    private val profileService: ProfileService,
    private val scheduleService: ScheduleService,
    private val studentService: StudentService,
    private val attendanceService: AttendanceService,
    private val settingsService: SettingsService,
    private val feedbackService: FeedbackService
) : DashboardService {

    private fun getUserRole(auth: Authentication): String {
        return auth.authorities.firstOrNull()?.authority?.removePrefix("ROLE_") ?: "STUDENT"
    }

    private fun getUserId(auth: Authentication): UUID? {
        return try {
            UUID.fromString(auth.name)
        } catch (e: Exception) {
            null
        }
    }

    override fun getTeacherLoadStatus(auth: Authentication): List<TeacherLoadStatusResponse> {
        val userRole = getUserRole(auth)
        val userId = getUserId(auth)

        val schedules = when (userRole) {
            "ADMIN" -> scheduleService.getAllSchedules()
            "TEACHER" -> {
                if (userId != null) {
                    scheduleService.getSchedulesByTeacher(userId)
                } else {
                    emptyList()
                }
            }
            "ADVISER" -> {
                if (userId != null) {
                    scheduleService.getSchedulesByAdviser(userId)
                } else {
                    emptyList()
                }
            }
            else -> emptyList()
        }

        val subjects = when (userRole) {
            "ADMIN" -> subjectService.search(null, null, 0, 1000).content
            "TEACHER", "ADVISER" -> {
                if (userId != null) {
                    val teacherSubjects = schedules.map { it.subject.id }.distinct()
                    subjectService.search(null, null, 0, 1000).content.filter { teacherSubjects.contains(it.id) }
                } else {
                    emptyList()
                }
            }
            else -> emptyList()
        }

        val assignedSubjects = schedules.map { it.subject.id }.distinct().size
        val totalSubjects = when (userRole) {
            "ADMIN" -> subjectService.search(null, null, 0, 1000).totalElements.toInt()
            else -> subjects.size
        }
        val pendingSubjects = (totalSubjects - assignedSubjects).coerceAtLeast(0)

        // Calculate assigned loads (number of schedules) and pending loads (subjects without schedules)
        val totalAssigned = schedules.size
        val totalPending = pendingSubjects

        // Return data for the last 6 months with slight variations for demo purposes
        val months = listOf("Jan", "Feb", "Mar", "Apr", "May", "Jun")
        return months.mapIndexed { index, month ->
            val variation = (index - 2) * 2 // Slight variation around the total
            val assigned = (totalAssigned + variation).coerceAtLeast(0)
            val pending = (totalPending - variation).coerceAtLeast(0)
            TeacherLoadStatusResponse(month, assigned, pending)
        }
    }



    override fun getDashboardStats(auth: Authentication): DashboardStatsResponse {
        val userRole = getUserRole(auth)
        val userId = getUserId(auth)

        val subjects = when (userRole) {
            "ADMIN" -> subjectService.search(null, null, 0, 1000).content
            "TEACHER", "ADVISER" -> {
                if (userId != null) {
                    val schedules = if (userRole == "TEACHER") {
                        scheduleService.getSchedulesByTeacher(userId)
                    } else {
                        scheduleService.getSchedulesByAdviser(userId)
                    }
                    val teacherSubjects = schedules.map { it.subject.id }.distinct()
                    subjectService.search(null, null, 0, 1000).content.filter { teacherSubjects.contains(it.id) }
                } else {
                    emptyList()
                }
            }
            else -> emptyList()
        }

        val sections = when (userRole) {
            "ADMIN" -> sectionService.search(null, null, null, 0, 1000).content
            "TEACHER" -> {
                if (userId != null) {
                    val teacherSchedules = scheduleService.getSchedulesByTeacher(userId)
                    val teacherSections = teacherSchedules.map { it.section }.distinctBy { it.id }
                    teacherSections
                } else {
                    emptyList()
                }
            }
            "ADVISER" -> {
                if (userId != null) {
                    val adviserSections = sectionService.getSectionsByAdviser(userId)
                    adviserSections
                } else {
                    emptyList()
                }
            }
            else -> emptyList()
        }

        val teachers = when (userRole) {
            "ADMIN" -> profileService.getAllTeachers()
            "TEACHER", "ADVISER" -> {
                if (userId != null) {
                    val schedules = if (userRole == "TEACHER") {
                        scheduleService.getSchedulesByTeacher(userId)
                    } else {
                        scheduleService.getSchedulesByAdviser(userId)
                    }
                    schedules.map { it.teacher }.distinctBy { it.id }
                } else {
                    emptyList()
                }
            }
            else -> emptyList()
        }

        val students = when (userRole) {
            "ADMIN" -> {
                val (studentList, totalCount) = studentService.getAllStudentsWithEnrollmentStatus(0, 1000)
                listOf(Pair(studentList, totalCount))
            }
            "TEACHER" -> {
                if (userId != null) {
                    val teacherSchedules = scheduleService.getSchedulesByTeacher(userId)
                    val teacherSections = teacherSchedules.map { it.section }.distinctBy { it.id }
                    val studentList = mutableListOf<Pair<List<StudentResponse>, Long>>()
                    teacherSections.forEach { section ->
                        try {
                            val sectionStudents = studentService.getStudentsBySection(section.id, 0, 1000)
                            studentList.add(sectionStudents)
                        } catch (e: Exception) {
                            // Skip sections with errors
                        }
                    }
                    studentList
                } else {
                    emptyList<Pair<List<StudentResponse>, Long>>()
                }
            }
            "ADVISER" -> {
                if (userId != null) {
                    val adviserSections = sectionService.getSectionsByAdviser(userId)
                    val studentList = mutableListOf<Pair<List<StudentResponse>, Long>>()
                    adviserSections.forEach { section ->
                        try {
                            val sectionStudents = studentService.getStudentsBySection(section.id, 0, 1000)
                            studentList.add(sectionStudents)
                        } catch (e: Exception) {
                            // Skip sections with errors
                        }
                    }
                    studentList
                } else {
                    emptyList<Pair<List<StudentResponse>, Long>>()
                }
            }
            else -> emptyList<Pair<List<StudentResponse>, Long>>()
        }

        val schedules = when (userRole) {
            "ADMIN" -> scheduleService.getAllSchedules()
            "TEACHER" -> {
                if (userId != null) {
                    scheduleService.getSchedulesByTeacher(userId)
                } else {
                    emptyList()
                }
            }
            "ADVISER" -> {
                if (userId != null) {
                    scheduleService.getSchedulesByAdviser(userId)
                } else {
                    emptyList()
                }
            }
            else -> emptyList()
        }

        val assignedSubjects = schedules.map { it.subject.id }.distinct().size
        val totalSubjects = subjects.size
        val pendingSubjects = (totalSubjects - assignedSubjects).coerceAtLeast(0)

        return DashboardStatsResponse(
            totalSubjects = totalSubjects,
            totalSections = sections.size,
            totalTeachers = teachers.size,
            totalStudents = students.sumOf { pair -> pair.second }.toInt(),
            assignedLoads = assignedSubjects,
            pendingLoads = pendingSubjects
        )
    }

    override fun getSubjectsOverview(auth: Authentication): List<SubjectOverviewResponse> {
        val userRole = getUserRole(auth)
        val userId = getUserId(auth)

        val subjects = when (userRole) {
            "ADMIN" -> subjectService.search(null, null, 0, 1000).content
            "TEACHER", "ADVISER" -> {
                if (userId != null) {
                    val schedules = if (userRole == "TEACHER") {
                        scheduleService.getSchedulesByTeacher(userId)
                    } else {
                        scheduleService.getSchedulesByAdviser(userId)
                    }
                    val teacherSubjects = schedules.map { it.subject.id }.distinct()
                    subjectService.search(null, null, 0, 1000).content.filter { teacherSubjects.contains(it.id) }
                } else {
                    emptyList()
                }
            }
            else -> emptyList()
        }

        val schedules = when (userRole) {
            "ADMIN" -> scheduleService.getAllSchedules()
            "TEACHER" -> {
                if (userId != null) {
                    scheduleService.getSchedulesByTeacher(userId)
                } else {
                    emptyList()
                }
            }
            "ADVISER" -> {
                if (userId != null) {
                    scheduleService.getSchedulesByAdviser(userId)
                } else {
                    emptyList()
                }
            }
            else -> emptyList()
        }

        return subjects.map { subject ->
            val subjectSchedules = schedules.filter { it.subject.id == subject.id }
            val subjectSections = subjectSchedules.map { it.section }.distinctBy { it.id }
            val teachers = subjectSchedules.map { it.teacher }.distinctBy { it.id }

            val primaryTeacher = teachers.firstOrNull() ?: subjectSchedules.firstOrNull()?.teacher
            val estimatedStudents = subjectSections.size * 25 // Rough estimate

            SubjectOverviewResponse(
                id = subject.id.toString(),
                subject = subject.name,
                grade = if (subjectSections.size == 1) subjectSections.first().gradeLevel else "Multiple",
                teacher = primaryTeacher?.let {
                    AdviserSummaryResponse(it.id.toString(), it.firstName, it.lastName)
                } ?: AdviserSummaryResponse("", "Unassigned", ""),
                sections = subjectSections.size,
                students = estimatedStudents
            )
        }
    }

    override fun getTeacherLoadsOverview(auth: Authentication): List<TeacherLoadOverviewResponse> {
        val userRole = getUserRole(auth)
        val userId = getUserId(auth)

        val schedules = when (userRole) {
            "ADMIN" -> scheduleService.getAllSchedules()
            "TEACHER" -> {
                if (userId != null) {
                    scheduleService.getSchedulesByTeacher(userId)
                } else {
                    emptyList()
                }
            }
            "ADVISER" -> {
                if (userId != null) {
                    scheduleService.getSchedulesByAdviser(userId)
                } else {
                    emptyList()
                }
            }
            else -> emptyList()
        }

        return schedules.map { schedule ->
            TeacherLoadOverviewResponse(
                id = schedule.id.toString(),
                teacher = AdviserSummaryResponse(
                    schedule.teacher.id.toString(),
                    schedule.teacher.firstName,
                    schedule.teacher.lastName
                ),
                subject = schedule.subject.name,
                section = schedule.section.name,
                schedule = "${schedule.startTime} - ${schedule.endTime}",
                status = "Assigned"
            )
        }
    }

    override fun getSectionsOverview(auth: Authentication): List<SectionOverviewResponse> {
        val userRole = getUserRole(auth)
        val userId = getUserId(auth)

        val sections: List<SectionSummary> = when (userRole) {
            "ADMIN" -> sectionService.search(null, null, null, 0, 1000).content.map {
                SectionSummary(
                    id = it.id,
                    name = it.name,
                    gradeLevel = it.gradeLevel,
                    adviser = AdviserSummary.fromIdAndName(it.adviserId, it.adviserName)
                )
            }
            "TEACHER" -> {
                if (userId != null) {
                    val teacherSchedules = scheduleService.getSchedulesByTeacher(userId)
                    teacherSchedules.map { it.section }.distinctBy { it.id }
                } else {
                    emptyList()
                }
            }
            "ADVISER" -> {
                if (userId != null) {
                    sectionService.getSectionsByAdviser(userId).map {
                        SectionSummary(
                            id = it.id,
                            name = it.name,
                            gradeLevel = it.gradeLevel,
                            adviser = AdviserSummary.fromIdAndName(it.adviserId, it.adviserName)
                        )
                    }
                } else {
                    emptyList()
                }
            }
            else -> emptyList()
        }

        val sectionList = sections

        return sectionList.map { section ->
            // Get actual student count for this section
            val studentsInSection = try {
                val (students, _) = studentService.getStudentsBySection(section.id, 0, 1000)
                students.size
            } catch (e: Exception) {
                // Fallback to 0 if there's an error getting student count
                0
            }

            SectionOverviewResponse(
                id = section.id.toString(),
                section = section.name,
                grade = section.gradeLevel,
                adviser = AdviserSummaryResponse(
                    section.adviser?.id?.toString() ?: "",
                    section.adviser?.let { "${it.firstName} ${it.lastName}" } ?: "Unassigned",
                    section.adviser?.lastName ?: ""
                ),
                students = studentsInSection,
                status = "Active"
            )
        }
    }

    override fun getSubjectsByGrade(auth: Authentication): List<SubjectsByGradeResponse> {
        val userRole = getUserRole(auth)
        val userId = getUserId(auth)

        val schedules = when (userRole) {
            "ADMIN" -> scheduleService.getAllSchedules()
            "TEACHER" -> {
                if (userId != null) {
                    scheduleService.getSchedulesByTeacher(userId)
                } else {
                    emptyList()
                }
            }
            "ADVISER" -> {
                if (userId != null) {
                    scheduleService.getSchedulesByAdviser(userId)
                } else {
                    emptyList()
                }
            }
            else -> emptyList()
        }

        val gradeGroups = mutableMapOf<String, MutableSet<String>>()

        schedules.forEach { schedule ->
            val grade = schedule.section.gradeLevel
            gradeGroups.getOrPut(grade) { mutableSetOf() }.add(schedule.subject.name)
        }

        return gradeGroups.map { (grade, subjectSet) ->
            SubjectsByGradeResponse(grade, subjectSet.size)
        }
    }

    override fun getStudentsPerSection(auth: Authentication): List<StudentsPerSectionResponse> {
        val userRole = getUserRole(auth)
        val userId = getUserId(auth)

        // Retrieve sections based on role
        val sections: List<SectionSummary> = when (userRole) {
            "ADMIN" -> sectionService.search(null, null, null, 0, 5).content.map { SectionSummary(id = it.id, name = it.name, gradeLevel = it.gradeLevel, adviser = AdviserSummary.fromIdAndName(it.adviserId, it.adviserName)) }
            "TEACHER" -> {
                if (userId != null) {
                    val teacherSchedules = scheduleService.getSchedulesByTeacher(userId)
                    teacherSchedules.map { it.section }.distinctBy { it.id }.take(5)
                } else {
                    emptyList<SectionSummary>()
                }
            }
            "ADVISER" -> {
                if (userId != null) {
                    sectionService.getSectionsByAdviser(userId).take(5).map { SectionSummary(id = it.id, name = it.name, gradeLevel = it.gradeLevel, adviser = AdviserSummary.fromIdAndName(it.adviserId, it.adviserName)) }
                } else {
                    emptyList<SectionSummary>()
                }
            }
            else -> emptyList<SectionSummary>()
        }

        // Define colors for sections
        val colors = listOf("#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00ff00")

        // Return mapped section list with student counts and colors
        return sections.mapIndexed { index, section ->
            // Fetch student count for the section
            val studentCount = try {
                val (students, _) = studentService.getStudentsBySection(section.id, 0, 1000) // Handle pagination for students
                students.size // Return the count
            } catch (e: Exception) {
                // Fallback to 0 in case of errors (e.g., DB or network issues)
                0
            }

            // Create StudentsPerSectionResponse for each section
            StudentsPerSectionResponse(
                name = section.name, // Section name
                value = studentCount, // Student count
                fill = colors.getOrElse(index) { "#8884d8" } // Color fallback
            )
        }
    }

    override fun getStudentDashboardData(studentId: UUID): StudentDashboardResponse {
        // Get student details
        val student = studentService.getStudentDetails(studentId)

        // Get active quarter
        val activeQuarter = settingsService.getActiveQuarter()?.quarter ?: Quarter.Q1

        // Get attendance summary
        val attendanceRecords = attendanceService.getStudentAttendance(
            studentId,
            student.sectionId!!,
            activeQuarter.toString()
        )
        val presentDays = attendanceRecords.count { it.status == AttendanceStatus.PRESENT }
        val totalDays = attendanceRecords.size
        val attendanceRate = if (totalDays > 0) (presentDays.toDouble() / totalDays) * 100 else 0.0

        val attendanceSummary = AttendanceSummary(
            currentQuarter = activeQuarter.toString(),
            presentDays = presentDays,
            totalDays = totalDays,
            attendanceRate = attendanceRate
        )

        // Get feedback status (pending replies)
        val feedback = feedbackService.getFeedbackForStudent(
            studentId,
            student.sectionId!!,
            activeQuarter.toString()
        )
        val pendingFeedbackReplies = if (feedback != null && feedback.studentResponse.isNullOrEmpty()) 1 else 0

        // Correction requests status (placeholder for now)
        val correctionRequestsStatus = CorrectionRequestsStatus(
            pending = 0,
            approved = 0,
            rejected = 0
        )

        // Student profile info
        val profile = StudentProfileInfo(
            firstName = student.firstName,
            lastName = student.lastName,
            gradeLevel = student.gradeLevel ?: "",
            sectionName = student.sectionName ?: "",
            adviserName = "Unassigned", // TODO: Get adviser name from section
            profileImage = null // TODO: Add profile image support
        )

        return StudentDashboardResponse(
            attendanceSummary = attendanceSummary,
            pendingFeedbackReplies = pendingFeedbackReplies,
            correctionRequestsStatus = correctionRequestsStatus,
            profile = profile
        )
    }
}
