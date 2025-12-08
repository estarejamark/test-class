package com.kapston.CTU_DB_API.service.implementation

import com.kapston.CTU_DB_API.domain.Enums.PackageStatus
import com.kapston.CTU_DB_API.domain.Enums.Quarter
import com.kapston.CTU_DB_API.domain.dto.response.AdviserResponse
import com.kapston.CTU_DB_API.domain.dto.response.AdvisorySuggestionResponse
import com.kapston.CTU_DB_API.domain.dto.response.QuarterPackageResponse
import com.kapston.CTU_DB_API.domain.dto.response.StudentResponse
import com.kapston.CTU_DB_API.domain.dto.response.StudentWithSuggestionsResponse
import com.kapston.CTU_DB_API.domain.entity.AdvisorySuggestionEntity
import com.kapston.CTU_DB_API.domain.entity.QuarterPackageEntity
import com.kapston.CTU_DB_API.repository.AdvisorySuggestionRepository
import com.kapston.CTU_DB_API.repository.ClassEnrollmentRepository
import com.kapston.CTU_DB_API.repository.QuarterPackageRepository
import com.kapston.CTU_DB_API.repository.SectionRepository
import com.kapston.CTU_DB_API.repository.UserRepository
import com.kapston.CTU_DB_API.service.abstraction.AdviserService
import com.kapston.CTU_DB_API.service.abstraction.SectionService
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.*

@Service
class AdviserServiceImplementation(
    private val quarterPackageRepository: QuarterPackageRepository,
    private val sectionRepository: SectionRepository,
    private val classEnrollmentRepository: ClassEnrollmentRepository,
    private val advisorySuggestionRepository: AdvisorySuggestionRepository,
    private val userRepository: UserRepository,
    private val sectionService: SectionService
) : AdviserService {

    private val logger: Logger = LoggerFactory.getLogger(AdviserServiceImplementation::class.java)

    override fun getQuarterPackagesForAdviser(adviserId: UUID): List<QuarterPackageResponse> {
        val adviser = userRepository.findById(adviserId)
            .orElseThrow { IllegalArgumentException("Adviser not found") }

        // Get the profile ID for this adviser
        val profileId = adviser.profile?.id ?: throw IllegalArgumentException("Adviser profile not found")

        val quarterPackages = quarterPackageRepository.findByAdviserId(profileId)

        return quarterPackages.map { quarterPackage ->
            QuarterPackageResponse(
                id = quarterPackage.id!!,
                section = quarterPackage.section.toResponse(),
                quarter = quarterPackage.quarter,
                status = quarterPackage.status,
                submittedAt = quarterPackage.submittedAt,
                adviser = quarterPackage.adviser?.let { AdviserResponse.fromEntity(it, sectionService) },
                createdAt = quarterPackage.createdAt,
                updatedAt = quarterPackage.updatedAt
            )
        }
    }

    override fun returnQuarterPackage(packageId: UUID, remarks: String): QuarterPackageResponse {
        val quarterPackage = quarterPackageRepository.findById(packageId)
            .orElseThrow { IllegalArgumentException("Quarter package not found") }

        quarterPackage.status = PackageStatus.RETURNED
        quarterPackage.remarks = remarks
        quarterPackage.updatedAt = java.time.LocalDateTime.now()

        val savedPackage = quarterPackageRepository.save(quarterPackage)

        return QuarterPackageResponse(
            id = savedPackage.id!!,
            section = savedPackage.section.toResponse(),
            quarter = savedPackage.quarter,
            status = savedPackage.status,
            submittedAt = savedPackage.submittedAt,
            adviser = savedPackage.adviser?.let { AdviserResponse.fromEntity(it, sectionService) },
            createdAt = savedPackage.createdAt,
            updatedAt = savedPackage.updatedAt
        )
    }

    override fun forwardQuarterPackageToAdmin(packageId: UUID): QuarterPackageResponse {
        val quarterPackage = quarterPackageRepository.findById(packageId)
            .orElseThrow { IllegalArgumentException("Quarter package not found") }

        quarterPackage.status = PackageStatus.FORWARDED_TO_ADMIN
        quarterPackage.updatedAt = java.time.LocalDateTime.now()

        val savedPackage = quarterPackageRepository.save(quarterPackage)

        return QuarterPackageResponse(
            id = savedPackage.id!!,
            section = savedPackage.section.toResponse(),
            quarter = savedPackage.quarter,
            status = savedPackage.status,
            submittedAt = savedPackage.submittedAt,
            adviser = savedPackage.adviser?.let { AdviserResponse.fromEntity(it, sectionService) },
            createdAt = savedPackage.createdAt,
            updatedAt = savedPackage.updatedAt
        )
    }

    override fun getAdvisoryClassList(adviserId: UUID): List<StudentWithSuggestionsResponse> {
        val adviser = userRepository.findById(adviserId)
            .orElseThrow { IllegalArgumentException("Adviser not found") }

        // Get the profile ID for this adviser
        val profileId = adviser.profile?.id ?: throw IllegalArgumentException("Adviser profile not found")

        // Get the section for this adviser using profile ID
        val section = sectionRepository.findByAdviserId(profileId).firstOrNull()
        if (section == null) {
            // Return empty list if no section found
            return emptyList()
        }

        // Get all active enrollments for this section
        val enrollments = classEnrollmentRepository.findBySectionIdAndIsActive(section.id!!, true)

        // Get student IDs for batch suggestion query
        val studentIds = enrollments.map { it.student.id!! }

        // Fetch all unresolved suggestions for these students in a single query
        val suggestionsMap = if (studentIds.isNotEmpty()) {
            advisorySuggestionRepository.findUnresolvedSuggestionsByAdviserAndStudents(adviserId, studentIds)
                .groupBy { it.student.id!! }
                .mapValues { it.value.map { suggestion -> suggestion.suggestion } }
        } else {
            emptyMap<UUID, List<String>>()
        }

        return enrollments.map { enrollment ->
            val student = enrollment.student
            val studentSuggestions = suggestionsMap[student.id!!] ?: emptyList()

            // Safely access profile data with error handling
            var profileId: UUID?
            var firstName: String
            var middleName: String?
            var lastName: String
            var hasCompleteProfile: Boolean

            try {
                val profile = student.profile
                profileId = profile?.id
                firstName = profile?.firstName ?: ""
                middleName = profile?.middleName
                lastName = profile?.lastName ?: ""
                hasCompleteProfile = profile != null

                if (profile == null) {
                    logger.warn("Student ${student.id} (${student.studentId}) has no profile data")
                } else if (firstName.isBlank() || lastName.isBlank()) {
                    logger.warn("Student ${student.id} (${student.studentId}) has incomplete profile data: firstName='$firstName', lastName='$lastName'")
                }
            } catch (e: Exception) {
                logger.error("Error accessing profile data for student ${student.id} (${student.studentId}): ${e.message}", e)
                profileId = null
                firstName = ""
                middleName = null
                lastName = ""
                hasCompleteProfile = false
            }

            StudentWithSuggestionsResponse(
                studentId = student.studentId!!,
                userId = student.id!!,
                profileId = profileId,
                email = student.email ?: "",
                firstName = firstName,
                middleName = middleName,
                lastName = lastName,
                gradeLevel = section.gradeLevel,
                sectionId = section.id!!,
                sectionName = section.name,
                schoolYear = enrollment.schoolYear,
                quarter = enrollment.quarter,
                enrolledAt = enrollment.enrolledAt,
                isActive = enrollment.isActive,
                hasCompleteProfile = hasCompleteProfile,
                pendingSuggestions = studentSuggestions
            )
        }
    }

    @Transactional
    override fun suggestAdvisoryClassUpdate(adviserId: UUID, studentId: UUID, suggestion: String) {
        val adviser = userRepository.findById(adviserId)
            .orElseThrow { IllegalArgumentException("Adviser not found") }

        val student = userRepository.findById(studentId)
            .orElseThrow { IllegalArgumentException("Student not found") }

        // Validate that the student belongs to the adviser's section
        validateAdviserStudentRelationship(adviserId, studentId)

        val advisorySuggestion = AdvisorySuggestionEntity(
            adviser = adviser,
            student = student,
            suggestion = suggestion,
            isResolved = false
        )

        advisorySuggestionRepository.save(advisorySuggestion)
    }

    override fun getPendingSuggestionsForStudent(studentId: UUID): List<String> {
        return advisorySuggestionRepository.findUnresolvedSuggestionsByStudentId(studentId)
            .map { it.suggestion }
    }

    override fun getAllSuggestionsForAdviser(adviserId: UUID): List<AdvisorySuggestionResponse> {
        return advisorySuggestionRepository.findSuggestionsByAdviserId(adviserId)
            .map { suggestion ->
                // Safely access adviser profile data
                val adviserName = try {
                    val adviserProfile = suggestion.adviser.profile
                    "${adviserProfile?.firstName ?: ""} ${adviserProfile?.lastName ?: ""}".trim()
                } catch (e: Exception) {
                    logger.warn("Error accessing adviser profile for suggestion ${suggestion.id}: ${e.message}")
                    "Unknown Adviser"
                }

                // Safely access student profile data
                val studentName = try {
                    val studentProfile = suggestion.student.profile
                    "${studentProfile?.firstName ?: ""} ${studentProfile?.lastName ?: ""}".trim()
                } catch (e: Exception) {
                    logger.warn("Error accessing student profile for suggestion ${suggestion.id}: ${e.message}")
                    "Unknown Student"
                }

                AdvisorySuggestionResponse(
                    suggestion.id!!,
                    suggestion.adviser.id!!,
                    adviserName,
                    suggestion.student.id!!,
                    studentName,
                    suggestion.suggestion,
                    suggestion.isResolved,
                    suggestion.createdAt!!,
                    suggestion.updatedAt!!
                )
            }
    }

    override fun getAdviserSectionInfo(adviserId: UUID): com.kapston.CTU_DB_API.domain.dto.response.SectionResponse? {
        val adviser = userRepository.findById(adviserId)
            .orElseThrow { IllegalArgumentException("Adviser not found") }

        // Get the profile ID for this adviser
        val profileId = adviser.profile?.id ?: return null

        val section = sectionRepository.findByAdviserId(profileId).firstOrNull()
        return section?.let {
            com.kapston.CTU_DB_API.domain.dto.response.SectionResponse(
                id = it.id!!,
                name = it.name,
                gradeLevel = it.gradeLevel,
                adviserId = it.adviserId,
                adviserName = it.adviserName,
                createdAt = it.createdAt!!,
                updatedAt = it.updatedAt!!
            )
        }
    }

    override fun validateAdviserStudentRelationship(adviserId: UUID, studentId: UUID) {
        val adviser = userRepository.findById(adviserId)
            .orElseThrow { IllegalArgumentException("Adviser not found") }

        // Get the profile ID for this adviser
        val profileId = adviser.profile?.id ?: throw IllegalArgumentException("Adviser profile not found")

        // Get the section for this adviser using profile ID
        val section = sectionRepository.findByAdviserId(profileId).firstOrNull()
            ?: throw IllegalArgumentException("No section found for adviser")

        // Check if the student is enrolled in the adviser's section
        val isStudentInSection = classEnrollmentRepository.existsBySectionIdAndStudentIdAndIsActive(section.id!!, studentId, true)

        if (!isStudentInSection) {
            throw IllegalArgumentException("Student does not belong to the adviser's section")
        }
    }
}
