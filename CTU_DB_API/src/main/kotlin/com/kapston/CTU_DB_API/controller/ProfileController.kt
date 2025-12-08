package com.kapston.CTU_DB_API.controller

import com.kapston.CTU_DB_API.CustomException.ProfileNotFoundException
import com.kapston.CTU_DB_API.domain.Enums.Role
import com.kapston.CTU_DB_API.domain.dto.request.ProfileRequest
import com.kapston.CTU_DB_API.domain.dto.request.UpdateProfileRequest
import com.kapston.CTU_DB_API.domain.dto.response.ProfileResponse
import com.kapston.CTU_DB_API.domain.entity.ProfileEntity
import com.kapston.CTU_DB_API.service.abstraction.ProfileService
import com.kapston.CTU_DB_API.service.abstraction.UserService
import com.kapston.CTU_DB_API.service.implementation.AuthenticationServiceImplementation
import com.kapston.CTU_DB_API.utility.HashUtils.hashPassword
import com.kapston.CTU_DB_API.utility.JwtUtils
import jakarta.validation.Valid
import org.springframework.data.domain.Page
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.CookieValue
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.UUID


@RestController
@RequestMapping("/api/profiles")
class ProfileController(
    private val profileService: ProfileService,
    private val userService: UserService,
    private val authenticationServiceImplementation: AuthenticationServiceImplementation,
    private val jwtUtils: JwtUtils
) {
    @GetMapping("/me")
    fun getProfiles(
        @CookieValue("jwt") jwt: String
    ): ResponseEntity<ProfileResponse?> {
        authenticationServiceImplementation.validateAccessToken(jwt)
        val stringId = jwtUtils.getUserIdFromToken(jwt)
        val userId = UUID.fromString(stringId)

        val user = userService.getUserEntity(userId)
        val response = profileService.getProfile(user)
        return ResponseEntity.status(HttpStatus.OK).body(response)
    }

    @PostMapping
    fun save(
        @Valid @RequestBody profileRequest: ProfileRequest,
        @CookieValue("jwt") jwt: String
    ): ResponseEntity<String> {
        authenticationServiceImplementation.validateAccessToken(jwt)

        val stringId = jwtUtils.getUserIdFromToken(jwt)
        val userId = UUID.fromString(stringId)

        val user = userService.getUserEntity(userId)
        val profileEntity = profileRequest.toEntity(user)

        // If the user provided a password, update the user's password (for both teachers and students)
        if (!profileRequest.password.isNullOrBlank()) {
            val hashedPassword = profileRequest.password.hashPassword()
            userService.resetPassword(userId, hashedPassword)
        }

        val profileResponse = profileService.saveOrUpdate(profileEntity)

        return ResponseEntity.status(HttpStatus.CREATED).body(profileResponse)
    }

    @PutMapping("/{id}")
    fun update(
        @PathVariable id: UUID,
        @Valid @RequestBody updateProfileRequest: UpdateProfileRequest,
        @CookieValue("jwt") jwt: String
    ): ResponseEntity<String> {
        authenticationServiceImplementation.validateAccessToken(jwt)

        val stringId = jwtUtils.getUserIdFromToken(jwt)
        val authenticatedUserId = UUID.fromString(stringId)
        val authenticatedUser = userService.getUserEntity(authenticatedUserId)

        // Check if the authenticated user is an admin or updating their own profile
        val targetProfile = profileService.getProfileEntityById(id)
            ?: throw ProfileNotFoundException("Profile not found with id: $id")

        // Allow admins to update any profile, or users to update their own profile
        if (authenticatedUser.role != com.kapston.CTU_DB_API.domain.Enums.Role.ADMIN &&
            targetProfile.userEntity?.id != authenticatedUserId) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body("You can only update your own profile")
        }

        // Update the profile with the target profile's user entity
        val updatedProfileEntity = profileService.updateProfile(targetProfile, updateProfileRequest)

        val profileResponse = profileService.saveOrUpdate(updatedProfileEntity)

        return ResponseEntity.status(HttpStatus.OK).body(profileResponse)
    }

    @DeleteMapping("/{id}")
    fun delete(
        @PathVariable id: UUID,
        @CookieValue("jwt") jwt: String
    ): ResponseEntity<String> {
        authenticationServiceImplementation.validateAccessToken(jwt)

        val result = profileService.delete(id)
        return ResponseEntity.status(HttpStatus.OK).body(result)
    }

    @GetMapping
    fun searchProfiles(
        @RequestParam(required = false) role: Role?,
        @RequestParam(required = false) name: String?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "10") size: Int,
        @CookieValue("jwt") jwt: String
    ): Page<ProfileEntity> {
        authenticationServiceImplementation.validateAccessToken(jwt)

        return profileService.search(
            role,
            name,
            page,
            size
        )
    }
}
