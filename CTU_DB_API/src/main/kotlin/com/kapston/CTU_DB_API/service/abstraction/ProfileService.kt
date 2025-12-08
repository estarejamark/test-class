package com.kapston.CTU_DB_API.service.abstraction

import com.kapston.CTU_DB_API.domain.Enums.Role
import com.kapston.CTU_DB_API.domain.dto.request.UpdateProfileRequest
import com.kapston.CTU_DB_API.domain.dto.response.ProfileResponse
import com.kapston.CTU_DB_API.domain.entity.ProfileEntity
import com.kapston.CTU_DB_API.domain.entity.UserEntity
import org.springframework.data.domain.Page
import java.util.UUID

interface ProfileService {
    fun saveOrUpdate(profileEntity: ProfileEntity): String
    fun getProfile(userEntity: UserEntity): ProfileResponse?
    fun getProfileEntityById(profileId: UUID): ProfileEntity?
    fun search(role: Role?, name: String?, page: Int, size: Int): Page<ProfileEntity>
    fun findName(name: String): ProfileEntity?
    fun getAllTeachers(): List<ProfileEntity>
    fun delete(profileId: UUID): String
    fun updateProfile(existingProfile: ProfileEntity, updateRequest: UpdateProfileRequest): ProfileEntity
}
