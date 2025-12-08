package com.kapston.CTU_DB_API.service

import com.kapston.CTU_DB_API.CustomException.UserNotFoundException
import com.kapston.CTU_DB_API.domain.entity.UserEntity
import com.kapston.CTU_DB_API.repository.UserRepository
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.userdetails.User
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.security.core.userdetails.UsernameNotFoundException
import org.springframework.stereotype.Service

@Service
class CustomUserDetailsService(
    private val userRepository: UserRepository
) : UserDetailsService {

    override fun loadUserByUsername(username: String): UserDetails {
        val userEntity: UserEntity = userRepository.findByEmail(username)
            ?: throw UsernameNotFoundException("User not found with email: $username")

        // Check if user is active
        if (userEntity.status != com.kapston.CTU_DB_API.domain.Enums.StatusEnum.ACTIVE) {
            throw UsernameNotFoundException("User account is not active")
        }

        // Create authorities based on role
        val authorities = listOf(SimpleGrantedAuthority("ROLE_${userEntity.role.name}"))

        return User.builder()
            .username(userEntity.email)
            .password(userEntity.password)
            .authorities(authorities)
            .accountExpired(false)
            .accountLocked(false)
            .credentialsExpired(false)
            .disabled(false)
            .build()
    }
}
