package com.kapston.CTU_DB_API.repository

import com.kapston.CTU_DB_API.domain.entity.QuarterPackageEntity
import com.kapston.CTU_DB_API.domain.entity.RecordApprovalEntity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.*

@Repository
interface RecordRepository : JpaRepository<QuarterPackageEntity, UUID> {

    @Query("SELECT p FROM QuarterPackageEntity p LEFT JOIN FETCH p.section LEFT JOIN FETCH p.adviser WHERE p.status = 'PENDING' ORDER BY p.submittedAt DESC")
    fun findPendingPackages(): List<QuarterPackageEntity>

    @Query("SELECT p FROM QuarterPackageEntity p LEFT JOIN FETCH p.section LEFT JOIN FETCH p.adviser WHERE p.status = 'PUBLISHED' ORDER BY p.submittedAt DESC")
    fun findPublishedPackages(): List<QuarterPackageEntity>

    @Query("SELECT p FROM QuarterPackageEntity p WHERE p.section.id = :sectionId AND p.quarter = :quarter")
    fun findBySectionAndQuarter(@Param("sectionId") sectionId: UUID, @Param("quarter") quarter: String): QuarterPackageEntity?

    fun findByIdAndStatus(id: UUID, status: String): QuarterPackageEntity?
}

@Repository
interface RecordApprovalRepository : JpaRepository<RecordApprovalEntity, UUID> {

    @Query("SELECT a FROM RecordApprovalEntity a WHERE a.quarterPackage.id = :packageId ORDER BY a.createdAt DESC")
    fun findByPackageId(@Param("packageId") packageId: UUID): List<RecordApprovalEntity>
}
