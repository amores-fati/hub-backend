export interface FilterStudentCommand {
  search?: string;
  city?: string;
  disabilityType?: string;
  courseId?: string;
  page?: number;
  pageSize?: 20 | 50;
}
