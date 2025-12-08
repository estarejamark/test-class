package com.kapston.CTU_DB_API.domain.dto.request

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonProperty
import com.kapston.CTU_DB_API.domain.entity.UserEntity
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank

  data class LoginRequest @JsonCreator constructor(
      @JsonProperty("email")
    @field:NotBlank(message = "Email is required")
    @field:Email(message = "Invalid email format")
      val email: String,
  
      @JsonProperty("password")
     @field:NotBlank(message = "Password is required")
      val password: String
) {
    fun toEntity(): UserEntity = UserEntity(
       email = email,
        password = password
    )
}

  