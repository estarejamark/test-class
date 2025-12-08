package com.kapston.CTU_DB_API.controller

import com.kapston.CTU_DB_API.domain.dto.request.RegisterRequest
import com.kapston.CTU_DB_API.domain.dto.response.UserResponse
import com.kapston.CTU_DB_API.domain.entity.ProfileEntity
import com.kapston.CTU_DB_API.domain.entity.UserEntity
import com.kapston.CTU_DB_API.service.abstraction.ProfileService
import com.kapston.CTU_DB_API.service.abstraction.SectionService
import com.kapston.CTU_DB_API.service.abstraction.UserService
import com.kapston.CTU_DB_API.utility.HashUtils.hashPassword
import com.kapston.CTU_DB_API.utility.JwtUtils
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
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
@RequestMapping("/api/users")
@PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
class UserController(
    private val userService: UserService,
    private val profileService: ProfileService,
    private val jwtUtils: JwtUtils,
    private val sectionService: SectionService
) {
    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or (hasRole('TEACHER') and #user.role != 'ADMIN')")
    fun register(
        request: HttpServletRequest,
        @CookieValue("jwt") jwt: String,
        @Valid @RequestBody user: RegisterRequest
    ): ResponseEntity<String> {
        try {
            // Validate JWT token
            jwtUtils.validateAccessToken(jwt)

            // Validate email
            if (user.email.isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Email is required and cannot be empty")
            }

            // Use default password if null or blank
            val rawPassword = if (user.password.isNullOrBlank()) {
                "admin123"
            } else {
                user.password
            }

            val hashedPassword = rawPassword.hashPassword()

            val hashedUser = RegisterRequest(
                email = user.email,
                password = hashedPassword,
                role = user.role
            )

            val userResponse = userService.create(hashedUser)

            return ResponseEntity.status(HttpStatus.CREATED).body(userResponse)

        } catch (e: Exception) {
            throw e
        }
    }

    @GetMapping("/teachers")
    fun getAllTeachers(
        @CookieValue("jwt") jwt: String,
        ): ResponseEntity<List<ProfileEntity>> {

        jwtUtils.validateAccessToken(jwt)

        val teachers = profileService.getAllTeachers()
        return ResponseEntity.ok(teachers)
    }

    @PutMapping
    fun updateStatus(
        @CookieValue("jwt") jwt: String,
        @RequestParam(required = true) id: UUID
    ): ResponseEntity<String> {
        jwtUtils.validateAccessToken(jwt)
        val userResponse = userService.updateStatus(id)

        return ResponseEntity.status(HttpStatus.OK).body(userResponse)
    }

    @PostMapping("/reset-password")
    fun resetPassword(
        @CookieValue("jwt") jwt: String,
        @RequestParam(required = true) newPassword: String
    ): ResponseEntity<String> {
        jwtUtils.validateAccessToken(jwt)
        val stringUserId = jwtUtils.getUserIdFromToken(jwt)
        val userId = UUID.fromString(stringUserId)

        val hashedPassword = newPassword.hashPassword()

        val response = userService.resetPassword(userId, hashedPassword)

        return ResponseEntity.status(HttpStatus.OK).body(response)
    }

    @PutMapping("/change-email")
    fun changeEmail(
        @CookieValue("jwt") jwt: String,
        @RequestParam(required = true) newEmail: String,
        @RequestParam(required = true) otp: String
    ): ResponseEntity<String> {
        jwtUtils.validateAccessToken(jwt)
        val stringUserId = jwtUtils.getUserIdFromToken(jwt)
        val userId = UUID.fromString(stringUserId)

        val response = userService.changeEmail(userId, newEmail, otp)

        return ResponseEntity.status(HttpStatus.OK).body(response)
    }

    @PostMapping("/reset-password-link")
    fun sendPasswordResetLink(
        @RequestParam(required = true) email: String
    ): ResponseEntity<String> {
        val response = userService.sendPasswordResetLink(email)

        return ResponseEntity.status(HttpStatus.OK).body(response)
    }

    @PostMapping("/reset-otp")
    fun resetOtp(
        @CookieValue("jwt") jwt: String
    ): ResponseEntity<String> {
        jwtUtils.validateAccessToken(jwt)
        val stringUserId = jwtUtils.getUserIdFromToken(jwt)
        val userId = UUID.fromString(stringUserId)

        val response = userService.resetOtp(userId)

        return ResponseEntity.status(HttpStatus.OK).body(response)
    }

    @DeleteMapping("/{id}")
    fun deleteUser(
        @PathVariable id: UUID,
        @CookieValue("jwt") jwt: String
    ): ResponseEntity<String> {
        jwtUtils.validateAccessToken(jwt)

        val result = userService.deleteUser(id)
        return ResponseEntity.status(HttpStatus.OK).body(result)
    }

@GetMapping
fun getAllUsers(
    @CookieValue("jwt") jwt: String,
    @RequestParam(required = false) email: String?,
    @RequestParam(required = false) role: String?,
    @RequestParam(defaultValue = "0") page: Int,
    @RequestParam(defaultValue = "10") size: Int
): ResponseEntity<Map<String, Any>> {
    jwtUtils.validateAccessToken(jwt)

    val (users, totalElements) = userService.getUsersWithEnrollments(email, role, page, size)

    val response = mapOf(
        "content" to users.map { UserResponse.fromEntity(it, sectionService) },  // <- convert to UserResponse
        "totalElements" to totalElements,
        "totalPages" to ((totalElements + size - 1) / size),
        "size" to size,
        "number" to page,
        "first" to (page == 0),
        "last" to (page >= ((totalElements + size - 1) / size) - 1),
        "numberOfElements" to users.size,
        "empty" to users.isEmpty()
    )

    return ResponseEntity.ok(response)
}

@GetMapping("/system-users")
fun getAllSystemUsers(
    @CookieValue("jwt") jwt: String,
    @RequestParam(required = false) email: String?,
    @RequestParam(required = false) role: String?,
    @RequestParam(required = false) isAdviser: Boolean?,
    @RequestParam(defaultValue = "0") page: Int,
    @RequestParam(defaultValue = "10") size: Int
): ResponseEntity<Map<String, Any>> {
    jwtUtils.validateAccessToken(jwt)

    val (users, totalElements) = userService.getUsersWithEnrollments(email, role, isAdviser, page, size)

    val response = mapOf(
        "content" to users.map { UserResponse.fromEntity(it, sectionService) },  // <- convert to UserResponse
        "totalElements" to totalElements,
        "totalPages" to ((totalElements + size - 1) / size),
        "size" to size,
        "number" to page,
        "first" to (page == 0),
        "last" to (page >= ((totalElements + size - 1) / size) - 1),
        "numberOfElements" to users.size,
        "empty" to users.isEmpty()
    )

    return ResponseEntity.ok(response)
}

@GetMapping("/search")
fun searchUsers(
    @CookieValue("jwt") jwt: String,
    @RequestParam(required = false) email: String?,
    @RequestParam(required = false) role: String?,
    @RequestParam(required = false) grade: String?,
    @RequestParam(required = false) section: String?,
    @RequestParam(defaultValue = "0") page: Int,
    @RequestParam(defaultValue = "10") size: Int
): ResponseEntity<Map<String, Any>> {
    jwtUtils.validateAccessToken(jwt)

    val (users, totalElements) = userService.searchUsers(email, role, grade, section, page, size)

    val response = mapOf(
        "content" to users.map { UserResponse.fromEntity(it, sectionService) },  // <- convert to UserResponse
        "totalElements" to totalElements,
        "totalPages" to ((totalElements + size - 1) / size),
        "size" to size,
        "number" to page,
        "first" to (page == 0),
        "last" to (page >= ((totalElements + size - 1) / size) - 1),
        "numberOfElements" to users.size,
        "empty" to users.isEmpty()
    )

    return ResponseEntity.ok(response)
}

    @PutMapping("/{id}")
    fun updateUser(
        @PathVariable id: UUID,
        @RequestBody body: Map<String, String>
    ): ResponseEntity<UserResponse> {   // <- return UserResponse instead of UserEntity
        val email = body["email"]
        val gradeLevel = body["gradeLevel"]
        val section = body["section"]

        // Update user in service
        val updatedUser = userService.updateUser(id, email, gradeLevel, section, null)

        // Convert to UserResponse for frontend
        val userResponse = UserResponse.fromEntity(updatedUser, sectionService)

        return ResponseEntity.ok(userResponse)
    }
}
