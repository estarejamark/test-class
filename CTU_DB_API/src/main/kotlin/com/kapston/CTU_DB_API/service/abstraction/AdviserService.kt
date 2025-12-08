package com.kapston.CTU_DB_API.service.abstraction

import com.kapston.CTU_DB_API.domain.dto.response.AdvisorySuggestionResponse
import com.kapston.CTU_DB_API.domain.dto.response.QuarterPackageResponse
import com.kapston.CTU_DB_API.domain.dto.response.StudentResponse
import com.kapston.CTU_DB_API.domain.dto.response.StudentWithSuggestionsResponse
import java.util.*

interface AdviserService {

    fun getQuarterPackagesForAdviser(adviserId: UUID): List<QuarterPackageResponse>

    fun returnQuarterPackage(packageId: UUID, remarks: String): QuarterPackageResponse

    fun forwardQuarterPackageToAdmin(packageId: UUID): QuarterPackageResponse

    fun getAdvisoryClassList(adviserId: UUID): List<StudentWithSuggestionsResponse>

    fun suggestAdvisoryClassUpdate(adviserId: UUID, studentId: UUID, suggestion: String)

    fun getPendingSuggestionsForStudent(studentId: UUID): List<String>

    fun getAllSuggestionsForAdviser(adviserId: UUID): List<AdvisorySuggestionResponse>

    fun getAdviserSectionInfo(adviserId: UUID): com.kapston.CTU_DB_API.domain.dto.response.SectionResponse?

    fun validateAdviserStudentRelationship(adviserId: UUID, studentId: UUID)
}
