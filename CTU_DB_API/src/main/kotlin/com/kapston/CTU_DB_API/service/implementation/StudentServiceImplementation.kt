package com.kapston.CTU_DB_API.service.implementation

import com.kapston.CTU_DB_API.CustomException.SectionCapacityExceededException
import com.kapston.CTU_DB_API.CustomException.SectionNotFoundException
import com.kapston.CTU_DB_API.CustomException.StudentAlreadyEnrolledException
import com.kapston.CTU_DB_API.CustomException.StudentNotFoundException
import com.kapston.CTU_DB_API.CustomException.UserAlreadyExistsException
import com.kapston.CTU_DB_API.domain.dto.request.CreateStudentRequest
import com.kapston.CTU_DB_API.domain.dto.request.EnrollmentRequest
import com.kapston.CTU_DB_API.domain.dto.request.MoveStudentRequest
import com.kapston.CTU_DB_API.domain.dto.request.UpdateStudentRequest
import com.kapston.CTU_DB_API.domain.Enums.Quarter
import com.kapston.CTU_DB_API.domain.Enums.Role
import com.kapston.CTU_DB_API.domain.Enums.StatusEnum
import com.kapston.CTU_DB_API.domain.dto.response.BulkCreateResult
import com.kapston.CTU_DB_API.domain.dto.response.BulkCreateFailure
import com.kapston.CTU_DB_API.domain.dto.response.StudentResponse
import com.kapston.CTU_DB_API.domain.entity.ClassEnrollmentEntity
import com.kapston.CTU_DB_API.domain.entity.ProfileEntity
import com.kapston.CTU_DB_API.domain.entity.SectionEntity
import com.kapston.CTU_DB_API.domain.entity.UserEntity
import com.kapston.CTU_DB_API.repository.SectionRepository
import com.kapston.CTU_DB_API.repository.UserRepository
import com.kapston.CTU_DB_API.service.abstraction.ClassEnrollmentService
import com.kapston.CTU_DB_API.service.abstraction.ProfileService
import com.kapston.CTU_DB_API.service.abstraction.StudentService
import com.kapston.CTU_DB_API.service.abstraction.UserService
import com.kapston.CTU_DB_API.utility.HashUtils.hashPassword
import org.slf4j.LoggerFactory
import org.springframework.data.domain.PageRequest
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
class StudentServiceImplementation(
    private val userService: UserService,
    private val profileService: ProfileService,
    private val classEnrollmentService: ClassEnrollmentService,
    private val userRepository: UserRepository,
    private val sectionRepository: SectionRepository,
    private val passwordEncoder: PasswordEncoder
) : StudentService {

    private val logger = LoggerFactory.getLogger(StudentServiceImplementation::class.java)

    @Transactional
    override fun createStudentWithEnrollment(request: CreateStudentRequest): StudentResponse {
        logger.info("Creating student with enrollment: ${request.email}")

        try {
                // Step 1: Create user account
                val registerRequest = com.kapston.CTU_DB_API.domain.dto.request.RegisterRequest(
                    email = request.email,
                    password = request.password,   // just pass nullable
                    role = request.role
                )

            val userId = UUID.fromString(userService.create(registerRequest))
            logger.info("✅ User account created with ID: $userId")

            // Step 2: Store profile data in user entity (profile will be created on first login)
            val user = userService.getUserEntity(userId)
            user.firstName = request.firstName
            user.lastName = request.lastName
            user.middleName = request.middleName ?: ""
            user.gender = com.kapston.CTU_DB_API.domain.Enums.Gender.valueOf(request.gender.uppercase())
            user.birthDate = java.time.LocalDate.parse(request.birthDate)
            user.contactNumber = request.standardizedContactNumber
            user.address = request.address
            user.parentName = request.parentName
            user.parentContact = request.standardizedParentContact
            userRepository.save(user)
            logger.info("✅ Profile data stored in user entity (profile will be created on first login)")

            // Step 3: Validate section and enroll student
            val section = sectionRepository.findById(request.sectionId)
                .orElseThrow { SectionNotFoundException("Section not found with id: ${request.sectionId}") }

            // Check section capacity
            if (!validateSectionCapacity(request.sectionId)) {
                throw IllegalStateException("Section ${section.name} has reached maximum capacity")
            }

            val enrollmentRequest = EnrollmentRequest(
                studentId = userId,
                sectionId = request.sectionId,
                schoolYear = request.schoolYear,
                quarter = request.quarter
            )

            classEnrollmentService.assignStudentToSection(enrollmentRequest)
            logger.info("✅ Student enrolled in section: ${section.name}")

            // Step 4: Return response (profile will be created on first login)
            return StudentResponse(
                studentId = userId,
                userId = userId,
                profileId = null, // Profile not created yet
                email = request.email,
                firstName = request.firstName,
                lastName = request.lastName,
                middleName = request.middleName,
                gradeLevel = section.gradeLevel.toString(),
                sectionId = request.sectionId,
                sectionName = section.name,
                schoolYear = request.schoolYear,
                quarter = request.quarter,
                enrolledAt = java.time.LocalDateTime.now(),
                isActive = true,
                hasCompleteProfile = false // Profile will be created on first login
            )

        } catch (e: Exception) {
            logger.error("❌ Failed to create student with enrollment: ${e.message}", e)
            throw e // Transaction will rollback automatically
        }
    }

    @Transactional
    override fun updateStudentWithEnrollment(studentId: UUID, request: UpdateStudentRequest): StudentResponse {
        logger.info("Updating student with enrollment: $studentId")

        try {
            val user = userService.getUserWithEnrollments(studentId)
                ?: throw StudentNotFoundException("Student not found with id: $studentId")

            // --- Update profile if provided ---
            if (request.firstName != null || request.lastName != null || request.middleName != null ||
                request.gender != null || request.birthDate != null || request.contactNumber != null ||
                request.address != null || request.parentName != null || request.parentContact != null) {
                val profile = user.profile ?: throw IllegalStateException("Student profile not found")
                val updatedProfile = profile.apply {
                    if (request.firstName != null) firstName = request.firstName
                    if (request.lastName != null) lastName = request.lastName
                    if (request.middleName != null) middleName = request.middleName
                    if (request.gender != null) gender = com.kapston.CTU_DB_API.domain.Enums.Gender.valueOf(request.gender.uppercase())
                    if (request.birthDate != null) birthDate = java.time.LocalDate.parse(request.birthDate)
                    if (request.contactNumber != null) contactNumber = request.standardizedContactNumber
                    if (request.address != null) address = request.address
                    if (request.parentName != null) parentName = request.parentName
                    if (request.parentContact != null) parentContact = request.standardizedParentContact
                }
                profileService.saveOrUpdate(updatedProfile)
                logger.info("✅ Student profile updated")
            }

            // --- Update email if provided ---
            if (request.email != null && request.email != user.email) {
                userService.updateUser(studentId, request.email, null, null, null)
                logger.info("✅ Student email updated")
            }

            // --- Handle section change or first-time enrollment ---
            if (request.newSectionId != null) {
                val newSectionId = request.newSectionId
                val currentEnrollment = user.enrollments.firstOrNull()

                if (currentEnrollment != null && currentEnrollment.section.id != request.newSectionId) {
                    // Move existing enrollment
                    if (!validateSectionCapacity(request.newSectionId)) {
                        throw IllegalStateException("New section has reached maximum capacity")
                    }

                    val moveRequest = MoveStudentRequest(
                        studentId = studentId,
                        newSectionId = request.newSectionId,
                        schoolYear = request.schoolYear ?: currentEnrollment.schoolYear,
                        quarter = request.quarter ?: currentEnrollment.quarter
                    )
                    classEnrollmentService.moveStudentToSection(moveRequest)
                    logger.info("✅ Student moved to new section")

                } else if (currentEnrollment == null) {
                    // First-time assignment
                    val enrollmentRequest = EnrollmentRequest(
                        studentId = studentId,
                        sectionId = request.newSectionId,
                        schoolYear = request.schoolYear ?: "2025-2026",
                        quarter = request.quarter ?: com.kapston.CTU_DB_API.domain.Enums.Quarter.Q1
                    )
                    classEnrollmentService.assignStudentToSection(enrollmentRequest)
                    logger.info("✅ Student assigned to new section")
                }

                // --- Update profile grade level to match new section ---
                val updatedUser = userService.getUserWithEnrollments(studentId)
                    ?: throw StudentNotFoundException("Student not found after update")
                val enrollment = updatedUser.enrollments.firstOrNull()
                val profile = updatedUser.profile

                if (profile != null && enrollment != null) {
                    val updatedProfile = ProfileEntity(
                        id = profile.id,
                        userEntity = profile.userEntity,
                        firstName = profile.firstName,
                        lastName = profile.lastName,
                        middleName = profile.middleName,
                        gradeLevel = enrollment.section.gradeLevel, // latest grade
                        gender = profile.gender,
                        birthDate = profile.birthDate,
                        contactNumber = profile.contactNumber,
                        address = profile.address,
                        parentName = profile.parentName,
                        parentContact = profile.parentContact
                    )
                    profileService.saveOrUpdate(updatedProfile)
                    logger.info("✅ Profile grade level updated to match section")
                }
            }

            // --- Return updated student details ---
            return getStudentDetails(studentId)

        } catch (e: Exception) {
            logger.error("❌ Failed to update student with enrollment: ${e.message}", e)
            throw e
        }
    }

    override fun getStudentDetails(studentId: UUID): StudentResponse {
        val user = userService.getUserWithEnrollments(studentId)
            ?: throw StudentNotFoundException("Student not found with id: $studentId")

        val enrollment = user.enrollments.firstOrNull()
        val profile = user.profile

        return StudentResponse(
            studentId = user.id!!,
            userId = user.id!!,
            profileId = profile?.id,
            email = user.email,
            firstName = profile?.firstName ?: user.firstName ?: "",
            lastName = profile?.lastName ?: user.lastName ?: "",
            middleName = profile?.middleName,
            gradeLevel = enrollment?.section?.gradeLevel?.toString(),
            sectionId = enrollment?.section?.id,
            sectionName = enrollment?.section?.name,
            schoolYear = enrollment?.schoolYear,
            quarter = enrollment?.quarter,
            enrolledAt = enrollment?.enrolledAt,
            isActive = user.status != com.kapston.CTU_DB_API.domain.Enums.StatusEnum.INACTIVE,
            hasCompleteProfile = profile != null
        )
    }

    override fun getAllStudentsWithEnrollmentStatus(page: Int, size: Int): Pair<List<StudentResponse>, Long> {
        // Fetch all students with their enrollments
        val students = userRepository.findByRoleWithEnrollments(com.kapston.CTU_DB_API.domain.Enums.Role.STUDENT)

        // Apply manual pagination since repository returns List<UserEntity>
        val startIndex = page * size
        val endIndex = (startIndex + size).coerceAtMost(students.size)
        val pagedStudents = if (startIndex < students.size) students.subList(startIndex, endIndex) else emptyList()

        // Convert each user to StudentResponse, filtering out users with null IDs
        val studentResponses = pagedStudents.mapNotNull { user -> user.id?.let { getStudentDetails(it) } }

        return Pair(studentResponses, students.size.toLong())
    }

    override fun validateSectionCapacity(sectionId: UUID): Boolean {
        val section = sectionRepository.findById(sectionId)
            .orElseThrow { SectionNotFoundException("Section not found with id: $sectionId") }

        // Get current enrollment count for this section
        val currentEnrollmentCount = classEnrollmentService.getEnrollmentCountForSection(sectionId)

        // Assume default capacity of 50 students per section if not specified
        val maxCapacity = section.capacity ?: 50

        return currentEnrollmentCount < maxCapacity
    }

    override fun checkAdviserConflicts(userId: UUID): List<String> {
        val user = userService.getUserWithEnrollments(userId)
            ?: throw StudentNotFoundException("User not found with id: $userId")

        val profile = user.profile ?: return emptyList()

        // Check if this profile is assigned as adviser to any sections
        val adviserSections = sectionRepository.findByAdviserId(profile.id!!)

        return adviserSections.map { section ->
            "Section ${section.gradeLevel}-${section.name}"
        }.toList()
    }

    @Transactional
    override fun deleteStudent(studentId: UUID) {
        logger.info("Soft deleting student: $studentId")

        val user = userService.getUserWithEnrollments(studentId)
            ?: throw StudentNotFoundException("Student not found with id: $studentId")

        // Soft delete by deactivating the user
        userService.updateUser(studentId, null, null, null, com.kapston.CTU_DB_API.domain.Enums.StatusEnum.INACTIVE)

        // Remove all enrollments for this student
        classEnrollmentService.removeStudentFromAllSections(studentId)

        logger.info("✅ Student $studentId soft deleted successfully")
    }

    override fun searchStudents(query: String, page: Int, size: Int): Pair<List<StudentResponse>, Long> {
        logger.info("Searching students with query: '$query', page: $page, size: $size")

        // Search in user repository for students matching the query
        val students = userRepository.searchStudentsByQuery(query.trim())

        // Apply manual pagination
        val startIndex = page * size
        val endIndex = (startIndex + size).coerceAtMost(students.size)
        val pagedStudents = if (startIndex < students.size) students.subList(startIndex, endIndex) else emptyList()

        // Convert to StudentResponse
        val studentResponses = pagedStudents.mapNotNull { user -> user.id?.let { getStudentDetails(it) } }

        return Pair(studentResponses, students.size.toLong())
    }

    @Transactional
    override fun bulkCreateStudents(requests: List<CreateStudentRequest>): BulkCreateResult {
        logger.info("Bulk creating ${requests.size} students")

        val successful = mutableListOf<StudentResponse>()
        val failed = mutableListOf<BulkCreateFailure>()

        requests.forEach { request ->
            try {
                val student = createStudentWithEnrollment(request)
                successful.add(student)
                logger.info("✅ Bulk created student: ${request.email}")
            } catch (e: Exception) {
                failed.add(BulkCreateFailure(request, e.message ?: "Unknown error"))
                logger.warn("❌ Failed to bulk create student ${request.email}: ${e.message}")
            }
        }

        logger.info("Bulk creation completed: ${successful.size} successful, ${failed.size} failed")
        return BulkCreateResult(successful, failed)
    }

    override fun getStudentsBySection(sectionId: UUID, page: Int, size: Int): Pair<List<StudentResponse>, Long> {
        logger.info("Getting students for section: $sectionId, page: $page, size: $size")

        // Verify section exists
        sectionRepository.findById(sectionId)
            .orElseThrow { SectionNotFoundException("Section not found with id: $sectionId") }

        // Get enrollments for this section
        val enrollments = classEnrollmentService.getEnrollmentsBySection(sectionId)

        // Apply pagination
        val startIndex = page * size
        val endIndex = (startIndex + size).coerceAtMost(enrollments.size)
        val pagedEnrollments = if (startIndex < enrollments.size) enrollments.subList(startIndex, endIndex) else emptyList()

        // Convert enrollments to student responses
        val studentResponses = pagedEnrollments.mapNotNull { enrollment ->
            try {
                enrollment.student.id?.let { getStudentDetails(it) }
            } catch (e: Exception) {
                logger.warn("Failed to get details for student ${enrollment.student.id}: ${e.message}")
                null
            }
        }

        return Pair(studentResponses, enrollments.size.toLong())
    }

    private fun generateStudentId(): String {
        // Generate a unique student ID (you can customize this logic)
        val timestamp = System.currentTimeMillis()
        val random = (1000..9999).random()
        return "STU$timestamp$random"
    }
}
