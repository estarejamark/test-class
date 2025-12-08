package com.kapston.CTU_DB_API.controller

import com.kapston.CTU_DB_API.domain.dto.request.LoginRequest
import com.kapston.CTU_DB_API.domain.dto.response.LoginResponse
import com.kapston.CTU_DB_API.domain.dto.response.UserResponse
import com.kapston.CTU_DB_API.domain.dto.response.toResponse
import com.kapston.CTU_DB_API.service.abstraction.AuthenticationService
import com.kapston.CTU_DB_API.service.abstraction.SectionService
import com.kapston.CTU_DB_API.service.abstraction.UserService
import com.kapston.CTU_DB_API.utility.CookieUtils
import com.kapston.CTU_DB_API.utility.JwtUtils
import jakarta.servlet.http.HttpServletResponse
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.UUID

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = ["http://localhost:3000"], allowCredentials = "true")
class AuthController(
    private val userService: UserService,
    private val authenticationService: AuthenticationService,
    private val sectionService: SectionService,
    private val jwtUtils: JwtUtils,
    private val cookieUtils: CookieUtils,
    private val passwordMigration: com.kapston.CTU_DB_API.utility.PasswordMigration
) {
    private val logger = LoggerFactory.getLogger(AuthController::class.java)

    // ✅ Login endpoint
    @PostMapping("/session")
    fun login(
        @Valid @RequestBody user: LoginRequest,
        request: HttpServletRequest,
        response: HttpServletResponse
    ): ResponseEntity<LoginResponse> {
        // Expire any old cookies first
        response.addCookie(cookieUtils.createExpiredJwtCookie())
        response.addCookie(cookieUtils.createExpiredRefreshCookie())

        return try {
            logger.info("🔐 Login attempt for email: ${user.email}")

            // Authenticate credentials and get LoginResponse
            val loginResponse: LoginResponse = userService.authenticate(user)

            // Remove any old tokens
            authenticationService.logoutByUserId(loginResponse.userResponse.id)

            // Generate and save new JWT + refresh tokens
            val tokenEntity = authenticationService.generateAndSaveTokens(
                loginResponse.userResponse.id,
                loginResponse.userResponse.role.name
            )

            // Set cookies for frontend
            response.addCookie(cookieUtils.createJwtCookie(tokenEntity.hashedAccessToken))
            response.addCookie(cookieUtils.createRefreshCookie(tokenEntity.hashedRefreshToken))

            // ✅ Create session for fallback authentication
            val session = request.getSession(true) // creates session if missing
            session.setAttribute("user", loginResponse.userResponse)

            logger.info("✅ Login successful for user: ${user.email}")
            ResponseEntity.ok(loginResponse)

        } catch (e: Exception) {
            logger.error("💥 Login failed for ${user.email}: ${e.message}", e)
            ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(null)
        }
    }


    // ✅ Refresh endpoint
    @PostMapping("/refresh")
    fun refresh(
        @CookieValue("refresh_token", required = false) refreshToken: String?,
        response: HttpServletResponse
    ): ResponseEntity<Map<String, String>> {
        if (refreshToken.isNullOrEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(mapOf("error" to "Refresh token missing"))
        }

        val userId = UUID.fromString(jwtUtils.getUserIdFromToken(refreshToken))
        // AuthenticationService.refresh returns String according to interface, need to change its usage
        val newAccessToken: String = authenticationService.refresh(userId)

        // Update cookies with new token strings
        response.addCookie(cookieUtils.createJwtCookie(newAccessToken))
        // For refresh token cookie, we do not have new hashedRefreshToken string from service; remove or handle separately
        response.addCookie(cookieUtils.createExpiredRefreshCookie())

        return ResponseEntity.ok(
            mapOf(
                "accessToken" to newAccessToken,
                "refreshToken" to "" // No new refresh token string returned here
            )
        )
    }

    // ✅ Logout endpoint
    @PostMapping("/logout")
    fun logout(
        @CookieValue("jwt", required = false) jwt: String?,
        response: HttpServletResponse
    ): ResponseEntity<String> {
        if (!jwt.isNullOrEmpty()) {
            try {
                authenticationService.logout(jwt)
            } catch (e: Exception) {
                logger.warn("⚠️ Error deleting tokens for logout: ${e.message}")
            }
        }

        // Expire cookies
        response.addCookie(cookieUtils.createExpiredJwtCookie())
        response.addCookie(cookieUtils.createExpiredRefreshCookie())

        return ResponseEntity.ok("Logged out successfully")
    }

    // ✅ Get current user info
    @GetMapping("/me")
    fun getCurrentUser(@CookieValue("jwt") jwt: String): ResponseEntity<LoginResponse> {
        authenticationService.validateAccessToken(jwt)
        val userId = UUID.fromString(jwtUtils.getUserIdFromToken(jwt))
        val userEntity = userService.getUserEntity(userId)

        val loginResponse = LoginResponse(
            userResponse = userEntity.toResponse(sectionService),
            authorization = null,
            profileComplete = userEntity.profile != null
        )
        return ResponseEntity.ok(loginResponse)
    }

    // ✅ Password migration endpoint (admin only - run once to fix plain text passwords)
    @PostMapping("/migrate-passwords")
    fun migratePasswords(): ResponseEntity<Map<String, Any>> {
        return try {
            logger.info("🔄 Starting password migration...")
            val migratedCount = passwordMigration.migratePlainTextPasswords()
            logger.info("✅ Password migration completed. Migrated $migratedCount users.")

            ResponseEntity.ok(mapOf(
                "success" to true,
                "message" to "Password migration completed successfully",
                "migratedUsers" to migratedCount
            ))
        } catch (e: Exception) {
            logger.error("💥 Password migration failed: ${e.message}", e)
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(mapOf(
                    "success" to false,
                    "message" to "Password migration failed: ${e.message}",
                    "migratedUsers" to 0
                ))
        }
    }

    // ✅ Password reset endpoint (admin only - reset specific user passwords)
    @PostMapping("/reset-passwords")
    fun resetPasswords(@RequestBody passwordMap: Map<String, String>): ResponseEntity<Map<String, Any>> {
        return try {
            logger.info("🔄 Starting password reset for ${passwordMap.size} users...")
            val resetCount = passwordMigration.resetPasswords(passwordMap)
            logger.info("✅ Password reset completed. Reset $resetCount users.")

            ResponseEntity.ok(mapOf(
                "success" to true,
                "message" to "Password reset completed successfully",
                "resetUsers" to resetCount
            ))
        } catch (e: Exception) {
            logger.error("💥 Password reset failed: ${e.message}", e)
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(mapOf(
                    "success" to false,
                    "message" to "Password reset failed: ${e.message}",
                    "resetUsers" to 0
                ))
        }
    }

    // ✅ Debug endpoint to check password hash for a user (temporary for debugging)
    @GetMapping("/debug-password/{email}")
    fun debugPassword(@PathVariable email: String): ResponseEntity<Map<String, Any>> {
        return try {
            val user = userService.getUserEntityByEmail(email)
            if (user != null) {
                ResponseEntity.ok(mapOf(
                    "email" to user.email,
                    "passwordHash" to (user.password ?: ""),
                    "isBCrypt" to (user.password?.startsWith("\$2a\$") ?: false),
                    "status" to user.status
                ))
            } else {
                ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(mapOf("error" to "User not found"))
            }
        } catch (e: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(mapOf("error" to (e.message ?: "Unknown error")))
        }
    }
}
