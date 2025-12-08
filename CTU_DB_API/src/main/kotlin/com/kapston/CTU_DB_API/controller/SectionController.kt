package com.kapston.CTU_DB_API.controller

import com.kapston.CTU_DB_API.domain.dto.request.CreateSectionRequest
import com.kapston.CTU_DB_API.domain.dto.request.UpdateSectionRequest
import com.kapston.CTU_DB_API.domain.dto.response.SectionResponse
import com.kapston.CTU_DB_API.domain.dto.response.SectionDependencyResponse
import com.kapston.CTU_DB_API.service.abstraction.ProfileService
import com.kapston.CTU_DB_API.service.abstraction.SectionService
import com.kapston.CTU_DB_API.service.abstraction.UserService
import jakarta.validation.Valid
import org.springframework.data.domain.Page
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import java.util.*

@RestController
@RequestMapping("/api/sections")
class SectionController(
    private val sectionService: SectionService,
    private val userService: UserService,
    private val profileService: ProfileService
) {

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    fun create(
        @CookieValue("jwt") jwt: String,
        @Valid @RequestBody sectionRequest: CreateSectionRequest
    ): ResponseEntity<String> {
        val response = sectionService.create(sectionRequest)
        return ResponseEntity.status(HttpStatus.CREATED).body(response)
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'ADVISER')")
    fun search(
        @RequestParam(required = false) name: String?,
        @RequestParam(required = false) gradeLevel: String?,
        @RequestParam(required = false) adviserName: String?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "10") size: Int
    ): Page<SectionResponse> {
        return sectionService.search(
            gradeLevel,
            name,
            adviserName,
            page,
            size
        )
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    fun update(
        @PathVariable id: UUID,
        @Valid @RequestBody sectionRequest: UpdateSectionRequest
    ): ResponseEntity<String> {
        // Handle null adviser safely - adviser field contains ID, not name
        val user = sectionRequest.adviser?.let { profileService.getProfileEntityById(UUID.fromString(it)) }
        if (sectionRequest.adviser != null && user == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body("Adviser not found")
        }

        val response = sectionService.update(sectionRequest.toEntity(user, id))
        return ResponseEntity.status(HttpStatus.OK).body(response)
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    fun delete(
        @PathVariable id: UUID,
        @RequestParam(defaultValue = "false") forceDelete: Boolean
    ): ResponseEntity<String> {
        val response = sectionService.delete(id, forceDelete)
        return ResponseEntity.status(HttpStatus.OK).body(response)
    }

    @GetMapping("/{id}/dependencies")
    @PreAuthorize("hasRole('ADMIN')")
    fun getDependencies(@PathVariable id: UUID): ResponseEntity<SectionDependencyResponse> {
        val dependencies = sectionService.getDependencies(id)
        return ResponseEntity.status(HttpStatus.OK).body(dependencies)
    }
}
