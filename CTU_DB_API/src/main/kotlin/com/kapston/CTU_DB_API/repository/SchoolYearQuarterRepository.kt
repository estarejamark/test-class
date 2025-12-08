package com.kapston.CTU_DB_API.repository

import com.kapston.CTU_DB_API.domain.Enums.Quarter
import com.kapston.CTU_DB_API.model.*
import com.kapston.CTU_DB_API.model.QuarterStatus
import com.kapston.CTU_DB_API.model.SchoolYearQuarterDto
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.util.*

@Repository
interface SchoolYearQuarterRepository : JpaRepository<SchoolYearQuarter, Long> {
    @Query("SELECT q FROM SchoolYearQuarter q JOIN FETCH q.schoolYear WHERE q.schoolYear.id = :schoolYearId")
    fun findBySchoolYearId(schoolYearId: Long): List<SchoolYearQuarter>

    fun findQuartersAsDtoBySchoolYearId(schoolYearId: Long): List<SchoolYearQuarterDto> {
        return findBySchoolYearId(schoolYearId).map { it.toDto() }
    }

    fun findByStatus(status: QuarterStatus): List<SchoolYearQuarter>
    fun findBySchoolYearIdAndQuarter(schoolYearId: Long, quarter: Quarter): SchoolYearQuarter?
    fun findFirstByStatusOrderByCreatedAtDesc(status: QuarterStatus): SchoolYearQuarter?
}
