package com.kapston.CTU_DB_API.service.abstraction

import com.kapston.CTU_DB_API.domain.dto.response.QuarterPackageResponse
import com.kapston.CTU_DB_API.domain.dto.response.RecordApprovalResponse
import java.util.*

interface RecordService {

    fun getPendingPackages(): List<QuarterPackageResponse>

    fun getPublishedPackages(): List<QuarterPackageResponse>

    fun getPackageDetails(sectionId: UUID, quarter: String): QuarterPackageResponse?

    fun approvePackage(packageId: UUID, approverId: UUID): QuarterPackageResponse

    fun returnPackage(packageId: UUID, approverId: UUID, remarks: String): QuarterPackageResponse

    fun publishPackage(packageId: UUID): QuarterPackageResponse

    fun getPackageApprovals(packageId: UUID): List<RecordApprovalResponse>

    // New methods for teacher record compilation
    fun compileQuarterPackage(sectionId: UUID, quarter: String, teacherId: UUID): QuarterPackageResponse

    fun submitQuarterPackage(packageId: UUID, teacherId: UUID): QuarterPackageResponse
}
