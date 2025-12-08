package com.kapston.CTU_DB_API.utility

import com.kapston.CTU_DB_API.repository.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional

/**
 * Utility class to migrate plain text passwords to BCrypt hashed passwords
 * Run this once to fix existing users with plain text passwords
 */
@Component
class PasswordMigration(
    private val userRepository: UserRepository
) {
    private val logger = LoggerFactory.getLogger(PasswordMigration::class.java)
    private val passwordEncoder = BCryptPasswordEncoder()

    /**
     * Migrates all plain text passwords to BCrypt hashes
     * Only processes passwords that are not already BCrypt hashes (don't start with $2a$)
     */
    @Transactional
    fun migratePlainTextPasswords(): Int {
        logger.info("Starting password migration...")

        val allUsers = userRepository.findAll()
        var migratedCount = 0

        for (user in allUsers) {
            // Check if password is already hashed (BCrypt hashes start with $2a$)
            if (!user.password.startsWith("\$2a\$")) {
                logger.info("Migrating password for user: ${user.email}")

                // Hash the plain text password
                val hashedPassword = passwordEncoder.encode(user.password)

                // Update the user with hashed password
                user.password = hashedPassword
                userRepository.save(user)

                migratedCount++
                logger.info("Successfully migrated password for user: ${user.email}")
            } else {
                logger.debug("Password already hashed for user: ${user.email}")
            }
        }

        logger.info("Password migration completed. Migrated $migratedCount users.")
        return migratedCount
    }

    /**
     * Checks if a password needs migration (not BCrypt hashed)
     */
    fun needsMigration(password: String): Boolean {
        return !password.startsWith("\$2a\$")
    }

    /**
     * Reset passwords for specific users to new values
     */
    @Transactional
    fun resetPasswords(passwordMap: Map<String, String>): Int {
        logger.info("Starting password reset for ${passwordMap.size} users...")

        var resetCount = 0

        for ((email, newPassword) in passwordMap) {
            val user = userRepository.findByEmail(email)
            if (user != null) {
                logger.info("Resetting password for user: $email")

                // Hash the new password
                val hashedPassword = passwordEncoder.encode(newPassword)

                // Update the user with new hashed password
                user.password = hashedPassword
                userRepository.save(user)

                resetCount++
                logger.info("Successfully reset password for user: $email")
            } else {
                logger.warn("User not found: $email")
            }
        }

        logger.info("Password reset completed. Reset $resetCount users.")
        return resetCount
    }

    /**
     * Test method to verify password migration worked
     */
    fun verifyMigration(email: String, plainPassword: String): Boolean {
        val user = userRepository.findByEmail(email)
        return if (user != null) {
            passwordEncoder.matches(plainPassword, user.password)
        } else {
            false
        }
    }
}
