-- Rename semester column to quarter in class_enrollments table
ALTER TABLE class_enrollments
RENAME COLUMN semester TO quarter;
