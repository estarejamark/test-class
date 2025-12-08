package com.kapston.CTU_DB_API.service

import org.slf4j.LoggerFactory
import com.github.benmanes.caffeine.cache.Cache
import com.github.benmanes.caffeine.cache.Caffeine
import com.kapston.CTU_DB_API.CustomException.OtpInvalidException
import com.kapston.CTU_DB_API.CustomException.OtpTooManyRequestException
import com.kapston.CTU_DB_API.CustomException.UserNotFoundException
import com.kapston.CTU_DB_API.repository.UserRepository
import com.kapston.CTU_DB_API.utility.JwtUtils
import com.kapston.CTU_DB_API.utility.OtpGeneratorUtil
import org.springframework.mail.javamail.JavaMailSender
import org.springframework.mail.javamail.MimeMessageHelper
import org.springframework.stereotype.Service
import java.util.concurrent.TimeUnit

@Service
class OtpService(
    private val mailSender: JavaMailSender,
    private val userRepository: UserRepository,
    private val jwtUtils: JwtUtils
) {
    private val logger = LoggerFactory.getLogger(OtpService::class.java)

    private val otpCache: Cache<String, String> = Caffeine.newBuilder()
        .expireAfterWrite(5, TimeUnit.MINUTES)
        .maximumSize(10_000)
        .build()

    private val requestLimitCache: Cache<String, Int> = Caffeine.newBuilder()
        .expireAfterWrite(15, TimeUnit.MINUTES)
        .maximumSize(10_000)
        .build()

    fun generateOtp(userEmail: String): String {
        try {
            val user = userRepository.findByEmail(userEmail)
            val userUUID = user?.id ?: throw UserNotFoundException("Invalid email.")

            val userId = userUUID.toString()
            val role = user.role.name // Get the role from the user entity
            val token = jwtUtils.generateAccessToken(userId, role)

            val attempts = requestLimitCache.getIfPresent(userUUID.toString()) ?: 0
            if (attempts >= 5) {
                throw OtpTooManyRequestException("OTP request limit reached. Try again later.")
            }

            val otp = OtpGeneratorUtil.generateOtp()
            otpCache.put(userId, otp)
            requestLimitCache.put(userId, attempts + 1)

            sendOtpEmail(userEmail, otp)
            logger.info("OTP generated and sent to $userEmail")

            return token
        } catch (ex: Exception) {
            logger.error("Error generating OTP for $userEmail", ex)
            throw ex  // rethrow so the controller still sees it
        }
    }

    private fun sendOtpEmail(to: String, otp: String) {
        val message = mailSender.createMimeMessage()
        val helper = MimeMessageHelper(message, true)

        helper.setTo(to)
        helper.setSubject("Your OTP Code")
        helper.setText(
            """
            Hello,
            
            Your One-Time Password (OTP) is: $otp
            
            This code will expire in 5 minutes. 
            
            If you did not request this, please ignore this email.
            """.trimIndent(),
            false
        )

        mailSender.send(message)
    }

    fun validateOtp(userId: String, inputOtp: String) {
        val cachedOtp = otpCache.getIfPresent(userId)
        if (cachedOtp == null || cachedOtp != inputOtp) {
            otpCache.invalidate(userId)
            throw OtpInvalidException("OTP is invalid.")
        }
    }
}