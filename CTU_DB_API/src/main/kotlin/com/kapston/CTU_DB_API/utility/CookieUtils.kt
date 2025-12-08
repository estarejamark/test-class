package com.kapston.CTU_DB_API.utility

import jakarta.servlet.http.Cookie
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component

@Component
class CookieUtils(
    @Value("\${cookie.max-age-seconds}") private val cookieMaxAge: Int
) {

    // ✅ Access token cookie
    fun createJwtCookie(token: String): Cookie {
        return Cookie("jwt", token).apply {
            isHttpOnly = true
            secure = false // false for localhost development
            path = "/"
            maxAge = cookieMaxAge
        }
    }

    // ✅ Expire access token cookie
    fun createExpiredJwtCookie(): Cookie {
        return Cookie("jwt", "").apply {
            isHttpOnly = true
            secure = false
            path = "/"
            maxAge = 0
        }
    }

    // ✅ Refresh token cookie
    fun createRefreshCookie(token: String): Cookie {
        return Cookie("refresh_token", token).apply {
            isHttpOnly = true
            secure = false
            path = "/"
            maxAge = cookieMaxAge * 7 // longer validity for refresh token (e.g., 7 days)
        }
    }

    // ✅ Expire refresh token cookie
    fun createExpiredRefreshCookie(): Cookie {
        return Cookie("refresh_token", "").apply {
            isHttpOnly = true
            secure = false
            path = "/"
            maxAge = 0
        }
    }
}
