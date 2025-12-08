package com.kapston.CTU_DB_API.repository

import com.kapston.CTU_DB_API.domain.Enums.Role
import com.kapston.CTU_DB_API.domain.entity.ProfileEntity
import com.kapston.CTU_DB_API.domain.entity.UserEntity
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.util.UUID

interface ProfileRepository: JpaRepository<ProfileEntity, UUID> {
    @Query(
        """
    SELECT p
    FROM ProfileEntity p
    JOIN p.userEntity u
    WHERE (:role IS NULL OR u.role = :role)
      AND (
        :name IS NULL OR
        LOWER(p.firstName) LIKE LOWER(CONCAT('%', CAST(:name AS string), '%')) OR
        LOWER(p.middleName) LIKE LOWER(CONCAT('%', CAST(:name AS string), '%')) OR
        LOWER(p.lastName) LIKE LOWER(CONCAT('%', CAST(:name AS string), '%'))
      )
    """
    )
    fun search(role: Role?, name: String?, pageable: Pageable): Page<ProfileEntity>
    fun findByUserEntity(user: UserEntity): ProfileEntity?

    @Query(
        """
    SELECT p
    FROM ProfileEntity p
    WHERE LOWER(CONCAT(p.firstName, ' ', p.middleName, ' ', p.lastName)) = LOWER(:name)
       OR LOWER(CONCAT(p.firstName, ' ', p.lastName)) = LOWER(:name)
       OR LOWER(p.firstName) = LOWER(:name)
       OR LOWER(p.lastName) = LOWER(:name)
    """
    )
    fun findByName(name: String): ProfileEntity?

    @Query(
        """
        SELECT p
        FROM ProfileEntity p
        WHERE p.userEntity.role = 'TEACHER'
    """
    )
    fun findAllTeachers(): List<ProfileEntity>
}