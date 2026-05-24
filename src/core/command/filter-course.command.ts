export interface FilterCourseCommand {
  search?: string;
  modality?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}
