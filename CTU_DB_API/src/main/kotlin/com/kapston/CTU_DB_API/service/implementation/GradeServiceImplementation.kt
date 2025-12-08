package com.kapston.CTU_DB_API.service.implementation

import com.kapston.CTU_DB_API.domain.Enums.GradeType
import com.kapston.CTU_DB_API.domain.Enums.Quarter
import com.kapston.CTU_DB_API.domain.dto.response.GradeResponse
import com.kapston.CTU_DB_API.domain.entity.GradeEntity
import com.kapston.CTU_DB_API.repository.GradeRepository
import com.kapston.CTU_DB_API.repository.ProfileRepository
import com.kapston.CTU_DB_API.repository.SectionRepository
import com.kapston.CTU_DB_API.repository.SubjectRepository
import com.kapston.CTU_DB_API.service.abstraction.GradeService
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.*

@Service
class GradeServiceImplementation(
    private val gradeRepository: GradeRepository,
    private val profileRepository: ProfileRepository,
    private val sectionRepository: SectionRepository,
    private val subjectRepository: SubjectRepository
) : GradeService {

    @Transactional
    override fun recordGrade(
        studentId: UUID,
        subjectId: UUID,
        sectionId: UUID,
        quarter: String,
        gradeType: String,
        score: Double,
        totalScore: Double?
    ): GradeResponse {
        val student = profileRepository.findById(studentId)
            .orElseThrow { IllegalArgumentException("Student not found") }

        val subject = subjectRepository.findById(subjectId)
            .orElseThrow { IllegalArgumentException("Subject not found") }

        val section = sectionRepository.findById(sectionId)
            .orElseThrow { IllegalArgumentException("Section not found") }

        // Check for existing grade record
        val existingGrade = gradeRepository.findByStudentIdAndSubjectIdAndSectionIdAndQuarterAndGradeType(
            studentId, subjectId, sectionId, Quarter.fromString(quarter), GradeType.valueOf(gradeType.uppercase())
        )

        if (existingGrade != null) {
            // Update existing record
            existingGrade.score = score
            existingGrade.totalScore = totalScore
            existingGrade.updatedAt = java.time.LocalDateTime.now()
            val saved = gradeRepository.save(existingGrade)
            return saved.toResponse()
        }

        // Create new record
        val grade = GradeEntity(
            student = student,
            subject = subject,
            section = section,
            quarter = Quarter.fromString(quarter),
            gradeType = GradeType.valueOf(gradeType.uppercase()),
            score = score,
            totalScore = totalScore
        )

        val saved = gradeRepository.save(grade)
        return saved.toResponse()
    }

    @Transactional(readOnly = true)
    override fun getGradesForStudent(
        studentId: UUID,
        sectionId: UUID,
        quarter: String
    ): List<GradeResponse> {
        val quarterEnum = Quarter.fromString(quarter)
        return gradeRepository.findByStudentIdAndSectionIdAndQuarter(studentId, sectionId, quarterEnum)
            .map { it.toResponse() }
    }

    @Transactional(readOnly = true)
    override fun getGradesForSection(
        sectionId: UUID,
        subjectId: UUID,
        quarter: String
    ): List<GradeResponse> {
        val quarterEnum = Quarter.fromString(quarter)
        return gradeRepository.findBySectionIdAndSubjectIdAndQuarter(sectionId, subjectId, quarterEnum)
            .map { it.toResponse() }
    }

    @Transactional
    override fun calculateFinalGrade(
        studentId: UUID,
        subjectId: UUID,
        sectionId: UUID,
        quarter: String
    ): GradeResponse {
        val quarterEnum = Quarter.fromString(quarter)

        // Get all component grades for this student, subject, section, quarter
        val componentGrades = gradeRepository.findByStudentIdAndSectionIdAndQuarter(
            studentId, sectionId, quarterEnum
        ).filter { it.gradeType != GradeType.FINAL && it.subject.id == subjectId }

        if (componentGrades.isEmpty()) {
            throw IllegalStateException("No component grades found to calculate final grade")
        }

        // Calculate weighted average (simplified - equal weighting)
        val totalScore = componentGrades.sumOf { it.score }
        val totalPossible = componentGrades.sumOf { it.totalScore ?: 100.0 }
        val finalScore = if (totalPossible > 0) (totalScore / totalPossible) * 100.0 else 0.0

        // Check for existing final grade
        val existingFinalGrade = gradeRepository.findByStudentIdAndSubjectIdAndSectionIdAndQuarterAndGradeType(
            studentId, subjectId, sectionId, quarterEnum, GradeType.FINAL
        )

        val finalGrade = if (existingFinalGrade != null) {
            existingFinalGrade.score = finalScore
            existingFinalGrade.totalScore = 100.0
            existingFinalGrade.updatedAt = java.time.LocalDateTime.now()
            gradeRepository.save(existingFinalGrade)
        } else {
            val student = profileRepository.findById(studentId).orElseThrow()
            val subject = subjectRepository.findById(subjectId).orElseThrow()
            val section = sectionRepository.findById(sectionId).orElseThrow()

            val newFinalGrade = GradeEntity(
                student = student,
                subject = subject,
                section = section,
                quarter = quarterEnum,
                gradeType = GradeType.FINAL,
                score = finalScore,
                totalScore = 100.0
            )
            gradeRepository.save(newFinalGrade)
        }

        return finalGrade.toResponse()
    }

    @Transactional
    override fun updateGrade(
        gradeId: UUID,
        score: Double,
        totalScore: Double?
    ): GradeResponse {
        val grade = gradeRepository.findById(gradeId)
            .orElseThrow { IllegalArgumentException("Grade record not found") }

        grade.score = score
        grade.totalScore = totalScore
        grade.updatedAt = java.time.LocalDateTime.now()

        val saved = gradeRepository.save(grade)
        return saved.toResponse()
    }

    @Transactional
    override fun deleteGrade(gradeId: UUID) {
        if (!gradeRepository.existsById(gradeId)) {
            throw IllegalArgumentException("Grade record not found")
        }
        gradeRepository.deleteById(gradeId)
    }

    private fun GradeEntity.toResponse(): GradeResponse {
        val ts = totalScore
        return GradeResponse(
            id = id!!,
            studentId = student.id!!,
            studentName = "${student.firstName} ${student.lastName}",
            subjectId = subject.id!!,
            subjectName = subject.name,
            sectionId = section.id!!,
            sectionName = section.name,
            quarter = quarter,
            gradeType = gradeType,
            score = score,
            totalScore = ts ?: 100.0,
            percentage = if (ts != null && ts > 0) (score / ts) * 100.0 else (score / 100.0) * 100.0,
            createdAt = createdAt!!,
            updatedAt = updatedAt
        )
    }
}
