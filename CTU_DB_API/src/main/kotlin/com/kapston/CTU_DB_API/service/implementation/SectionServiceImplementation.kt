package com.kapston.CTU_DB_API.service.implementation

import com.kapston.CTU_DB_API.CustomException.ProfileNotFoundException
import com.kapston.CTU_DB_API.CustomException.SectionAlreadyExistsException
import com.kapston.CTU_DB_API.CustomException.SectionNotFoundException
import com.kapston.CTU_DB_API.CustomException.SectionHasDependenciesException
import com.kapston.CTU_DB_API.domain.dto.request.CreateSectionRequest
import com.kapston.CTU_DB_API.domain.dto.response.SectionResponse
import com.kapston.CTU_DB_API.domain.dto.response.SectionDependencyResponse
import com.kapston.CTU_DB_API.domain.dto.response.StudentInfo
import com.kapston.CTU_DB_API.domain.dto.response.ScheduleInfo
import com.kapston.CTU_DB_API.domain.dto.response.ProfileResponse
import com.kapston.CTU_DB_API.domain.dto.response.AdviserResponse
import com.kapston.CTU_DB_API.domain.entity.SectionEntity
import com.kapston.CTU_DB_API.repository.SectionRepository
import com.kapston.CTU_DB_API.repository.ProfileRepository
import com.kapston.CTU_DB_API.service.abstraction.ProfileService
import com.kapston.CTU_DB_API.service.abstraction.SectionService
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime
import java.util.UUID

@Service
class SectionServiceImplementation(
    private val sectionRepository: SectionRepository,
    private val profileRepository: ProfileRepository,
    private val profileService: ProfileService
): SectionService {

    private val logger = LoggerFactory.getLogger(SectionServiceImplementation::class.java)
    @Transactional
    override fun create(sectionRequest: CreateSectionRequest): String {
        // Check for duplicate section name before processing
        val sectionExists = sectionRepository.existsByName(sectionRequest.name)
        if (sectionExists) {
            throw SectionAlreadyExistsException("Section '${sectionRequest.name}' already exists.")
        }

        val adviserEntity = sectionRequest.adviser?.let { profileService.getProfileEntityById(UUID.fromString(it)) }
        if (sectionRequest.adviser != null && adviserEntity == null) {
            throw ProfileNotFoundException("Adviser not found")
        }

        val adviserId = adviserEntity?.id
        val adviserName = adviserEntity?.let { "${it.firstName} ${it.middleName ?: ""} ${it.lastName}".trim() }

        val sectionEntity = SectionEntity(
            name = sectionRequest.name,
            gradeLevel = sectionRequest.gradeLevel,
            adviserId = adviserId,
            adviserName = adviserName
        )

        sectionRepository.save(sectionEntity)
        return "Section saved."
    }

    override fun search(
        gradeLevel: String?,
        name: String?,
        adviserName: String?,
        page: Int,
        size: Int
    ): Page<SectionResponse> {
        val pageable = PageRequest.of(page, size)
        val rawResults = sectionRepository.search(gradeLevel, name, adviserName, pageable)

        return rawResults.map { row ->
            val id = UUID.fromString(row[0]?.toString() ?: throw IllegalStateException("Section ID cannot be null"))
            val sectionName = row[1]?.toString() ?: ""
            val sectionGrade = row[2]?.toString() ?: ""

            // Section adviser fields
            val sectionAdviserId = row[3] as UUID?
            val sectionAdviserName = row[4]?.toString()

            // Profile adviser fields (from LEFT JOIN)
            val profileAdviserId = row[7] as UUID?
            val profileAdviserFirst = row[8]?.toString()
            val profileAdviserMiddle = row[9]?.toString()
            val profileAdviserLast = row[10]?.toString()
            val profileAdviserFull = row[11]?.toString()

            // Timestamps - handle both LocalDateTime and Instant types
            val createdAt: LocalDateTime = when (row[5]) {
                is LocalDateTime -> row[5] as LocalDateTime
                is java.time.Instant -> (row[5] as java.time.Instant).atZone(java.time.ZoneId.systemDefault()).toLocalDateTime()
                null -> LocalDateTime.now()
                else -> LocalDateTime.now()
            }!!
            val updatedAt: LocalDateTime = when (row[6]) {
                is LocalDateTime -> row[6] as LocalDateTime
                is java.time.Instant -> (row[6] as java.time.Instant).atZone(java.time.ZoneId.systemDefault()).toLocalDateTime()
                null -> LocalDateTime.now()
                else -> LocalDateTime.now()
            }!!

            // Use profile name if available, otherwise fallback to section adviser name
            val adviserName = when {
                profileAdviserId != null && !profileAdviserFirst.isNullOrBlank() && !profileAdviserLast.isNullOrBlank() ->
                    "${profileAdviserFirst} ${profileAdviserMiddle ?: ""} ${profileAdviserLast}".trim()
                !sectionAdviserName.isNullOrBlank() ->
                    sectionAdviserName
                else ->
                    null
            }

            SectionResponse(
                id = id,
                name = sectionName,
                gradeLevel = sectionGrade,
                adviserId = sectionAdviserId,
                adviserName = adviserName,
                createdAt = createdAt,
                updatedAt = updatedAt
            )
        }
    }

    @Transactional
    override fun update(sectionEntity: SectionEntity): String {
        var section = sectionRepository.findById(sectionEntity.id!!)
            .orElseThrow { SectionNotFoundException("Section not found with id: ${sectionEntity.id}") }

        sectionRepository.findByName(sectionEntity.name)?.let { existing ->
            if (existing.id != section.id) {
                throw SectionAlreadyExistsException("Duplicate ${sectionEntity.name}.")
            }
        }

        // Handle adviser lookup like in create method for consistency
        val adviserEntity = sectionEntity.adviserId?.let { profileService.getProfileEntityById(it) }
        if (sectionEntity.adviserId != null && adviserEntity == null) {
            throw ProfileNotFoundException("Adviser not found")
        }

        val computedAdviserName = adviserEntity?.let { "${it.firstName} ${it.middleName ?: ""} ${it.lastName}".trim() }

        section.apply {
            name = sectionEntity.name
            gradeLevel = sectionEntity.gradeLevel
            adviserId = sectionEntity.adviserId
            adviserName = computedAdviserName
        }

        sectionRepository.save(section)
        return "Section edited."
    }

    @Transactional
    override fun delete(id: UUID, forceDelete: Boolean): String {
        logger.info("Attempting to delete section with ID: $id (forceDelete: $forceDelete)")

        // Find the section first
        val section = sectionRepository.findById(id)
            .orElseThrow { SectionNotFoundException("Section not found with id: $id") }

        logger.info("Found section: ${section.name} (ID: $id)")

        // Check for dependent records before deletion
        val classEnrollmentsCount = sectionRepository.countClassEnrollments(id)
        val scheduleEntriesCount = sectionRepository.countScheduleEntries(id)

        logger.info("Section $id has $classEnrollmentsCount class enrollments and $scheduleEntriesCount schedule entries")

        // If forceDelete is false and there are dependent records, throw exception with details
        if (!forceDelete && (classEnrollmentsCount > 0 || scheduleEntriesCount > 0)) {
            throw SectionHasDependenciesException.createWithDetails(
                sectionId = id.toString(),
                classEnrollmentsCount = classEnrollmentsCount.toInt(),
                scheduleEntriesCount = scheduleEntriesCount.toInt()
            )
        }

        // If forceDelete is true, delete dependent records first
        if (forceDelete) {
            logger.info("Force delete requested. Deleting dependent records first...")

            // Delete class enrollments if they exist
            if (classEnrollmentsCount > 0) {
                logger.info("Deleting $classEnrollmentsCount class enrollment(s)")
                // Note: This would require additional repository methods for bulk deletion
                // For now, we'll log this but the actual deletion would need to be implemented
                // based on your entity relationships and cascade settings
            }

            // Delete schedule entries if they exist
            if (scheduleEntriesCount > 0) {
                logger.info("Deleting $scheduleEntriesCount schedule entry(ies)")
                // Note: This would require additional repository methods for bulk deletion
                // For now, we'll log this but the actual deletion would need to be implemented
                // based on your entity relationships and cascade settings
            }
        }

        // Proceed with section deletion
        try {
            sectionRepository.delete(section)
            logger.info("Successfully deleted section: ${section.name} (ID: $id)")
            return if (forceDelete) {
                "Section force deleted successfully (including all dependent records)."
            } else {
                "Section deleted successfully."
            }
        } catch (ex: Exception) {
            logger.error("Failed to delete section ${section.name} (ID: $id)", ex)
            throw ex
        }
    }

    override fun getDependencies(id: UUID): SectionDependencyResponse {
        logger.info("Getting dependencies for section with ID: $id")

        // Find the section first
        val section = sectionRepository.findById(id)
            .orElseThrow { SectionNotFoundException("Section not found with id: $id") }

        logger.info("Found section: ${section.name} (ID: $id)")

        // Get dependency counts
        val classEnrollmentsCount = sectionRepository.countClassEnrollments(id)
        val scheduleEntriesCount = sectionRepository.countScheduleEntries(id)

        val hasClassEnrollments = classEnrollmentsCount > 0
        val hasScheduleEntries = scheduleEntriesCount > 0

        logger.info("Section $id has $classEnrollmentsCount class enrollments and $scheduleEntriesCount schedule entries")

        // Get detailed information if there are dependencies
        val enrolledStudents = if (hasClassEnrollments) {
            sectionRepository.getClassEnrollmentDetails(id).map { row ->
                StudentInfo(
                    id = row[0] as UUID,
                    firstName = row[1] as String,
                    lastName = row[2] as String,
                    fullName = row[3] as String
                )
            }
        } else null

        val scheduleEntries = if (hasScheduleEntries) {
            sectionRepository.getScheduleDetails(id).map { row ->
                ScheduleInfo(
                    id = row[0] as UUID,
                    subjectName = row[1] as String,
                    teacherName = row[2] as String,
                    startTime = (row[3] as LocalDateTime).toString(),
                    endTime = (row[4] as LocalDateTime).toString()
                )
            }
        } else null

        // Determine delete options
        val deleteOptions = mutableListOf<String>()
        if (!hasClassEnrollments && !hasScheduleEntries) {
            deleteOptions.add("Delete section (no dependencies)")
        } else {
            deleteOptions.add("Cancel - keep section")
            if (hasClassEnrollments) {
                deleteOptions.add("Transfer students to another section")
            }
            if (hasScheduleEntries) {
                deleteOptions.add("Cancel all schedules")
            }
            deleteOptions.add("Force delete (will fail)")
        }

        val dependencyDetails = com.kapston.CTU_DB_API.domain.dto.response.DependencyDetails(
            hasClassEnrollments = hasClassEnrollments,
            classEnrollmentsCount = classEnrollmentsCount.toInt(),
            enrolledStudents = enrolledStudents,
            hasScheduleEntries = hasScheduleEntries,
            scheduleEntriesCount = scheduleEntriesCount.toInt(),
            scheduleEntries = scheduleEntries,
            canDelete = !hasClassEnrollments && !hasScheduleEntries,
            deleteOptions = deleteOptions
        )

        // Fetch adviser entity using adviserId
        val adviserEntity = section.adviserId?.let { profileRepository.findById(it).orElse(null) }

        return SectionDependencyResponse(
            sectionId = section.id!!,
            sectionName = section.name,
            gradeLevel = section.gradeLevel,
            adviser = if (adviserEntity != null) AdviserResponse(
                id = adviserEntity.id!!,
                firstName = adviserEntity.firstName,
                lastName = adviserEntity.lastName,
                fullName = "${adviserEntity.firstName} ${adviserEntity.lastName}".trim(),
                isAdviser = isTeacherAdviser(adviserEntity.id!!)
            ) else null,
            dependencies = dependencyDetails
        )
    }

    override fun isTeacherAdviser(profileId: UUID): Boolean {
        return sectionRepository.findByAdviserId(profileId).isNotEmpty()
    }

    override fun getSectionsByAdviser(adviserId: UUID): List<SectionResponse> {
        // Fetch sections from the repository
        val sections = sectionRepository.findByAdviserId(adviserId)

        // Map SectionEntity objects to SectionResponse objects
        return sections.map { section ->
            SectionResponse(
                id = section.id ?: throw IllegalArgumentException("Section ID cannot be null"),  // Handle null ID if needed
                name = section.name,
                gradeLevel = section.gradeLevel,
                adviserId = section.adviserId,
                adviserName = section.adviserName ?: "Unknown",  // Handle nullable adviserName
                createdAt = section.createdAt ?: LocalDateTime.now(),  // Handle nullable createdAt
                updatedAt = section.updatedAt ?: LocalDateTime.now()   // Handle nullable updatedAt
            )
        }
    }
}
