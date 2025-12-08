package com.kapston.CTU_DB_API.repository

import com.kapston.CTU_DB_API.domain.entity.AdvisorySuggestionEntity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.*

@Repository
interface AdvisorySuggestionRepository : JpaRepository<AdvisorySuggestionEntity, UUID> {

    @Query("SELECT a FROM AdvisorySuggestionEntity a WHERE a.student.id = :studentId AND a.isResolved = false")
    fun findUnresolvedSuggestionsByStudentId(@Param("studentId") studentId: UUID): List<AdvisorySuggestionEntity>

    @Query("SELECT a FROM AdvisorySuggestionEntity a WHERE a.adviser.id = :adviserId ORDER BY a.createdAt DESC")
    fun findSuggestionsByAdviserId(@Param("adviserId") adviserId: UUID): List<AdvisorySuggestionEntity>

    @Query("SELECT a FROM AdvisorySuggestionEntity a WHERE a.adviser.id = :adviserId AND a.student.id IN :studentIds AND a.isResolved = false")
    fun findUnresolvedSuggestionsByAdviserAndStudents(@Param("adviserId") adviserId: UUID, @Param("studentIds") studentIds: List<UUID>): List<AdvisorySuggestionEntity>

    @Query("SELECT a FROM AdvisorySuggestionEntity a WHERE a.adviser.id = :adviserId AND a.isResolved = false")
    fun findUnresolvedSuggestionsByAdviserId(@Param("adviserId") adviserId: UUID): List<AdvisorySuggestionEntity>

    fun findByStudentIdAndIsResolved(studentId: UUID, isResolved: Boolean): List<AdvisorySuggestionEntity>
}
