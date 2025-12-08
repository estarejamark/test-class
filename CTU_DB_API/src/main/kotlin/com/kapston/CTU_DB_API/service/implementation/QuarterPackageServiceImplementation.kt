package com.kapston.CTU_DB_API.service.implementation

import com.kapston.CTU_DB_API.domain.Enums.PackageStatus
import com.kapston.CTU_DB_API.domain.Enums.Quarter
import com.kapston.CTU_DB_API.domain.dto.response.QuarterPackageResponse
import com.kapston.CTU_DB_API.domain.entity.QuarterPackageEntity
import com.kapston.CTU_DB_API.repository.ProfileRepository
import com.kapston.CTU_DB_API.repository.QuarterPackageRepository
import com.kapston.CTU_DB_API.repository.SectionRepository
import com.kapston.CTU_DB_API.repository.UserRepository
import com.kapston.CTU_DB_API.service.abstraction.QuarterPackageService
import com.kapston.CTU_DB_API.service.abstraction.SectionService
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime
import java.util.*

@Service
class QuarterPackageServiceImplementation(
    private val quarterPackageRepository: QuarterPackageRepository,
    private val sectionRepository: SectionRepository,
    private val profileRepository: ProfileRepository,
    private val userRepository: UserRepository,
    private val sectionService: SectionService
) : QuarterPackageService {

    override fun getAllQuarterPackages(): List<QuarterPackageResponse> {
        return quarterPackageRepository.findAll().map { it.toResponse(sectionService) }
    }

    override fun getQuarterPackageById(id: UUID): QuarterPackageResponse? {
        return quarterPackageRepository.findById(id).orElse(null)?.toResponse(sectionService)
    }

    override fun getQuarterPackagesBySectionId(sectionId: UUID): List<QuarterPackageResponse> {
        return quarterPackageRepository.findBySectionId(sectionId).map { it.toResponse(sectionService) }
    }

    override fun getQuarterPackagesByAdviserId(adviserId: UUID): List<QuarterPackageResponse> {
        // adviserId here is user ID, but QuarterPackageEntity stores profile ID
        // We need to find the profile ID for this user
        val user = userRepository.findById(adviserId)
            .orElseThrow { IllegalArgumentException("Adviser not found") }

        val profileId = user.profile?.id ?: throw IllegalArgumentException("Adviser profile not found")

        return quarterPackageRepository.findByAdviserId(profileId).map { it.toResponse(sectionService) }
    }

    override fun getQuarterPackagesByStatus(status: String): List<QuarterPackageResponse> {
        return quarterPackageRepository.findByStatus(status).map { it.toResponse(sectionService) }
    }

    @Transactional
    override fun createQuarterPackage(sectionId: UUID, quarter: String): QuarterPackageResponse {
        val section = sectionRepository.findById(sectionId)
            .orElseThrow { IllegalArgumentException("Section not found") }

        // Check if package already exists for this section and quarter
        val existingPackage = quarterPackageRepository.findBySectionIdAndQuarter(sectionId, quarter)
        if (existingPackage != null) {
            throw IllegalArgumentException("Quarter package already exists for this section and quarter")
        }

        val quarterEnum = Quarter.fromString(quarter)

        val adviser = section.adviserId?.let { profileRepository.findById(it).orElse(null) }

        val quarterPackage = QuarterPackageEntity(
            section = section,
            quarter = quarterEnum,
            adviser = adviser
        )

        return quarterPackageRepository.save(quarterPackage).toResponse(sectionService)
    }

    @Transactional
    override fun submitQuarterPackage(id: UUID): QuarterPackageResponse {
        val quarterPackage = quarterPackageRepository.findById(id)
            .orElseThrow { IllegalArgumentException("Quarter package not found") }

        if (quarterPackage.status != PackageStatus.PENDING) {
            throw IllegalStateException("Quarter package can only be submitted when in PENDING status")
        }

        quarterPackage.status = PackageStatus.SUBMITTED
        quarterPackage.submittedAt = LocalDateTime.now()

        return quarterPackageRepository.save(quarterPackage).toResponse(sectionService)
    }

    @Transactional
    override fun updateQuarterPackageStatus(id: UUID, status: String): QuarterPackageResponse {
        val quarterPackage = quarterPackageRepository.findById(id)
            .orElseThrow { IllegalArgumentException("Quarter package not found") }

        val statusEnum = PackageStatus.valueOf(status.uppercase())
        quarterPackage.status = statusEnum

        if (statusEnum == PackageStatus.SUBMITTED && quarterPackage.submittedAt == null) {
            quarterPackage.submittedAt = LocalDateTime.now()
        }

        return quarterPackageRepository.save(quarterPackage).toResponse(sectionService)
    }

    @Transactional
    override fun returnQuarterPackage(id: UUID, remarks: String): QuarterPackageResponse {
        val quarterPackage = quarterPackageRepository.findById(id)
            .orElseThrow { IllegalArgumentException("Quarter package not found") }

        if (quarterPackage.status != PackageStatus.SUBMITTED) {
            throw IllegalStateException("Quarter package can only be returned when in SUBMITTED status")
        }

        quarterPackage.status = PackageStatus.RETURNED
        quarterPackage.remarks = remarks

        return quarterPackageRepository.save(quarterPackage).toResponse(sectionService)
    }

    @Transactional
    override fun deleteQuarterPackage(id: UUID) {
        val quarterPackage = quarterPackageRepository.findById(id)
            .orElseThrow { IllegalArgumentException("Quarter package not found") }

        quarterPackageRepository.delete(quarterPackage)
    }
}
