package com.kapston.CTU_DB_API.repository

import com.kapston.CTU_DB_API.domain.entity.SectionEntity
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.util.UUID

interface SectionRepository : JpaRepository<SectionEntity, UUID> {

    fun existsByName(name: String): Boolean
    fun findByName(name: String): com.kapston.CTU_DB_API.domain.entity.SectionEntity?

    /**
     * Search sections with optional filters for grade level, section name, and adviser name.
     * Includes sections that do not have an assigned adviser.
     */
    @Query(
        """
        SELECT s.id, s.name, s.grade_level, s.adviser_id, s.adviser_name, s.created_at, s.updated_at,
            p.id, p.first_name, p.middle_name, p.last_name,
            (COALESCE(p.first_name, '') || ' ' || COALESCE(p.middle_name, '') || ' ' || COALESCE(p.last_name, ''))
        FROM sections s
        LEFT JOIN profiles p ON p.id = s.adviser_id
        WHERE
        (:gradeLevel IS NULL OR s.grade_level = :gradeLevel)
        AND (:name IS NULL OR LOWER(s.name) LIKE LOWER('%' || :name || '%'))
        AND (
            :adviserName IS NULL
            OR (
                p.id IS NOT NULL AND (
                    LOWER(COALESCE(p.first_name, '')) LIKE LOWER('%' || :adviserName || '%')
                    OR LOWER(COALESCE(p.last_name, '')) LIKE LOWER('%' || :adviserName || '%')
                    OR LOWER(COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '')) LIKE LOWER('%' || :adviserName || '%')
                    OR LOWER(COALESCE(p.first_name, '') || ' ' || COALESCE(p.middle_name, '') || ' ' || COALESCE(p.last_name, '')) LIKE LOWER('%' || :adviserName || '%')
                )
            )
        )
        """,
        nativeQuery = true
    )
    fun search(
        @Param("gradeLevel") gradeLevel: String?,
        @Param("name") name: String?,
        @Param("adviserName") adviserName: String?,
        pageable: Pageable
    ): Page<Array<Any>>

    /**
     * Check if section has dependent records in class_enrollments table
     */
    @Query("SELECT COUNT(ce) > 0 FROM ClassEnrollmentEntity ce WHERE ce.section.id = :sectionId")
    fun hasClassEnrollments(@Param("sectionId") sectionId: UUID): Boolean

    /**
     * Check if section has dependent records in schedule table
     */
    @Query("SELECT COUNT(s) > 0 FROM ScheduleEntity s WHERE s.section.id = :sectionId")
    fun hasScheduleEntries(@Param("sectionId") sectionId: UUID): Boolean

    /**
     * Count dependent records in class_enrollments table
     */
    @Query("SELECT COUNT(ce) FROM ClassEnrollmentEntity ce WHERE ce.section.id = :sectionId")
    fun countClassEnrollments(@Param("sectionId") sectionId: UUID): Long

    /**
     * Count dependent records in schedule table
     */
    @Query("SELECT COUNT(s) FROM ScheduleEntity s WHERE s.section.id = :sectionId")
    fun countScheduleEntries(@Param("sectionId") sectionId: UUID): Long

    /**
     * Get detailed class enrollment information for a section
     */
    @Query("""
        SELECT ce.id, prof.firstName, prof.lastName, CONCAT(prof.firstName, ' ', prof.lastName) as fullName
        FROM ClassEnrollmentEntity ce
        JOIN ce.student u
        JOIN ProfileEntity prof ON prof.userEntity.id = u.id
        WHERE ce.section.id = :sectionId
    """)
    fun getClassEnrollmentDetails(@Param("sectionId") sectionId: UUID): List<Array<Any>>

    /**
     * Get detailed schedule information for a section
     */
    @Query("""
        SELECT s.id, sub.name, CONCAT(t.firstName, ' ', t.lastName) as teacherName,
               s.startTime, s.endTime
        FROM ScheduleEntity s
        JOIN s.subject sub
        JOIN s.teacher t
        WHERE s.section.id = :sectionId
    """)
    fun getScheduleDetails(@Param("sectionId") sectionId: UUID): List<Array<Any>>

    /**
     * Set adviser to null for sections where adviser_id matches the given profile ID
     */
    @Modifying
    @Query("UPDATE SectionEntity s SET s.adviserId = null, s.adviserName = null WHERE s.adviserId = :profileId")
    fun setAdviserToNull(@Param("profileId") profileId: UUID): Int

    /**
     * Find sections by adviser ID
     */
    fun findByAdviserId(@Param("adviserId") adviserId: UUID): List<SectionEntity>
}
