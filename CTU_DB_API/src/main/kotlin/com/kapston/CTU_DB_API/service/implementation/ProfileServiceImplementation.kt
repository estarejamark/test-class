package com.kapston.CTU_DB_API.service.implementation

import com.kapston.CTU_DB_API.CustomException.ProfileNotFoundException
import com.kapston.CTU_DB_API.CustomException.UserNotFoundException
import com.kapston.CTU_DB_API.domain.Enums.Role
import com.kapston.CTU_DB_API.domain.dto.request.UpdateProfileRequest
import com.kapston.CTU_DB_API.domain.dto.response.ProfileResponse
import com.kapston.CTU_DB_API.domain.entity.ProfileEntity
import com.kapston.CTU_DB_API.domain.entity.UserEntity
import com.kapston.CTU_DB_API.repository.ProfileRepository
import com.kapston.CTU_DB_API.service.abstraction.ProfileService
import org.springframework.dao.DataAccessException
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service
import java.util.UUID

@Service
class ProfileServiceImplementation(
    private val profileRepository: ProfileRepository,
    @org.springframework.context.annotation.Lazy
    private val sectionService: com.kapston.CTU_DB_API.service.abstraction.SectionService
): ProfileService {

    override fun saveOrUpdate(profileEntity: ProfileEntity): String {
        try {
            val existingProfile = profileEntity.userEntity?.let { profileRepository.findByUserEntity(it) }

            val updatedProfile = existingProfile.let {
                it?.apply {
                    firstName = profileEntity.firstName
                    middleName = profileEntity.middleName
                    lastName = profileEntity.lastName
                    gender = profileEntity.gender
                    birthDate = profileEntity.birthDate
                    contactNumber = profileEntity.contactNumber
                    address = profileEntity.address
                    parentName = profileEntity.parentName
                    parentContact = profileEntity.parentContact
                    gradeLevel = profileEntity.gradeLevel
                    // isAdviser is computed dynamically, not stored
                }
            } ?: profileEntity

            val savedProfile = profileRepository.save(updatedProfile)

            // If this is a new profile for a teacher and they provided a password, update the user's password
            if (existingProfile == null && profileEntity.userEntity?.role?.name == "TEACHER") {
                // Note: The password should be handled in the controller or a separate service method
                // For now, we'll just save the profile and let the controller handle password updates
            }

            return "Profile saved with ID: ${savedProfile.id}"
        } catch (e: DataAccessException) {

            // Provide more specific error message based on the cause
            val errorMessage = when {
                e.cause?.message?.contains("duplicate") == true ->
                    "Profile already exists for this user"
                e.cause?.message?.contains("constraint") == true ->
                    "Invalid profile data - missing required fields"
                else -> "Database error while saving profile: ${e.message}"
            }

            throw RuntimeException(errorMessage)
        }
    }

    override fun getProfile(userEntity: UserEntity): ProfileResponse? {
        val userResponse = profileRepository.findByUserEntity(userEntity)
            ?: throw ProfileNotFoundException("Profile not found for user id=${userEntity.id}")

        val profileResponse = userResponse.toResponse(sectionService)
        // Compute isAdviser dynamically based on section assignments
        val isAdviser = userResponse.id?.let { sectionService.isTeacherAdviser(it) } ?: false
        val updatedProfileResponse = profileResponse.copy(isAdviser = isAdviser)

        return updatedProfileResponse
    }

    override fun getProfileEntityById(profileId: UUID): ProfileEntity? {
        return profileRepository.findById(profileId).orElse(null)
    }

    override fun search(role: Role?, name: String?, page: Int, size: Int): Page<ProfileEntity> {
        val pageable = PageRequest.of(page, size)

        return profileRepository.search(role, name, pageable)
    }

    override fun findName(name: String): ProfileEntity? {
        return profileRepository.findByName(name)
            ?: throw UserNotFoundException("User with name $name not found.")
    }

    override fun getAllTeachers(): List<ProfileEntity> {
        return profileRepository.findAllTeachers()
    }

    override fun delete(profileId: UUID): String {
        try {
            val profile = profileRepository.findById(profileId)
                .orElseThrow { ProfileNotFoundException("Profile not found with id: $profileId") }

            profileRepository.delete(profile)
            return "Profile deleted successfully."
        } catch (e: DataAccessException) {
            throw RuntimeException("Failed to delete profile.")
        }
    }

    override fun updateProfile(existingProfile: ProfileEntity, updateRequest: UpdateProfileRequest): ProfileEntity {
        // Apply only the provided fields from the update request
        updateRequest.firstName?.let { existingProfile.firstName = it }
        updateRequest.middleName?.let { existingProfile.middleName = it.takeIf { it.isNotBlank() } }
        updateRequest.lastName?.let { existingProfile.lastName = it }
        updateRequest.gender?.let { existingProfile.gender = it }
        updateRequest.birthDate?.let { existingProfile.birthDate = it }
        updateRequest.standardizedContactNumber?.let { existingProfile.contactNumber = it }
        updateRequest.address?.let { existingProfile.address = it }
        updateRequest.parentName?.let { existingProfile.parentName = it.takeIf { it.isNotBlank() } }
        updateRequest.standardizedParentContact?.let { existingProfile.parentContact = it }
        updateRequest.gradeLevel?.let { existingProfile.gradeLevel = it.takeIf { it.isNotBlank() } }
        // Note: isAdviser is not included in UpdateProfileRequest, so it remains unchanged

        try {
            return profileRepository.save(existingProfile)
        } catch (e: DataAccessException) {
            throw RuntimeException("Failed to update profile due to data access error: ${e.message}", e)
        }
    }
}
