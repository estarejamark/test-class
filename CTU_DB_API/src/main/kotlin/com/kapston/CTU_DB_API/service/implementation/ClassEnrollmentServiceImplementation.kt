package com.kapston.CTU_DB_API.service.implementation

import com.kapston.CTU_DB_API.CustomException.StudentAlreadyEnrolledException
import com.kapston.CTU_DB_API.CustomException.StudentNotEnrolledException
import com.kapston.CTU_DB_API.CustomException.StudentNotFoundException
import com.kapston.CTU_DB_API.CustomException.SectionNotFoundException
import com.kapston.CTU_DB_API.domain.dto.response.EnrolledStudentResponse
import com.kapston.CTU_DB_API.domain.dto.response.UnassignedStudentResponse
import com.kapston.CTU_DB_API.domain.dto.response.StudentWithEnrollmentResponse
import com.kapston.CTU_DB_API.domain.dto.request.EnrollmentRequest
import com.kapston.CTU_DB_API.domain.dto.request.MoveStudentRequest
import com.kapston.CTU_DB_API.domain.entity.ClassEnrollmentEntity
import com.kapston.CTU_DB_API.domain.entity.ProfileEntity
import com.kapston.CTU_DB_API.domain.entity.SectionEntity
import com.kapston.CTU_DB_API.domain.entity.UserEntity
import com.kapston.CTU_DB_API.repository.ClassEnrollmentRepository
import com.kapston.CTU_DB_API.repository.SectionRepository
import com.kapston.CTU_DB_API.repository.UserRepository
import com.kapston.CTU_DB_API.service.abstraction.ClassEnrollmentService
import com.kapston.CTU_DB_API.service.abstraction.ProfileService
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime
import java.util.UUID

@Service
class ClassEnrollmentServiceImplementation(
    private val classEnrollmentRepository: ClassEnrollmentRepository,
    private val userRepository: UserRepository,
    private val sectionRepository: SectionRepository,
    private val profileService: ProfileService
) : ClassEnrollmentService {

    private val logger = LoggerFactory.getLogger(ClassEnrollmentServiceImplementation::class.java)

    override fun getEnrolledStudents(sectionId: UUID): List<EnrolledStudentResponse> {
        logger.info("Getting enrolled students for section: $sectionId")

        try {
            // Verify section exists
            val section = sectionRepository.findById(sectionId)
                .orElseThrow { SectionNotFoundException("Section not found with id: $sectionId") }

            val rawResults = classEnrollmentRepository.findEnrolledStudentsWithProfiles(sectionId)

            return rawResults.map { row ->
                val enrollment = row[0] as ClassEnrollmentEntity
                val profile = row[1] as ProfileEntity

                EnrolledStudentResponse.fromEntity(
                    enrollmentId = enrollment.id!!,
                    studentId = enrollment.student.id!!,
                    studentName = "${profile.firstName} ${profile.lastName}",
                    email = enrollment.student.email,
                    gradeLevel = section.gradeLevel,
                    sectionName = section.name,
                    parentName = profile.parentName,
                    parentContact = profile.parentContact,
                    enrolledAt = enrollment.enrolledAt,
                    schoolYear = enrollment.schoolYear,
                    quarter = enrollment.quarter
                )
            }
        } catch (e: Exception) {
            logger.error("Error getting enrolled students for section $sectionId: ${e.message}", e)
            throw e
        }
    }

    override fun getUnassignedStudents(): List<UnassignedStudentResponse> {
        logger.info("Getting unassigned students")

        val rawResults = classEnrollmentRepository.findUnassignedStudents()

        return rawResults.map { row ->
            val user = row[0] as UserEntity
            val profile = row[1] as ProfileEntity

            UnassignedStudentResponse(
                studentId = user.id!!,
                studentName = "${profile.firstName} ${profile.lastName}",
                email = user.email,
                gradeLevel = profile.gradeLevel ?: "",
                parentName = profile.parentName,
                parentContact = profile.parentContact
            )
        }
    }

    override fun getAllStudentsWithEnrollmentStatus(): List<StudentWithEnrollmentResponse> {
        logger.info("Getting all students with enrollment status")

        val rawResults = classEnrollmentRepository.findAllStudentsWithEnrollmentStatus()

        return rawResults.map { row ->
            val user = row[0] as UserEntity
            val profile = row[1] as ProfileEntity
            val currentSectionId = row[2] as? UUID
            val currentSectionName = row[3] as? String
            val sectionGradeLevel = row[4] as? String
            val enrolledAt = row[5] as? LocalDateTime
            val schoolYear = row[6] as? String
            val quarter = row[7] as? com.kapston.CTU_DB_API.domain.Enums.Quarter

            val effectiveGradeLevel = when {
                currentSectionId != null -> sectionGradeLevel ?: profile.gradeLevel ?: ""
                else -> {
                    // For unassigned students, try to get their last enrolled grade level first
                    val lastGrade = classEnrollmentRepository.findLastEnrolledGradeLevel(user.id!!)
                    lastGrade ?: profile.gradeLevel ?: ""
                }
            }

            StudentWithEnrollmentResponse.fromEntity(
                studentId = user.id!!,
                studentName = "${profile.firstName} ${profile.lastName}",
                email = user.email,
                gradeLevel = effectiveGradeLevel,
                currentSectionId = currentSectionId,
                currentSectionName = currentSectionName,
                parentName = profile.parentName,
                parentContact = profile.parentContact,
                enrolledAt = enrolledAt,
                schoolYear = schoolYear,
                quarter = quarter
            )
        }
    }

    @Transactional
    override fun assignStudentToSection(request: EnrollmentRequest): String {
        logger.info("Assigning student ${request.studentId} to section ${request.sectionId}")

        // Verify student exists and is active or has pending profile
        val student = userRepository.findById(request.studentId)
            .orElseThrow { StudentNotFoundException("Student not found with id: ${request.studentId}") }

        if (student.status != com.kapston.CTU_DB_API.domain.Enums.StatusEnum.ACTIVE &&
            student.status != com.kapston.CTU_DB_API.domain.Enums.StatusEnum.PENDING_PROFILE) {
            throw StudentNotFoundException("Student is not active")
        }

        // Verify section exists
        val section = sectionRepository.findById(request.sectionId)
            .orElseThrow { SectionNotFoundException("Section not found with id: ${request.sectionId}") }

        // Check if student is already enrolled in this section
        if (classEnrollmentRepository.existsByStudentIdAndSectionId(request.studentId, request.sectionId)) {
            throw StudentAlreadyEnrolledException("Student is already enrolled in this section")
        }

        // Check if student is already enrolled in another section
        if (classEnrollmentRepository.existsByStudentId(request.studentId)) {
            throw StudentAlreadyEnrolledException("Student is already enrolled in another section")
        }

        // Create enrollment
        val enrollment = ClassEnrollmentEntity(
            student = student,
            section = section,
            schoolYear = request.schoolYear,
            quarter = request.quarter
        )

        classEnrollmentRepository.save(enrollment)

        // Update profile grade level if profile exists (created on first login)
        student.profile?.let { profile ->
            val updatedProfile = ProfileEntity(
                id = profile.id,
                userEntity = profile.userEntity,
                firstName = profile.firstName,
                lastName = profile.lastName,
                middleName = profile.middleName,
                gradeLevel = section.gradeLevel,
                gender = profile.gender,
                birthDate = profile.birthDate,
                contactNumber = profile.contactNumber,
                address = profile.address,
                parentName = profile.parentName,
                parentContact = profile.parentContact
            )
            profileService.saveOrUpdate(updatedProfile)
        }

        logger.info("Successfully assigned student ${request.studentId} to section ${request.sectionId}")
        return "Student successfully assigned to section"
    }

    @Transactional
    override fun moveStudentToSection(request: MoveStudentRequest): String {
        logger.info("Moving student ${request.studentId} to section ${request.newSectionId}")

        // Verify student exists and is active or has pending profile
        val student = userRepository.findById(request.studentId)
            .orElseThrow { StudentNotFoundException("Student not found with id: ${request.studentId}") }

        if (student.status != com.kapston.CTU_DB_API.domain.Enums.StatusEnum.ACTIVE &&
            student.status != com.kapston.CTU_DB_API.domain.Enums.StatusEnum.PENDING_PROFILE) {
            throw StudentNotFoundException("Student is not active")
        }

        // Verify new section exists
        val newSection = sectionRepository.findById(request.newSectionId)
            .orElseThrow { SectionNotFoundException("New section not found with id: ${request.newSectionId}") }

        // Check if student is already enrolled in the new section
        if (classEnrollmentRepository.existsByStudentIdAndSectionId(request.studentId, request.newSectionId)) {
            throw StudentAlreadyEnrolledException("Student is already enrolled in the target section")
        }

        // Remove from current section if enrolled - find and delete all existing enrollments for this student
        val existingEnrollments = classEnrollmentRepository.findByStudentId(request.studentId)
        if (existingEnrollments.isNotEmpty()) {
            logger.info("Removing ${existingEnrollments.size} existing enrollment(s) for student ${request.studentId}")
            classEnrollmentRepository.deleteAll(existingEnrollments)
        }

        // Create new enrollment
        val enrollment = ClassEnrollmentEntity(
            student = student,
            section = newSection,
            schoolYear = request.schoolYear,
            quarter = request.quarter
        )

        classEnrollmentRepository.save(enrollment)

        // Update profile grade level if profile exists (created on first login)
        student.profile?.let { profile ->
            val updatedProfile = ProfileEntity(
                id = profile.id,
                userEntity = profile.userEntity,
                firstName = profile.firstName,
                lastName = profile.lastName,
                middleName = profile.middleName,
                gradeLevel = newSection.gradeLevel,
                gender = profile.gender,
                birthDate = profile.birthDate,
                contactNumber = profile.contactNumber,
                address = profile.address,
                parentName = profile.parentName,
                parentContact = profile.parentContact
            )
            profileService.saveOrUpdate(updatedProfile)
        }

        logger.info("Successfully moved student ${request.studentId} to section ${request.newSectionId}")
        return "Student successfully moved to new section"
    }

    @Transactional
    override fun markStudentInactive(studentId: UUID): String {
        logger.info("Marking student $studentId as inactive")

        // Verify student exists
        val student = userRepository.findById(studentId)
            .orElseThrow { StudentNotFoundException("Student not found with id: $studentId") }

        // Remove all enrollments for this student
        val enrollments = classEnrollmentRepository.findByStudentId(studentId)
        classEnrollmentRepository.deleteAll(enrollments)

        // Update student status to inactive
        val updatedStudent = student.apply {
            status = com.kapston.CTU_DB_API.domain.Enums.StatusEnum.INACTIVE
        }
        userRepository.save(updatedStudent)

        logger.info("Successfully marked student $studentId as inactive and removed all enrollments")
        return "Student marked as inactive and removed from all sections"
    }

    @Transactional
    override fun removeStudentFromSection(studentId: UUID, sectionId: UUID): String {
        logger.info("Removing student $studentId from section $sectionId")

        // Verify enrollment exists
        val enrollment = classEnrollmentRepository.findByStudentIdAndSectionId(studentId, sectionId)
            ?: throw StudentNotEnrolledException("Student is not enrolled in this section")

        classEnrollmentRepository.delete(enrollment)

        logger.info("Successfully removed student $studentId from section $sectionId")
        return "Student successfully removed from section"
    }

    override fun getEnrollmentCountForSection(sectionId: UUID): Int {
        logger.info("Getting enrollment count for section: $sectionId")

        // Verify section exists
        sectionRepository.findById(sectionId)
            .orElseThrow { SectionNotFoundException("Section not found with id: $sectionId") }

        return classEnrollmentRepository.countBySectionId(sectionId).toInt()
    }

    @Transactional
    override fun removeStudentFromAllSections(studentId: UUID) {
        logger.info("Removing student $studentId from all sections")

        // Verify student exists
        userRepository.findById(studentId)
            .orElseThrow { StudentNotFoundException("Student not found with id: $studentId") }

        // Remove all enrollments for this student
        val enrollments = classEnrollmentRepository.findByStudentId(studentId)
        if (enrollments.isNotEmpty()) {
            classEnrollmentRepository.deleteAll(enrollments)
            logger.info("Removed ${enrollments.size} enrollment(s) for student $studentId")
        }
    }

    override fun getEnrollmentsBySection(sectionId: UUID): List<ClassEnrollmentEntity> {
        logger.info("Getting all enrollments for section: $sectionId")

        // Verify section exists
        sectionRepository.findById(sectionId)
            .orElseThrow { SectionNotFoundException("Section not found with id: $sectionId") }

        return classEnrollmentRepository.findBySectionId(sectionId)
    }
}
