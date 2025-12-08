package com.kapston.CTU_DB_API.controller

import com.kapston.CTU_DB_API.service.OtpService
import com.kapston.CTU_DB_API.utility.CookieUtils
import com.kapston.CTU_DB_API.utility.JwtUtils
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.CookieValue
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/otp")
class OtpController(
    private val otpService: OtpService,
    private val jwtUtils: JwtUtils,
    private val cookieUtils: CookieUtils,
    ) {

    @PostMapping()
    fun requestOtp(
        @RequestParam email: String,
        response: HttpServletResponse
    ): ResponseEntity<String> {
        val otpToken = otpService.generateOtp( email)

        val cookie = cookieUtils.createJwtCookie(otpToken)
        response.addCookie(cookie)

        return ResponseEntity.ok("OTP has been sent to your email")
    }

    @PostMapping("/verification")
    fun validateOtp(
        @RequestParam otp: String,
        @CookieValue("jwt") jwt: String
    ): ResponseEntity<String> {

        val userId = jwtUtils.getUserIdFromToken(jwt)
        otpService.validateOtp(userId, otp)

        return ResponseEntity.ok("OTP valid")
    }
}
