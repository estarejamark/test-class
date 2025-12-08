package com.kapston.CTU_DB_API.repository

import com.kapston.CTU_DB_API.domain.entity.ClassEnrollmentEntity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.UUID

@Repository
interface ClassEnrollmentRepository : JpaRepository<ClassEnrollmentEntity, UUID> {

    // Find all enrollments for a specific section
    fun findBySectionId(sectionId: UUID): List<ClassEnrollmentEntity>

    // Count enrollments for a specific section
    fun countBySectionId(sectionId: UUID): Long

    // Find active enrollments for a specific section
    fun findBySectionIdAndIsActive(sectionId: UUID, isActive: Boolean): List<ClassEnrollmentEntity>

    // Find enrollment for a specific student and section
    fun findByStudentIdAndSectionId(studentId: UUID, sectionId: UUID): ClassEnrollmentEntity?

    // Check if student is enrolled in any section
    fun existsByStudentId(studentId: UUID): Boolean

    // Check if student is enrolled in a specific section
    fun existsByStudentIdAndSectionId(studentId: UUID, sectionId: UUID): Boolean

    // Check if student is enrolled in a specific section and is active
    fun existsBySectionIdAndStudentIdAndIsActive(sectionId: UUID, studentId: UUID, isActive: Boolean): Boolean

    // Get all enrollments for a student
    fun findByStudentId(studentId: UUID): List<ClassEnrollmentEntity>

    // Delete enrollment by student and section
    @Modifying
    @Query("DELETE FROM ClassEnrollmentEntity ce WHERE ce.student.id = :studentId AND ce.section.id = :sectionId")
    fun deleteByStudentIdAndSectionId(@Param("studentId") studentId: UUID, @Param("sectionId") sectionId: UUID): Int

    // Get enrolled students with profile details for a section
    @Query("""
        SELECT ce, prof
        FROM ClassEnrollmentEntity ce
        JOIN ce.student u
        JOIN ProfileEntity prof ON prof.userEntity.id = u.id
        WHERE ce.section.id = :sectionId
        ORDER BY prof.lastName, prof.firstName
    """)
    fun findEnrolledStudentsWithProfiles(@Param("sectionId") sectionId: UUID): List<Array<Any>>

    // Get all students not enrolled in any section (for assignment)
    @Query("""
        SELECT u, prof
        FROM UserEntity u
        JOIN ProfileEntity prof ON prof.userEntity.id = u.id
        WHERE u.role = 'STUDENT'
        AND u.status = 'ACTIVE'
        AND NOT EXISTS (
            SELECT 1 FROM ClassEnrollmentEntity ce WHERE ce.student.id = u.id
        )
        ORDER BY prof.lastName, prof.firstName
    """)
    fun findUnassignedStudents(): List<Array<Any>>

    // Get all students (for moving between sections)
    @Query("""
        SELECT u, prof, ce.section.id as currentSectionId, ce.section.name as currentSectionName, ce.section.gradeLevel as sectionGradeLevel, ce.enrolledAt, ce.schoolYear, ce.quarter
        FROM UserEntity u
        JOIN ProfileEntity prof ON prof.userEntity.id = u.id
        LEFT JOIN ClassEnrollmentEntity ce ON ce.student.id = u.id
        WHERE u.role = 'STUDENT'
        AND u.status = 'ACTIVE'
        ORDER BY prof.lastName, prof.firstName
    """)
    fun findAllStudentsWithEnrollmentStatus(): List<Array<Any>>

    // Get the last enrolled grade level for a student
    @Query("""
        SELECT ce.section.gradeLevel
        FROM ClassEnrollmentEntity ce
        WHERE ce.student.id = :studentId
        ORDER BY ce.enrolledAt DESC
        LIMIT 1
    """)
    fun findLastEnrolledGradeLevel(@Param("studentId") studentId: UUID): String?
}
