package com.kapston.CTU_DB_API.repository

import com.kapston.CTU_DB_API.domain.entity.QuarterPackageEntity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.*

@Repository
interface QuarterPackageRepository : JpaRepository<QuarterPackageEntity, UUID> {

    @Query("SELECT q FROM QuarterPackageEntity q WHERE q.section.id = :sectionId AND q.quarter = :quarter")
    fun findBySectionIdAndQuarter(@Param("sectionId") sectionId: UUID, @Param("quarter") quarter: String): QuarterPackageEntity?

    @Query("SELECT q FROM QuarterPackageEntity q WHERE q.section.id = :sectionId")
    fun findBySectionId(@Param("sectionId") sectionId: UUID): List<QuarterPackageEntity>

    @Query("SELECT q FROM QuarterPackageEntity q WHERE q.adviser.id = :adviserId")
    fun findByAdviserId(@Param("adviserId") adviserId: UUID): List<QuarterPackageEntity>

    @Query("SELECT q FROM QuarterPackageEntity q WHERE q.status = :status")
    fun findByStatus(@Param("status") status: String): List<QuarterPackageEntity>
}
