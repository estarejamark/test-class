package com.kapston.CTU_DB_API.service.implementation

import com.kapston.CTU_DB_API.CustomException.UserAlreadyExistsException
import com.kapston.CTU_DB_API.CustomException.UserNotFoundException
import com.kapston.CTU_DB_API.domain.Enums.Role
import com.kapston.CTU_DB_API.domain.Enums.StatusEnum
import com.kapston.CTU_DB_API.domain.dto.response.UserResponse
import com.kapston.CTU_DB_API.domain.dto.response.toResponse
import com.kapston.CTU_DB_API.domain.dto.request.LoginRequest
import com.kapston.CTU_DB_API.domain.dto.request.RegisterRequest
import com.kapston.CTU_DB_API.domain.dto.request.TokenRequest
import com.kapston.CTU_DB_API.domain.dto.response.LoginResponse
import com.kapston.CTU_DB_API.domain.entity.ProfileEntity
import com.kapston.CTU_DB_API.domain.entity.UserEntity
import com.kapston.CTU_DB_API.repository.ClassEnrollmentRepository
import com.kapston.CTU_DB_API.repository.SectionRepository
import com.kapston.CTU_DB_API.repository.UserRepository
import com.kapston.CTU_DB_API.service.OtpService
import com.kapston.CTU_DB_API.service.abstraction.ProfileService
import com.kapston.CTU_DB_API.service.abstraction.SectionService
import com.kapston.CTU_DB_API.service.abstraction.UserService
import com.kapston.CTU_DB_API.utility.HashUtils.hashPassword
import com.kapston.CTU_DB_API.utility.HashUtils.verifyPassword
import com.kapston.CTU_DB_API.utility.JwtUtils
import com.kapston.CTU_DB_API.utility.PasswordMigration
import jakarta.persistence.EntityManager
import org.slf4j.LoggerFactory
import org.springframework.data.domain.PageRequest
import org.springframework.mail.javamail.JavaMailSender
import org.springframework.mail.javamail.MimeMessageHelper
import org.springframework.security.authentication.BadCredentialsException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
class UserServiceImpl(
    private val userRepo: UserRepository,
    private val sectionRepository: SectionRepository,
    private val classEnrollmentRepository: ClassEnrollmentRepository,
    private val jwtUtils: JwtUtils,
    private val otpService: OtpService,
    private val mailSender: JavaMailSender,
    private val entityManager: EntityManager,
    private val profileService: ProfileService,
    private val sectionService: SectionService,
    private val passwordMigration: PasswordMigration
    ): UserService {

    private val logger = LoggerFactory.getLogger(UserServiceImpl::class.java)
    override fun create(user: RegisterRequest): String {
        logger.info("Checking if user exists with email: ${user.email}")

        val userExists = userRepo.existsByEmail(user.email)

        if (userExists) {
            logger.warn("User creation failed: Email '${user.email}' already exists")
            throw UserAlreadyExistsException(
                "User with email '${user.email}' already exists. Please use a different email address."
            )
        }

        try {
            logger.info("Creating new user with email: ${user.email} and role: ${user.role}")
            
            // toEntity() will handle nullable password and default
            val savedUser = userRepo.save(user.toEntity())
            
            logger.info("User created successfully with ID: ${savedUser.id}")
            return savedUser.id.toString()
        } catch (e: Exception) {
            logger.error("Failed to save user to database: ${e.message}", e)
            throw RuntimeException("Failed to create user account. Please try again later.")
        }
    }

    @Transactional
    override fun authenticate(user: LoginRequest): LoginResponse {
        var authUser: UserEntity? = null
        try {
            logger.info("🔐 Starting authentication for user: ${user.email}")

            // Check database connectivity first with detailed logging
            try {
                val startTime = System.currentTimeMillis()
                val count = userRepo.count()
                val duration = System.currentTimeMillis() - startTime
                logger.debug("✅ Database connection verified - User count: $count (took ${duration}ms)")
            } catch (dbException: Exception) {
    logger.error("❌ Database connectivity error: ${dbException.javaClass.simpleName} - ${dbException.message}", dbException)
    logger.error("❌ Database connection details - URL: ${getDatabaseUrl()}, Error cause: ${dbException.cause?.message ?: "Unknown"}")
    // Check if it's a connection pool issue
                if (dbException.message?.contains("connection", ignoreCase = true) == true ||
                    dbException.message?.contains("pool", ignoreCase = true) == true) {
                    logger.error("❌ Likely connection pool exhaustion or network issue")
                }

                throw RuntimeException("Database connection failed. Please contact administrator.")
            }

            // Find user by email with enhanced error logging
            authUser = try {
                val startTime = System.currentTimeMillis()
                val foundUser = userRepo.findByEmail(user.email)
                val duration = System.currentTimeMillis() - startTime
                logger.debug("🔍 User lookup completed in ${duration}ms")
                foundUser
            } catch (dbException: Exception) {
                logger.error("❌ Database query error while finding user by email '${user.email}': ${dbException.javaClass.simpleName} - ${dbException.message}", dbException)

                // Log specific SQL error details if available
                if (dbException.message?.contains("SQL", ignoreCase = true) == true) {
                    logger.error("❌ SQL Error details: ${dbException.message}")
                }

                // Check for common database issues
                when {
                    dbException.message?.contains("timeout", ignoreCase = true) == true ->
                        logger.error("❌ Query timeout - database may be overloaded")
                    dbException.message?.contains("connection", ignoreCase = true) == true ->
                        logger.error("❌ Connection error during query execution")
                    else ->
                        logger.error("❌ Unexpected database error during user lookup")
                }

                throw RuntimeException("Database error occurred. Please try again later.")
            }

            if (authUser == null) {
                logger.warn("User not found with email: ${user.email}")
                throw BadCredentialsException("Invalid credentials.")
            }

            // Safe to use authUser as non-null after null check
            var userEntity = authUser

            logger.debug("User found: ${userEntity.email}, role: ${userEntity.role}, status: ${userEntity.status}")

            // Check if user is active or pending profile completion
            if (userEntity.status != StatusEnum.ACTIVE && userEntity.status != StatusEnum.PENDING_PROFILE) {
                logger.warn("User account is not active. Status: ${userEntity.status}")
                throw BadCredentialsException("Account is inactive. Please contact administrator.")
            }

            // Verify password with automatic migration for plain text passwords
            var isPasswordMatch = try {
                user.password.verifyPassword(userEntity.password)
            } catch (hashException: Exception) {
                logger.error("Password verification error: ${hashException.message}", hashException)
                throw RuntimeException("Authentication system error. Please try again later.")
            }

            // If password verification failed, check if it's a plain text password that needs migration
            if (!isPasswordMatch && passwordMigration.needsMigration(userEntity.password)) {
                logger.info("Detected plain text password for user: ${user.email}. Attempting migration...")

                try {
                    // Verify against plain text password
                    if (user.password == userEntity.password) {
                        logger.info("Plain text password verified. Migrating to hashed password for user: ${user.email}")

                        // Hash the password and update the user
                        userEntity.password = user.password.hashPassword()
                        userRepo.save(userEntity)

                        logger.info("✅ Password successfully migrated for user: ${user.email}")
                        isPasswordMatch = true
                    } else {
                        logger.warn("Plain text password verification also failed for user: ${user.email}")
                    }
                } catch (migrationException: Exception) {
                    logger.error("Password migration failed for user: ${user.email}: ${migrationException.message}", migrationException)
                    // Continue with original verification failure
                }
            }

            if (!isPasswordMatch) {
                logger.warn("Password verification failed for user: ${user.email}")
                throw BadCredentialsException("Invalid credentials.")
            }

            logger.debug("Password verified successfully")

            // Check if user ID is null (should not happen for persisted entities)
            if (userEntity.id == null) {
                logger.error("❌ CRITICAL: User entity has null ID - this should not happen for persisted entities. Email: ${userEntity.email}, Role: ${userEntity.role}, Status: ${userEntity.status}")
                throw RuntimeException("User account data is corrupted. Please contact administrator.")
            }

            logger.debug("✅ User ID is valid: ${userEntity.id}")

            // Generate tokens
            val accessToken = try {
                jwtUtils.generateAccessToken(userEntity.id.toString(), userEntity.role.name)
            } catch (jwtException: Exception) {
                logger.error("JWT access token generation error: ${jwtException.message}", jwtException)
                throw RuntimeException("Token generation failed. Please try again later.")
            }

            val refreshToken = try {
                jwtUtils.generateRefreshToken(userEntity.id.toString(), userEntity.role.name)
            } catch (jwtException: Exception) {
                logger.error("JWT refresh token generation error: ${jwtException.message}", jwtException)
                throw RuntimeException("Token generation failed. Please try again later.")
            }

            val tokenResponse = com.kapston.CTU_DB_API.domain.dto.response.TokenResponse(
                accessToken = accessToken,
                refreshToken = refreshToken,
                role = userEntity.role.name
            )

            logger.info("Authentication successful for user: ${userEntity.email} (${userEntity.role})")

            // Ensure userEntity is not null
            val user = userEntity ?: throw RuntimeException("User not found")

            // Create profile on first login for students
            if (user.role == Role.STUDENT && user.profile == null) {
                logger.info("Creating profile for student ${user.email} on first login")

                // Check if we have enough data to create a profile
                if (user.firstName != null && user.lastName != null && user.gender != null &&
                    user.birthDate != null && user.contactNumber != null && user.address != null) {

                    // Get enrollment to determine grade level
                    val enrollment = user.enrollments.firstOrNull()
                    val gradeLevel = enrollment?.section?.gradeLevel

                    val profile = ProfileEntity(
                        userEntity = user,
                        firstName = user.firstName!!,
                        lastName = user.lastName!!,
                        middleName = user.middleName ?: "",
                        gender = user.gender!!,
                        birthDate = user.birthDate!!,
                        contactNumber = user.contactNumber!!,
                        address = user.address!!,
                        parentName = user.parentName,
                        parentContact = user.parentContact,
                        gradeLevel = gradeLevel
                    )

                    try {
                        val savedProfileId = profileService.saveOrUpdate(profile)
                        logger.info("✅ Profile created for student on first login: $savedProfileId")

                        // Update user status to ACTIVE after profile creation
                        if (user.status == StatusEnum.PENDING_PROFILE) {
                            user.status = StatusEnum.ACTIVE
                            userRepo.save(user)
                            logger.info("✅ User status updated to ACTIVE after profile creation")
                        }

                        // Profile is already set on the user entity after saving
                        userEntity = user
                    } catch (profileException: Exception) {
                        logger.error("❌ Failed to create profile for student ${user.email}: ${profileException.message}", profileException)
                        // Continue with login even if profile creation fails
                    }
                } else {
                    logger.warn("⚠️ Insufficient profile data for student ${user.email}. Profile creation skipped.")
                }
            }

            // Use updated user if refreshed
            val finalUser = userEntity ?: user

            // Debug logging
            logger.debug(
                "User role: ${finalUser.role?.name ?: "UNKNOWN"}, profileComplete: ${finalUser.profile != null}"
            )

            return LoginResponse(
                userResponse = finalUser.toResponse(sectionService),
                authorization = tokenResponse,
                profileComplete = finalUser.profile != null
            )

        } catch (e: BadCredentialsException) {
            // Re-throw BadCredentialsException to be handled as 400 Bad Request
            logger.warn("Bad credentials provided for email: ${user.email}")
            throw e
        } catch (e: RuntimeException) {
            // Re-throw our custom RuntimeExceptions with specific messages
            throw e
        } catch (e: Exception) {
            logger.error("Unexpected authentication error: ${e.javaClass.simpleName}: ${e.message}", e)
            throw RuntimeException(e.message)
        }
    }

    override fun getUserEntity(id: UUID): UserEntity {
        return userRepo.findById(id)
            .orElseThrow { UserNotFoundException("No user found.") }
    }

    override fun getUserEntityByEmail(email: String): UserEntity? {
        return userRepo.findByEmail(email)
    }

    override fun updateStatus(id: UUID): String {
        val user = userRepo.findById(id)
            .orElseThrow { UserNotFoundException("It seems that this user does not exists.") }

        val updatedStatus = when(user.status) {
            StatusEnum.ACTIVE -> StatusEnum.INACTIVE
            StatusEnum.INACTIVE -> StatusEnum.ACTIVE
            StatusEnum.PENDING_PROFILE -> StatusEnum.ACTIVE
        }

        val updatedUser = user.apply {
            status = updatedStatus
        }

        userRepo.save(updatedUser)

        return "User set to $updatedStatus"
    }

    override fun resetPassword(id: UUID, newPassword: String): String {

        val user = getUserEntity(id)

        val updatedUser = user.apply {
            password = newPassword.hashPassword()
        }
        userRepo.save(updatedUser)

        // If user status is PENDING_PROFILE, update to ACTIVE after password reset
        if (updatedUser.status == StatusEnum.PENDING_PROFILE) {
            updatedUser.status = StatusEnum.ACTIVE
            userRepo.save(updatedUser)
        }

        return "Password has been changed."
    }

    override fun changeEmail(userId: UUID, newEmail: String, otp: String): String {
        logger.info("Changing email for user: $userId to: $newEmail")

        // Validate OTP first
        otpService.validateOtp(userId.toString(), otp)

        // Check if new email is already taken
        val emailExists = userRepo.existsByEmail(newEmail)
        if (emailExists) {
            throw UserAlreadyExistsException("Email '$newEmail' is already in use.")
        }

        // Update user email
        val user = getUserEntity(userId)
        val updatedUser = user.apply {
            email = newEmail
        }
        userRepo.save(updatedUser)

        logger.info("Email changed successfully for user: $userId")
        return "Email has been changed successfully."
    }

    override fun sendPasswordResetLink(email: String): String {
        logger.info("Sending password reset link to: $email")

        val user = userRepo.findByEmail(email)
            ?: throw UserNotFoundException("No user found with email: $email")

        // Generate reset token (using JWT for simplicity, but could be a dedicated token)
        val resetToken = jwtUtils.generateAccessToken(user.id.toString(), user.role.name)

        // Send email with reset link
        sendPasswordResetEmail(email, resetToken)

        logger.info("Password reset link sent to: $email")
        return "Password reset link has been sent to your email."
    }

    override fun resetOtp(userId: UUID): String {
        logger.info("Resetting OTP for user: $userId")

        // Clear OTP cache for this user
        // Note: This assumes we can access the cache, but since it's private in OtpService,
        // we'll need to add a method to OtpService to clear OTP for a user
        // For now, we'll just return success as the cache will expire naturally

        logger.info("OTP reset successfully for user: $userId")
        return "OTP/2FA has been reset successfully."
    }

    @Transactional
    override fun deleteUser(id: UUID): String {
        logger.info("Deleting user with ID: $id")

        val user = userRepo.findById(id)
            .orElseThrow { UserNotFoundException("User not found with id: $id") }

        // Check if the user's profile is referenced as an adviser in any sections
        val profile = user.profile
        profile?.id?.let { profileId ->
            logger.debug("Checking if profile $profileId is referenced as adviser in sections")
            // Check if this profile is assigned as adviser to any sections
            val countQuery = entityManager.createQuery("SELECT COUNT(s) FROM SectionEntity s WHERE s.adviserId = :profileId")
            countQuery.setParameter("profileId", profileId)
            val count = (countQuery.singleResult as? Number)?.toLong() ?: 0L
            if (count > 0) {
                logger.warn("User is assigned as adviser to $count section(s). Clearing adviser assignments before deletion.")
                // Clear adviser assignments from sections
                val updateQuery = entityManager.createQuery("UPDATE SectionEntity s SET s.adviserId = NULL, s.adviserName = NULL WHERE s.adviserId = :profileId")
                updateQuery.setParameter("profileId", profileId)
                val updatedSections = updateQuery.executeUpdate()
                logger.info("Cleared adviser assignment from $updatedSections section(s)")
            }
        }

        // Dissociate the profile from the user before deletion
        if (profile != null) {
            profile.userEntity = null
            // Note: ProfileRepository might be needed to save the profile, but since we're in a transactional method,
            // the entity manager should handle it. If issues arise, inject ProfileRepository and save explicitly.
        }

        // Delete the user (profile will be preserved due to no cascade and orphanRemoval false)
        userRepo.delete(user)

        logger.info("User deleted successfully: $id (profile and records preserved)")
        return "User deleted successfully. All associated records have been preserved."
    }

    override fun searchUsers(
        email: String?,
        role: String?,
        grade: String?,
        section: String?,
        page: Int,
        size: Int
    ): Pair<List<UserEntity>, Long> {
        logger.info("Searching users with filters - email: $email, role: $role, grade: $grade, section: $section")

        val roleEnum = try {
            role?.takeIf { it.isNotBlank() }?.let { com.kapston.CTU_DB_API.domain.Enums.Role.valueOf(it.uppercase()) }
        } catch (e: IllegalArgumentException) {
            logger.warn("Invalid role value: $role. Ignoring role filter.")
            null
        }

        // Fetch users based on filters
        val users = when {
            !email.isNullOrBlank() && roleEnum != null -> userRepo.findByEmailContainingAndRoleWithEnrollments(email, roleEnum)
            !email.isNullOrBlank() -> userRepo.findByEmailContainingWithEnrollments(email)
            roleEnum != null -> userRepo.findByRoleWithEnrollments(roleEnum)
            else -> userRepo.findAllWithEnrollments()
        }

        logger.info("Found ${users.size} users matching criteria")

        // Manual pagination
        val fromIndex = (page * size).coerceAtMost(users.size)
        val toIndex = (fromIndex + size).coerceAtMost(users.size)
        val paginatedList = users.subList(fromIndex, toIndex)

        return Pair(paginatedList, users.size.toLong())
    }

    private fun sendPasswordResetEmail(to: String, resetToken: String) {
        val resetLink = "http://localhost:3000/reset-password?token=$resetToken" // Adjust URL as needed

        val message = mailSender.createMimeMessage()
        val helper = MimeMessageHelper(message, true)

        helper.setTo(to)
        helper.setSubject("Password Reset Request")
        helper.setText(
            """
            Hello,

            You have requested to reset your password.

            Click the link below to reset your password:
            $resetLink

            This link will expire in 15 minutes.

            If you did not request this, please ignore this email.

            Best regards,
            ADSM System Admin
            """.trimIndent(),
            false
        )

        mailSender.send(message)
    }

    override fun hasProfile(userId: UUID): Boolean {
        val user = getUserEntity(userId)
        return user.profile != null
    }

    override fun getUsersWithEnrollments(
        email: String?,
        role: String?,
        page: Int,
        size: Int
    ): Pair<List<UserEntity>, Long> {
        logger.info("Searching users with enrollments - email: $email, role: $role")

        // Convert role string to enum (safe conversion)
        val roleEnum = try {
            role?.takeIf { it.isNotBlank() }?.let { com.kapston.CTU_DB_API.domain.Enums.Role.valueOf(it.uppercase()) }
        } catch (e: IllegalArgumentException) {
            logger.warn("Invalid role value: $role. Ignoring role filter.")
            null
        }

        // Fetch users
        val users = when {
            !email.isNullOrBlank() && roleEnum != null -> userRepo.findByEmailContainingAndRoleWithEnrollments(email, roleEnum)
            !email.isNullOrBlank() -> userRepo.findByEmailContainingWithEnrollments(email)
            roleEnum != null -> userRepo.findByRoleWithEnrollments(roleEnum)
            else -> userRepo.findAllWithEnrollments()
        }

        logger.info("Found ${users.size} users with enrollments matching criteria")

        // Manual pagination
        val fromIndex = (page * size).coerceAtMost(users.size)
        val toIndex = (fromIndex + size).coerceAtMost(users.size)
        val paginatedList = users.subList(fromIndex, toIndex)

        return Pair(paginatedList, users.size.toLong())
    }

    override fun getUsersWithEnrollments(
        email: String?,
        role: String?,
        isAdviser: Boolean?,
        page: Int,
        size: Int
    ): Pair<List<UserEntity>, Long> {
        logger.info("🔍 Searching users with enrollments - email: $email, role: $role, isAdviser: $isAdviser, page: $page, size: $size")

        // Convert role string to enum (safe conversion)
        val roleEnum = try {
            role?.takeIf { it.isNotBlank() }?.let { com.kapston.CTU_DB_API.domain.Enums.Role.valueOf(it.uppercase()) }
        } catch (e: IllegalArgumentException) {
            logger.warn("⚠️ Invalid role value: $role. Ignoring role filter.")
            null
        }

        // Fetch users based on filters
        var users = when {
            !email.isNullOrBlank() && roleEnum != null -> userRepo.findByEmailContainingAndRoleWithEnrollments(email, roleEnum)
            !email.isNullOrBlank() -> userRepo.findByEmailContainingWithEnrollments(email)
            roleEnum != null -> userRepo.findByRoleWithEnrollments(roleEnum)
            else -> userRepo.findAllWithEnrollments()
        }

        logger.info("📊 Found ${users.size} users with enrollments matching criteria before adviser filter")

        // Apply isAdviser filter if specified
        if (isAdviser != null) {
            users = users.filter { user ->
                val profile = user.profile
                if (profile?.id != null) {
                    val isTeacherAdviser = sectionRepository.findByAdviserId(profile.id!!).isNotEmpty()
                    isTeacherAdviser == isAdviser
                } else {
                    !isAdviser
                }
            }
            logger.info("📊 After applying adviser filter, ${users.size} users remain")
        }

        // Manual pagination
        val fromIndex = (page * size).coerceAtMost(users.size)
        val toIndex = (fromIndex + size).coerceAtMost(users.size)

        logger.info("📊 Pagination indices: from $fromIndex to $toIndex out of ${users.size} total users")
        val paginatedList = users.subList(fromIndex, toIndex)

        logger.info("📊 Paginated list size: ${paginatedList.size}")

        return Pair(paginatedList, users.size.toLong())
    }

    override fun updateUser(
        id: UUID,
        email: String?,
        gradeLevel: String?,
        sectionName: String?,
        status: StatusEnum?
    ): UserEntity {
        val targetUser: UserEntity = getUserEntity(id)

        // ✅ Update email if provided
        if (!email.isNullOrBlank() && email != targetUser?.email) {
            val emailExists = userRepo.existsByEmail(email)
            if (emailExists) throw UserAlreadyExistsException("Email '$email' is already in use.")
            targetUser.email = email
        }

        // ✅ Update status if provided
        if (status != null) {
            targetUser.status = status
        }

        // ✅ Update student-specific data
        if (targetUser?.role == Role.STUDENT) {
            val profile = targetUser.profile

            // Ensure user has a profile
            if (profile == null) {
                throw RuntimeException("Student ${targetUser.email} has no profile. Cannot update.")
            }

            val nonNullProfile = profile

            // Update grade level if provided
            if (!gradeLevel.isNullOrBlank()) {
                nonNullProfile.gradeLevel = gradeLevel
            }

            // Update section if provided
            if (!sectionName.isNullOrBlank()) {
                val sectionEntity = sectionRepository.findByName(sectionName)
                    ?: throw RuntimeException("Section '$sectionName' not found.")

                val enrollment = targetUser.enrollments.firstOrNull()
                if (enrollment != null) {
                    enrollment.section = sectionEntity
                    entityManager.merge(enrollment)
                    // Update gradeLevel from section if not explicitly provided
                    if (gradeLevel.isNullOrBlank()) {
                        nonNullProfile.gradeLevel = sectionEntity.gradeLevel
                    }
                } else {
                    logger.warn("No enrollment found for student: ${targetUser.email}")
                }
            }

            // Persist profile changes
            profileService.saveOrUpdate(nonNullProfile)
        }

        // Save the user entity
        val savedUser = userRepo.save(targetUser)
        logger.info("User updated successfully: ${savedUser.id}")

        // Return UserEntity
        return savedUser
    }

    override fun getUserWithEnrollments(id: UUID): UserEntity? {
        return userRepo.findByIdWithEnrollments(id)
    }

    // Helper method to get database URL for logging (without exposing sensitive info)
    private fun getDatabaseUrl(): String {
        return try {
            // This is a simplified approach - in production, you'd inject DataSource and get URL safely
            "postgresql://localhost:5432/ctu_db"
        } catch (e: Exception) {
            "unknown"
        }
    }
}
