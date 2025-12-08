package com.kapston.CTU_DB_API.utility

import com.kapston.CTU_DB_API.domain.Enums.Role
import com.kapston.CTU_DB_API.domain.dto.response.UserResponse
import com.kapston.CTU_DB_API.service.abstraction.AuthenticationService
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

@Component
class JwtAuthenticationFilter(
    private val authenticationService: AuthenticationService,
    private val jwtUtils: JwtUtils
) : OncePerRequestFilter() {

    companion object {
        private val logger = LoggerFactory.getLogger(JwtAuthenticationFilter::class.java)
    }

    // List of endpoints that don't require authentication
    private val publicEndpoints = listOf(
        "/api/auth/session",
        "/api/otp/verification",
        "/api/otp",
        "/api/users/reset-password",
        "/api/school-profile",
        "/api/school-year",
        "/api/welcome",
        "/swagger-ui",
        "/v3/api-docs"
    )

    override fun shouldNotFilter(request: HttpServletRequest): Boolean {
        val uri = request.requestURI
        return publicEndpoints.any { uri.startsWith(it) }
    }

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        logger.info("--------- JWT FILTER START ---------")

        try {
            val jwt = extractJwt(request)

            logger.info("Request URI: ${request.requestURI}")
            logger.info("Authorization header raw: ${request.getHeader("Authorization") ?: "none"}")
            logger.info("JWT extracted: ${jwt ?: "none"}")
            logger.info("Auth BEFORE filter: ${SecurityContextHolder.getContext().authentication}")

            if (jwt != null && SecurityContextHolder.getContext().authentication == null) {
                // JWT validation
                val valid = authenticationService.validateAccessToken(jwt)
                logger.info("Token validation result = $valid")

                if (!valid) {
                    logger.warn("Invalid JWT token – rejecting request")
                    response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid JWT token")
                    return
                }

                val userId = jwtUtils.getUserIdFromToken(jwt)
                val role = jwtUtils.getRoleFromToken(jwt).uppercase()
                val authorities = listOf(SimpleGrantedAuthority("ROLE_$role"))

                val authToken = UsernamePasswordAuthenticationToken(userId, null, authorities)
                authToken.details = WebAuthenticationDetailsSource().buildDetails(request)
                SecurityContextHolder.getContext().authentication = authToken

                logger.info("Auth AFTER filter: ${SecurityContextHolder.getContext().authentication}")

            } else if (jwt == null && SecurityContextHolder.getContext().authentication == null) {
                // Fallback: check session for user with ADMIN role
                val session = request.getSession(false)
                val sessionUser = session?.getAttribute("user") as? UserResponse

                if (sessionUser != null && sessionUser.role == Role.ADMIN) {
                    val authorities = listOf(SimpleGrantedAuthority("ROLE_ADMIN"))
                    val authToken = UsernamePasswordAuthenticationToken(sessionUser.id, null, authorities)
                    authToken.details = WebAuthenticationDetailsSource().buildDetails(request)
                    SecurityContextHolder.getContext().authentication = authToken
                    logger.info("Session fallback authentication successful for ADMIN: ${sessionUser.id}")
                } else if (sessionUser != null) {
                    logger.warn("Session user found but is not ADMIN: ${sessionUser.id}")
                } else {
                    logger.info("No session user found for fallback authentication")
                }
            }

        } catch (e: Exception) {
            logger.error("❌ JWT FILTER ERROR", e)
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "JWT authentication failed")
            return
        }

        logger.info("--------- JWT FILTER END ---------")
        filterChain.doFilter(request, response)
    }

    private fun extractJwt(request: HttpServletRequest): String? {
        val header = request.getHeader("Authorization")
        if (header != null && header.startsWith("Bearer ")) {
            logger.debug("JWT token extracted from Authorization header")
            return header.substring(7)
        }

        val cookies = request.cookies ?: return null
        cookies.firstOrNull { it.name.equals("jwt", ignoreCase = true) }?.let {
            logger.debug("JWT token extracted from cookie: ${it.name}")
            return it.value
        }

        return null
    }
}
