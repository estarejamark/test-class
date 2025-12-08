package com.kapston.CTU_DB_API.service.abstraction

import com.kapston.CTU_DB_API.domain.Enums.StatusEnum
import com.kapston.CTU_DB_API.domain.dto.request.LoginRequest
import com.kapston.CTU_DB_API.domain.dto.request.RegisterRequest
import com.kapston.CTU_DB_API.domain.dto.response.LoginResponse
import com.kapston.CTU_DB_API.domain.entity.UserEntity
import java.util.UUID

interface UserService {
    fun create(user: RegisterRequest): String
    fun authenticate(user: LoginRequest): LoginResponse
    fun getUserEntity(id: UUID): UserEntity
    fun updateStatus(id: UUID): String
    fun resetPassword(id: UUID, newPassword: String): String
    fun changeEmail(userId: UUID, newEmail: String, otp: String): String
    fun sendPasswordResetLink(email: String): String
    fun resetOtp(userId: UUID): String
    fun deleteUser(id: UUID): String
    fun hasProfile(userId: UUID): Boolean
    fun searchUsers(
        email: String?,
        role: String?,
        grade: String?,
        section: String?,
        page: Int,
        size: Int
    ): Pair<List<UserEntity>, Long>

    fun getUsersWithEnrollments(
        email: String?,
        role: String?,
        page: Int,
        size: Int
    ): Pair<List<UserEntity>, Long>

    fun getUsersWithEnrollments(
        email: String?,
        role: String?,
        isAdviser: Boolean?,
        page: Int,
        size: Int
    ): Pair<List<UserEntity>, Long>

    fun updateUser(id: UUID, email: String?, gradeLevel: String?, sectionName: String?, status: StatusEnum?): UserEntity
    fun getUserWithEnrollments(id: UUID): UserEntity?
    fun getUserEntityByEmail(email: String): UserEntity?
}
