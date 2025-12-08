package com.kapston.CTU_DB_API.config

import com.kapston.CTU_DB_API.service.CustomUserDetailsService
import com.kapston.CTU_DB_API.utility.JwtAuthenticationFilter
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpMethod
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.http.SessionCreationPolicy

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter
import org.springframework.security.web.context.HttpSessionSecurityContextRepository
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.UrlBasedCorsConfigurationSource

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
class SecurityConfig(
    private val jwtAuthenticationFilter: JwtAuthenticationFilter,
    private val customUserDetailsService: CustomUserDetailsService
) {

    @Bean
    fun passwordEncoder(): PasswordEncoder = BCryptPasswordEncoder()

    @Bean
    fun httpSessionSecurityContextRepository(): HttpSessionSecurityContextRepository =
        HttpSessionSecurityContextRepository()

    @Bean
    fun corsConfigurationSource(): UrlBasedCorsConfigurationSource {
        val configuration = CorsConfiguration().apply {
            allowedOriginPatterns = listOf("http://localhost:3000", "http://localhost:3001")
            allowedMethods = listOf("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
            allowedHeaders = listOf("*")
            allowCredentials = true
            exposedHeaders = listOf("Set-Cookie")
        }

        return UrlBasedCorsConfigurationSource().apply {
            registerCorsConfiguration("/api/**", configuration)
            registerCorsConfiguration("/ws/**", configuration)
        }
    }

    @Bean
    fun filterChain(http: HttpSecurity): SecurityFilterChain =
        http
            .cors { it.configurationSource(corsConfigurationSource()) }
            .csrf { it.disable() }
            .sessionManagement { it.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED) }
            .securityContext { it.securityContextRepository(httpSessionSecurityContextRepository()) }
            .authorizeHttpRequests {
                it
                    // 1️⃣ Public endpoints (no authentication required)
                    .requestMatchers(HttpMethod.OPTIONS, "/api/**").permitAll()
                    .requestMatchers(HttpMethod.POST, "/api/auth/session").permitAll()
                    .requestMatchers(HttpMethod.POST, "/api/auth/migrate-passwords").permitAll()
                    .requestMatchers(HttpMethod.POST, "/api/auth/reset-passwords").permitAll()
                    .requestMatchers(HttpMethod.POST, "/api/otp/verification").permitAll()
                    .requestMatchers(HttpMethod.POST, "/api/otp").permitAll()
                    .requestMatchers(HttpMethod.POST, "/api/users/reset-password").permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/school-year/active-quarter").permitAll() // public
                    .requestMatchers(HttpMethod.GET, "/api/school-year/**").permitAll() // other GETs
                    .requestMatchers(HttpMethod.GET, "/api/school-profile").permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/health/**").permitAll()
                    .requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**", "/v3/api-docs.yaml",
                                    "/swagger-resources/**", "/webjars/**").permitAll()
                    .requestMatchers("/ws/**").permitAll()
                    .requestMatchers("/ws/info/**").permitAll()

                    // 2️⃣ Admin endpoints
                    .requestMatchers("/api/security/settings/**").hasRole("ADMIN")
                    .requestMatchers(HttpMethod.PATCH, "/api/school-year/quarter/*/activate").hasRole("ADMIN")
                    .requestMatchers(HttpMethod.POST, "/api/school-year/quarter").hasRole("ADMIN")
                    .requestMatchers(HttpMethod.PATCH, "/api/school-year/quarter/*/status").hasRole("ADMIN")
                    .requestMatchers(HttpMethod.PATCH, "/api/school-year/quarter/*/close").hasRole("ADMIN")
                    .requestMatchers(HttpMethod.DELETE, "/api/school-year/quarter/**").hasRole("ADMIN")
                    .requestMatchers(HttpMethod.POST, "/api/school-year").hasRole("ADMIN")
                    .requestMatchers(HttpMethod.PATCH, "/api/school-year/*/activate").hasRole("ADMIN")
                    .requestMatchers(HttpMethod.PATCH, "/api/school-year/*/archive").hasRole("ADMIN")
                    .requestMatchers(HttpMethod.DELETE, "/api/school-year/**").hasRole("ADMIN")
                    .requestMatchers(HttpMethod.PATCH, "/api/school-profile").hasRole("ADMIN")
                    .requestMatchers(HttpMethod.DELETE, "/api/school-profile/**").hasRole("ADMIN")
                    .requestMatchers("/api/subjects/**").hasAnyRole("ADMIN", "TEACHER", "ADVISER")
                    .requestMatchers("/api/adviser/**").hasAnyRole("ADVISER", "TEACHER")
                    .requestMatchers("/api/sections/**").hasAnyRole("ADMIN", "TEACHER", "ADVISER")
                    .requestMatchers("/api/notifications/templates/**").hasRole("ADMIN")
                    .requestMatchers("/api/system/backup/**").hasRole("ADMIN")

                    // 3️⃣ Any other request requires authentication
                    .anyRequest().authenticated()
            }

            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter::class.java)
            .build()
}
