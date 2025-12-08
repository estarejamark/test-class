package com.kapston.CTU_DB_API.controller

import com.kapston.CTU_DB_API.CustomException.SubjectAlreadyExists
import com.kapston.CTU_DB_API.domain.dto.request.SubjectRequest
import com.kapston.CTU_DB_API.domain.dto.request.UpdateSubjectRequest
import com.kapston.CTU_DB_API.domain.dto.response.SubjectResponse
import com.kapston.CTU_DB_API.service.abstraction.SubjectService
import jakarta.validation.Valid
import org.springframework.data.domain.Page
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import java.util.UUID

@RestController
@RequestMapping("/api/subjects")
@PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'ADVISER')")
class SubjectController(
    private val subjectService: SubjectService
) {

    @PostMapping
    fun save(@Valid @RequestBody subjectRequest: SubjectRequest): ResponseEntity<String> {
        val subjectResponse = subjectService.save(subjectRequest)
        return ResponseEntity.status(HttpStatus.CREATED).body(subjectResponse)
    }

    @PutMapping
    fun update(@Valid @RequestBody updateSubjectRequest: UpdateSubjectRequest): ResponseEntity<String> {
        try {
            val subjectResponse = subjectService.update(updateSubjectRequest)
            return ResponseEntity.status(HttpStatus.CREATED).body(subjectResponse)
        } catch (e: SubjectAlreadyExists) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.message)
        }
    }

    @GetMapping
    fun search(
        @RequestParam(required = false) subjectCode: String?,
        @RequestParam(required = false) name: String?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "10") size: Int,
    ): Page<SubjectResponse> {
        return subjectService.search(subjectCode, name, page, size)
    }

    @DeleteMapping
    fun delete(@RequestParam(required = true) id: UUID): ResponseEntity<Unit> {
        subjectService.delete(id)
        return ResponseEntity.status(HttpStatus.OK).body(Unit)
    }
}
