package com.kapston.CTU_DB_API.service.abstraction

import com.kapston.CTU_DB_API.domain.dto.response.QuarterPackageResponse
import java.util.*

interface QuarterPackageService {

    fun getAllQuarterPackages(): List<QuarterPackageResponse>

    fun getQuarterPackageById(id: UUID): QuarterPackageResponse?

    fun getQuarterPackagesBySectionId(sectionId: UUID): List<QuarterPackageResponse>

    fun getQuarterPackagesByAdviserId(adviserId: UUID): List<QuarterPackageResponse>

    fun getQuarterPackagesByStatus(status: String): List<QuarterPackageResponse>

    fun createQuarterPackage(sectionId: UUID, quarter: String): QuarterPackageResponse

    fun submitQuarterPackage(id: UUID): QuarterPackageResponse

    fun updateQuarterPackageStatus(id: UUID, status: String): QuarterPackageResponse

    fun returnQuarterPackage(id: UUID, remarks: String): QuarterPackageResponse

    fun deleteQuarterPackage(id: UUID)
}
