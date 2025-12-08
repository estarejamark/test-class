package com.kapston.CTU_DB_API.repository

import com.kapston.CTU_DB_API.domain.Enums.Role
import com.kapston.CTU_DB_API.domain.entity.UserEntity
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.util.UUID

@Repository
interface UserRepository : JpaRepository<UserEntity, UUID> {
    fun existsByEmail(email: String): Boolean
    fun findByEmail(email: String): UserEntity?

    // Basic paginated queries (without join fetch)
    fun findByEmailContainingAndRole(email: String, role: Role, pageable: Pageable): Page<UserEntity>
    fun findByEmailContaining(email: String, pageable: Pageable): Page<UserEntity>
    fun findByRole(role: Role, pageable: Pageable): Page<UserEntity>

    // Fetch queries (no pageable) to include enrollments, sections, and profile
    @Query("""
        SELECT DISTINCT u
        FROM UserEntity u
        LEFT JOIN FETCH u.profile p
        LEFT JOIN FETCH u.enrollments e
        LEFT JOIN FETCH e.section s
        WHERE u.role = :role
    """)
    fun findByRoleWithEnrollments(role: Role): List<UserEntity>

    @Query("""
        SELECT DISTINCT u
        FROM UserEntity u
        LEFT JOIN FETCH u.profile p
        LEFT JOIN FETCH u.enrollments e
        LEFT JOIN FETCH e.section s
        WHERE u.email LIKE %:email% AND u.role = :role
    """)
    fun findByEmailContainingAndRoleWithEnrollments(email: String, role: Role): List<UserEntity>

    @Query("""
        SELECT DISTINCT u
        FROM UserEntity u
        LEFT JOIN FETCH u.profile p
        LEFT JOIN FETCH u.enrollments e
        LEFT JOIN FETCH e.section s
        WHERE u.email LIKE %:email%
    """)
    fun findByEmailContainingWithEnrollments(email: String): List<UserEntity>

    @Query("""
        SELECT DISTINCT u
        FROM UserEntity u
        LEFT JOIN FETCH u.profile p
        LEFT JOIN FETCH u.enrollments e
        LEFT JOIN FETCH e.section s
    """)
    fun findAllWithEnrollments(): List<UserEntity>

    @Query("""
        SELECT DISTINCT u
        FROM UserEntity u
        LEFT JOIN FETCH u.profile p
        LEFT JOIN FETCH u.enrollments e
        LEFT JOIN FETCH e.section s
        WHERE u.id = :id
    """)
    fun findByIdWithEnrollments(id: UUID): UserEntity?

    @Query("""
        SELECT DISTINCT u
        FROM UserEntity u
        LEFT JOIN FETCH u.profile p
        LEFT JOIN FETCH u.enrollments e
        LEFT JOIN FETCH e.section s
        WHERE u.role = :role AND (
            LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%')) OR
            LOWER(p.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR
            LOWER(p.lastName) LIKE LOWER(CONCAT('%', :query, '%')) OR
            LOWER(p.middleName) LIKE LOWER(CONCAT('%', :query, '%'))
        )
    """)
    fun searchStudentsByQuery(query: String, role: Role = Role.STUDENT): List<UserEntity>
}
