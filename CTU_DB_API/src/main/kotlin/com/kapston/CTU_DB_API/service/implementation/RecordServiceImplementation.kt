package com.kapston.CTU_DB_API.service.implementation

import com.kapston.CTU_DB_API.CustomException.UnauthorizedException
import com.kapston.CTU_DB_API.domain.Enums.ApprovalAction
import com.kapston.CTU_DB_API.domain.Enums.PackageStatus
import com.kapston.CTU_DB_API.domain.dto.response.AdviserResponse
import com.kapston.CTU_DB_API.domain.dto.response.QuarterPackageResponse
import com.kapston.CTU_DB_API.domain.dto.response.RecordApprovalResponse
import com.kapston.CTU_DB_API.domain.dto.response.SectionResponse
import com.kapston.CTU_DB_API.domain.entity.QuarterPackageEntity
import com.kapston.CTU_DB_API.domain.entity.RecordApprovalEntity
import com.kapston.CTU_DB_API.repository.ProfileRepository
import com.kapston.CTU_DB_API.repository.RecordApprovalRepository
import com.kapston.CTU_DB_API.repository.RecordRepository
import com.kapston.CTU_DB_API.service.abstraction.RecordService
import com.kapston.CTU_DB_API.service.abstraction.SectionService
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime
import java.util.*

@Service
class RecordServiceImplementation(
    private val recordRepository: RecordRepository,
    private val recordApprovalRepository: RecordApprovalRepository,
    private val profileRepository: ProfileRepository,
    private val sectionService: SectionService
) : RecordService {

    @Transactional(readOnly = true)
    override fun getPendingPackages(): List<QuarterPackageResponse> {
        return recordRepository.findPendingPackages().map { it.toResponse() }
    }

    @Transactional(readOnly = true)
    override fun getPublishedPackages(): List<QuarterPackageResponse> {
        return recordRepository.findPublishedPackages().map { it.toResponse() }
    }

    @Transactional(readOnly = true)
    override fun getPackageDetails(sectionId: UUID, quarter: String): QuarterPackageResponse? {
        return recordRepository.findBySectionAndQuarter(sectionId, quarter)?.toResponse()
    }

    @Transactional
    override fun approvePackage(packageId: UUID, approverId: UUID): QuarterPackageResponse {
        val packageEntity = recordRepository.findById(packageId).orElseThrow {
            IllegalArgumentException("Package not found")
        }

        if (packageEntity.status != PackageStatus.PENDING && packageEntity.status != PackageStatus.RETURNED) {
            throw IllegalStateException("Package cannot be approved in current status")
        }

        packageEntity.status = PackageStatus.APPROVED
        packageEntity.updatedAt = LocalDateTime.now()

        val savedPackage = recordRepository.save(packageEntity)

        // Create approval record
        val approver = profileRepository.findById(approverId).orElseThrow {
            IllegalArgumentException("Approver not found")
        }

        val approval = RecordApprovalEntity(
            quarterPackage = savedPackage,
            approver = approver,
            action = ApprovalAction.APPROVE
        )
        recordApprovalRepository.save(approval)

        return savedPackage.toResponse()
    }

    @Transactional
    override fun returnPackage(packageId: UUID, approverId: UUID, remarks: String): QuarterPackageResponse {
        val packageEntity = recordRepository.findById(packageId).orElseThrow {
            IllegalArgumentException("Package not found")
        }

        if (packageEntity.status != PackageStatus.PENDING && packageEntity.status != PackageStatus.APPROVED) {
            throw IllegalStateException("Package cannot be returned in current status")
        }

        packageEntity.status = PackageStatus.RETURNED
        packageEntity.updatedAt = LocalDateTime.now()

        val savedPackage = recordRepository.save(packageEntity)

        // Create approval record
        val approver = profileRepository.findById(approverId).orElseThrow {
            IllegalArgumentException("Approver not found")
        }

        val approval = RecordApprovalEntity(
            quarterPackage = savedPackage,
            approver = approver,
            action = ApprovalAction.RETURN,
            remarks = remarks
        )
        recordApprovalRepository.save(approval)

        return savedPackage.toResponse()
    }

    @Transactional
    override fun publishPackage(packageId: UUID): QuarterPackageResponse {
        val packageEntity = recordRepository.findById(packageId).orElseThrow {
            IllegalArgumentException("Package not found")
        }

        if (packageEntity.status != PackageStatus.APPROVED) {
            throw IllegalStateException("Only approved packages can be published")
        }

        packageEntity.status = PackageStatus.PUBLISHED
        packageEntity.updatedAt = LocalDateTime.now()

        val savedPackage = recordRepository.save(packageEntity)

        // TODO: Lock associated grades, attendance, feedback records

        return savedPackage.toResponse()
    }

    @Transactional(readOnly = true)
    override fun getPackageApprovals(packageId: UUID): List<RecordApprovalResponse> {
        return recordApprovalRepository.findByPackageId(packageId).map { it.toResponse() }
    }

    @Transactional
    override fun compileQuarterPackage(sectionId: UUID, quarter: String, teacherId: UUID): QuarterPackageResponse {
        val quarterEnum = com.kapston.CTU_DB_API.domain.Enums.Quarter.fromString(quarter)

        // Check if package already exists
        val existingPackage = recordRepository.findBySectionAndQuarter(sectionId, quarter)
        if (existingPackage != null) {
            return existingPackage.toResponse()
        }

        // Get section and teacher
        val section = recordRepository.findById(sectionId).orElseThrow().section
        val teacher = profileRepository.findById(teacherId).orElseThrow()

        // Create new quarter package
        val quarterPackage = QuarterPackageEntity(
            section = section,
            quarter = quarterEnum,
            status = PackageStatus.PENDING,
            adviser = teacher
        )

        val savedPackage = recordRepository.save(quarterPackage)
        return savedPackage.toResponse()
    }

    @Transactional
    override fun submitQuarterPackage(packageId: UUID, teacherId: UUID): QuarterPackageResponse {
        val packageEntity = recordRepository.findById(packageId).orElseThrow {
            IllegalArgumentException("Package not found")
        }

        // Verify teacher is the adviser
        if (packageEntity.adviser?.id != teacherId) {
            throw UnauthorizedException("Only the adviser can submit this package")
        }

        if (packageEntity.status != PackageStatus.PENDING) {
            throw IllegalStateException("Package can only be submitted when in PENDING status")
        }

        packageEntity.status = PackageStatus.SUBMITTED
        packageEntity.submittedAt = LocalDateTime.now()
        packageEntity.updatedAt = LocalDateTime.now()

        val savedPackage = recordRepository.save(packageEntity)
        return savedPackage.toResponse()
    }

    private fun QuarterPackageEntity.toResponse(): QuarterPackageResponse = QuarterPackageResponse(
        id = id!!,
        section = section.toResponse(),
        quarter = quarter,
        status = status,
        submittedAt = submittedAt,
        adviser = adviser?.let {
            AdviserResponse.fromEntity(it, sectionService)
        },
        createdAt = createdAt,
        updatedAt = updatedAt
    )

    private fun RecordApprovalEntity.toResponse(): RecordApprovalResponse = RecordApprovalResponse(
        id = id!!,
        packageId = quarterPackage.id!!,
        approver = AdviserResponse.fromEntity(approver, sectionService),
        action = action,
        remarks = remarks,
        createdAt = createdAt
    )
}
