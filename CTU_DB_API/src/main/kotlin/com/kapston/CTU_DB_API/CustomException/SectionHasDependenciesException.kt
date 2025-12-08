package com.kapston.CTU_DB_API.CustomException

/**
 * Exception thrown when attempting to delete a section that has dependent records
 * in class_enrollments or schedule tables.
 */
class SectionHasDependenciesException(
    message: String,
    val sectionId: String? = null,
    val classEnrollmentsCount: Int = 0,
    val scheduleEntriesCount: Int = 0
) : RuntimeException(message) {

    companion object {
        fun createWithDetails(
            sectionId: String,
            classEnrollmentsCount: Int,
            scheduleEntriesCount: Int
        ): SectionHasDependenciesException {
            val details = buildString {
                append("Cannot delete section with ID '$sectionId' because it has dependent records: ")
                if (classEnrollmentsCount > 0) {
                    append("$classEnrollmentsCount class enrollment(s)")
                }
                if (scheduleEntriesCount > 0) {
                    if (classEnrollmentsCount > 0) append(" and ")
                    append("$scheduleEntriesCount schedule entry(ies)")
                }
                append(". Please remove all dependent records before deleting the section.")
            }

            return SectionHasDependenciesException(
                message = details,
                sectionId = sectionId,
                classEnrollmentsCount = classEnrollmentsCount,
                scheduleEntriesCount = scheduleEntriesCount
            )
        }
    }
}
