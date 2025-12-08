// Grade interfaces
export interface GradeResponse {
  id: string;
  studentId: string;
  studentName: string;
  subjectId: string;
  subjectName: string;
  sectionId: string;
  sectionName: string;
  quarter: string;
  gradeType: string;
  score: number;
  totalScore: number;
  percentage: number;
  createdAt: string;
  updatedAt?: string;
}

// Feedback interfaces
export interface FeedbackResponse {
  id: string;
  studentId: string;
  studentName: string;
  sectionId: string;
  sectionName: string;
  quarter: string;
  feedback: string;
  createdAt: string;
  updatedAt?: string;
}
