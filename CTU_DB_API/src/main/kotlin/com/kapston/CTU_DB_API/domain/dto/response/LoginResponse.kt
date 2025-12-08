package com.kapston.CTU_DB_API.domain.dto.response

data class LoginResponse(val userResponse: UserResponse, val authorization: TokenResponse?, val profileComplete: Boolean)
